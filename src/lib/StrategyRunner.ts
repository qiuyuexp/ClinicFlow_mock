import type { Strategy, Step } from './strategies/types';
import { TabManager } from './TabManager';
import { DebuggerManager } from './DebuggerManager';
import { AIService } from './services/AIService';
import type { StrategyEvent } from './types';

type EventListener = (event: StrategyEvent) => void;

export class StrategyRunner {
    private static instance: StrategyRunner;
    private tabManager: TabManager;
    private debuggerManager: DebuggerManager;
    private aiService: AIService;
    private listeners: EventListener[] = [];

    private constructor() {
        this.tabManager = TabManager.getInstance();
        this.debuggerManager = DebuggerManager.getInstance();
        this.aiService = AIService.getInstance();
    }

    public static getInstance(): StrategyRunner {
        if (!StrategyRunner.instance) {
            StrategyRunner.instance = new StrategyRunner();
        }
        return StrategyRunner.instance;
    }

    public onEvent(callback: EventListener) {
        this.listeners.push(callback);
    }

    private emit(event: StrategyEvent) {
        this.listeners.forEach(cb => cb(event));
    }

    public async execute(strategy: Strategy, inputData: Record<string, any> = {}, initialTabId: number | null = null): Promise<Record<string, any>> {
        console.log(`[StrategyRunner] Starting strategy: ${strategy.name} with inputs:`, inputData);
        this.emit({
            type: 'STRATEGY_COMPLETE',
            message: `Starting Strategy: ${strategy.name}`,
            timestamp: Date.now(),
            status: 'pending'
        });

        let currentTabId: number | null = initialTabId;
        let outputData: Record<string, any> = {};

        try {
            for (const step of strategy.steps) {
                console.log(`[StrategyRunner] Executing step: ${step.id} (${step.action})`);

                // Inject Variables into Step Params
                const processedParams = { ...step.params };
                if (processedParams.text) {
                    processedParams.text = this.injectVariables(processedParams.text, inputData);
                }

                this.emit({
                    type: 'STEP_START',
                    stepId: step.id,
                    message: `Executing ${step.id} (${step.action})`,
                    timestamp: Date.now(),
                    status: 'pending'
                });

                const stepResult = await this.executeStep({ ...step, params: processedParams }, currentTabId);

                if (step.action === 'READ' && stepResult && typeof stepResult === 'object') {
                    // Merge read data into output
                    outputData = { ...outputData, ...stepResult };
                } else if (typeof stepResult === 'number') {
                    // It's a tab ID
                    currentTabId = stepResult;
                }

                this.emit({
                    type: 'STEP_COMPLETE',
                    stepId: step.id,
                    message: `Completed ${step.id}`,
                    timestamp: Date.now(),
                    status: 'success'
                });

                // Small delay between steps for stability
                await new Promise(r => setTimeout(r, 500));
            }
            console.log(`[StrategyRunner] Strategy completed: ${strategy.name}`);
            this.emit({
                type: 'STRATEGY_COMPLETE',
                message: `Strategy Execution Finished: ${strategy.name}`,
                timestamp: Date.now(),
                status: 'success'
            });

            return outputData;

        } catch (error: any) {
            console.error(`[StrategyRunner] Strategy failed: ${strategy.name}`, error);
            this.emit({
                type: 'ERROR',
                message: `Strategy Failed: ${error.message || 'Unknown error'}`,
                timestamp: Date.now(),
                status: 'error'
            });
            throw error;
        } finally {
            // Cleanup
        }
    }

    private injectVariables(text: string, data: Record<string, any>): string {
        return text.replace(/\{\{(.*?)\}\}/g, (_, key) => {
            return data[key] || `{{${key}}}`;
        });
    }

    private async executeStep(step: Step, currentTabId: number | null): Promise<number | Record<string, any> | null> {
        switch (step.action) {
            case 'GOTO':
                if (!step.params.url) throw new Error('GOTO missing URL');
                return await this.tabManager.createShadowTab(step.params.url);

            case 'READ':
                if (!currentTabId) throw new Error('No active tab for READ');
                if (!step.params.selector) throw new Error('READ missing selector');
                const val = await this.debuggerManager.getInputValue(currentTabId, step.params.selector);
                const key = step.id.replace('read-', '');

                this.emit({
                    type: 'STEP_COMPLETE',
                    stepId: step.id,
                    message: `Extracted ${key}: "${val}"`,
                    timestamp: Date.now(),
                    status: 'success'
                });

                return { [key]: val };

            case 'CLICK':
                if (!currentTabId) throw new Error('No active tab for CLICK');

                let targetX = step.params.x;
                let targetY = step.params.y;

                // Priority 1: Selector
                if (step.params.selector) {
                    try {
                        const root = await this.debuggerManager.getDocument(currentTabId);
                        const nodeId = await this.debuggerManager.querySelector(currentTabId, root.root.nodeId, step.params.selector);

                        if (nodeId) {
                            const box = await this.debuggerManager.getBoxModel(currentTabId, nodeId);
                            targetX = box.x;
                            targetY = box.y;
                            console.log(`[StrategyRunner] Resolved selector "${step.params.selector}" to (${targetX}, ${targetY})`);
                        } else {
                            throw new Error('Selector not found');
                        }
                    } catch (err) {
                        console.warn(`[StrategyRunner] Selector failed: ${err}`);

                        // Priority 2: AI Healing
                        this.emit({
                            type: 'STEP_START',
                            message: `❌ Selector failed. Initiating AI Healing...`,
                            timestamp: Date.now(),
                            status: 'error'
                        });

                        try {
                            const screenshot = await this.debuggerManager.captureScreenshot(currentTabId);
                            const description = step.params.description || 'target element';

                            this.emit({
                                type: 'STEP_START',
                                message: `🧠 AI Analyzing visual target: "${description}"...`,
                                timestamp: Date.now(),
                                status: 'pending'
                            });

                            const aiCoords = await this.aiService.getCoordinates(description, screenshot);

                            if (aiCoords) {
                                targetX = aiCoords.x;
                                targetY = aiCoords.y;
                                this.emit({
                                    type: 'STEP_COMPLETE',
                                    message: `✅ AI found target at (${targetX}, ${targetY})`,
                                    timestamp: Date.now(),
                                    status: 'success'
                                });
                            } else {
                                throw new Error('AI could not locate element');
                            }
                        } catch (aiErr: any) {
                            throw new Error(`AI Healing failed: ${aiErr.message}`);
                        }
                    }
                }

                if (targetX === undefined || targetY === undefined)
                    throw new Error('CLICK missing coordinates and healing failed');

                await this.debuggerManager.clickAt(currentTabId, targetX, targetY);
                return currentTabId;

            case 'TYPE':
                if (!currentTabId) throw new Error('No active tab for TYPE');
                if (step.params.text === undefined) throw new Error('TYPE missing text');
                await this.debuggerManager.insertText(currentTabId, step.params.text);
                return currentTabId;

            case 'WAIT':
                const timeout = step.params.timeout || 1000;
                await new Promise(resolve => setTimeout(resolve, timeout));
                return currentTabId;

            default:
                console.warn(`Unknown action: ${step.action}`);
                return currentTabId;
        }
    }
}

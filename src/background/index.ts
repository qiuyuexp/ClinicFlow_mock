import { DebuggerManager } from '../lib/DebuggerManager';
import { StrategyRunner } from '../lib/StrategyRunner';
import { STRATEGIES } from '../lib/strategies/catalog';
import type { Strategy } from '../lib/strategies/types';
import { MSG_ATTACH_DEBUGGER, MSG_STRATEGY_UPDATE } from '../lib/types';

console.log('ClinicFlow Background Service Worker Started');

// Initialize Manager
const debuggerManager = DebuggerManager.getInstance();
const strategyRunner = StrategyRunner.getInstance();



// Listen for Strategy Events and broadcast
strategyRunner.onEvent((event) => {
    chrome.runtime.sendMessage({
        type: MSG_STRATEGY_UPDATE,
        payload: event
    }).catch(() => {
        // Ignore errors if no listeners (e.g. sidepanel closed)
    });
});

// Setup sidepanel behavior
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error('Failed to set panel behavior:', error));

// Message Listener
chrome.runtime.onMessage.addListener((message: any, _sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
    console.log('Background received message:', message);

    if (message.type === MSG_ATTACH_DEBUGGER && message.payload?.tabId) {
        debuggerManager.attach(message.payload.tabId)
            .then(() => sendResponse({ success: true }))
            .catch((err) => sendResponse({ success: false, error: err.message }));
        return true;
    }

    if (message.type === 'DEBUGGER_COMMAND' && message.payload?.tabId) {
        const { tabId, command, args } = message.payload;

        const action = async () => {
            if (command === 'CLICK') {
                await debuggerManager.clickAt(tabId, args.x, args.y);
            } else if (command === 'TYPE') {
                await debuggerManager.insertText(tabId, args.text);
            }
        };

        action()
            .then(() => sendResponse({ success: true }))
            .catch((err) => sendResponse({ success: false, error: err.message }));
        return true;
    }

    if (message.type === 'EXECUTE_STRATEGY') {
        const strategyId = message.payload.id;
        const inputData = message.payload.inputData || {};

        const strategy = STRATEGIES.find(s => s.id === strategyId);

        if (strategy) {
            // Fix URL for extension context
            const fixedStrategy = { ...strategy };
            if (fixedStrategy.steps[0].action === 'GOTO' && fixedStrategy.steps[0].params.url?.includes('__MSG_@@extension_id__')) {
                const urlParam = fixedStrategy.steps[0].params.url;
                if (typeof urlParam === 'string' && urlParam.includes('__MSG_@@extension_id__')) {
                    const relativePath = urlParam.split('__MSG_@@extension_id__/')[1];
                    fixedStrategy.steps[0].params.url = chrome.runtime.getURL(relativePath);
                }
            }

            strategyRunner.execute(fixedStrategy as Strategy, inputData)
                .then((result) => sendResponse({ success: true, result }))
                .catch((err) => sendResponse({ success: false, error: err.message }));
        } else {
            sendResponse({ success: false, error: 'Strategy not found' });
        }
        return true;
    }

    if (message.type === 'EXECUTE_CLINICAL_BRIDGE') {
        const runBridge = async () => {
            try {
                // 1. Extract from CMS
                // We assume the user is ALREADY on the CMS page. 
                // StrategyRunner usually opens a new tab. 
                // For this prototype, let's allow the 'GOTO' step in 'extract-cms' to open a new shadow tab of the CMS mock for consistency.
                // In a real app, we'd Attach to the active tab. 
                // Let's stick to the current "Shadow Tab" architecture for stability.

                const cmsStrategy = STRATEGIES.find(s => s.id === 'extract-cms');
                if (!cmsStrategy) throw new Error('CMS Strategy missing');

                // Extract active tab ID from payload
                const activeTabId = message.payload?.tabId;
                if (!activeTabId) throw new Error('Active Tab ID required for CMS Extraction');

                console.log(`[Background] Step 1: Extracting CMS Data from Tab ${activeTabId}...`);
                // CRITICAL FIX: Pass activeTabId as the 3rd argument to execute()
                const cmsResult = await strategyRunner.execute(cmsStrategy as Strategy, {}, activeTabId);
                console.log('[Background] Extraction Result:', cmsResult);

                if (!cmsResult.nric || !cmsResult.name) {
                    throw new Error('Failed to extract Patient Name/NRIC');
                }

                // 2. Run Parallel TPAs
                console.log('[Background] Step 2: Running Parallel Verification...');

                const tpa1 = STRATEGIES.find(s => s.id === 'tpa-parallel-1')!;
                const tpa2 = STRATEGIES.find(s => s.id === 'tpa-parallel-2')!;

                // Fix URLs using same dynamic logic or catalog truth
                const fixUrl = (s: any) => {
                    const step = s.steps.find((st: any) => st.action === 'GOTO');
                    if (step && step.params.url && step.params.url.includes('__MSG_@@extension_id__')) {
                        step.params.url = chrome.runtime.getURL(step.params.url.split('__MSG_@@extension_id__/')[1]);
                    }
                };

                const fixedTpa1 = { ...tpa1 }; // Clone
                fixUrl(fixedTpa1);

                const fixedTpa2 = { ...tpa2 }; // Clone
                fixUrl(fixedTpa2);

                // Run Concurrent
                await Promise.all([
                    strategyRunner.execute(fixedTpa1 as Strategy, cmsResult),
                    strategyRunner.execute(fixedTpa2 as Strategy, cmsResult)
                ]);

                return { success: true, extracted: cmsResult };

            } catch (err: any) {
                console.error('[Background] Bridge Failed:', err);
                throw err;
            }
        };

        runBridge()
            .then((res) => sendResponse(res))
            .catch((err) => sendResponse({ success: false, error: err.message }));
        return true;
    }
});

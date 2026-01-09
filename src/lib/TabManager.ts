import { DebuggerManager } from './DebuggerManager';

export class TabManager {
    private static instance: TabManager;
    private shadowTabs: Set<number> = new Set();
    private debuggerManager: DebuggerManager;

    private constructor() {
        this.debuggerManager = DebuggerManager.getInstance();

        // Cleanup listeners
        chrome.tabs.onRemoved.addListener((tabId) => {
            this.shadowTabs.delete(tabId);
        });
    }

    public static getInstance(): TabManager {
        if (!TabManager.instance) {
            TabManager.instance = new TabManager();
        }
        return TabManager.instance;
    }

    public async createShadowTab(url: string): Promise<number> {
        // Create tab but don't focus it (make it less intrusive)
        const tab = await chrome.tabs.create({ url, active: false });

        if (!tab.id) {
            throw new Error('Failed to create shadow tab');
        }

        this.shadowTabs.add(tab.id);

        // Wait for load to complete before attaching? 
        // For now, let's just wait a bit or attach immediately. 
        // Usually better to wait for status complete, but for speed we attach now.

        // We need to attach debugger to control it
        try {
            await this.debuggerManager.attach(tab.id);
        } catch (e) {
            console.error('Failed to attach to shadow tab', e);
            // Clean up if attach fails
            await this.closeShadowTab(tab.id);
            throw e;
        }

        return tab.id;
    }

    public async closeShadowTab(tabId: number): Promise<void> {
        if (this.shadowTabs.has(tabId)) {
            try {
                await this.debuggerManager.detach(tabId); // Good practice
                await chrome.tabs.remove(tabId);
            } catch (e) {
                console.warn('Error closing shadow tab', e);
            }
            this.shadowTabs.delete(tabId);
        }
    }

    public getShadowTabs(): number[] {
        return Array.from(this.shadowTabs);
    }
}

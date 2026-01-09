export class DebuggerManager {
  private static instance: DebuggerManager;
  private attachedTabs: Set<number> = new Set();

  private constructor() {
    chrome.debugger.onDetach.addListener(this.handleDetach.bind(this));
  }

  public static getInstance(): DebuggerManager {
    if (!DebuggerManager.instance) {
      DebuggerManager.instance = new DebuggerManager();
    }
    return DebuggerManager.instance;
  }

  private handleDetach(source: chrome.debugger.Debuggee, reason: string) {
    if (source.tabId) {
      this.attachedTabs.delete(source.tabId);
      console.log(`[DebuggerManager] Detached from tab ${source.tabId}: ${reason}`);
    }
  }

  public async attach(tabId: number): Promise<void> {
    if (this.attachedTabs.has(tabId)) {
      console.log(`[DebuggerManager] Already attached to tab ${tabId}`);
      return;
    }

    try {
      await chrome.debugger.attach({ tabId }, '1.3');
      this.attachedTabs.add(tabId);
      console.log(`[DebuggerManager] Successfully attached to tab ${tabId}`);
    } catch (error) {
      console.error(`[DebuggerManager] Failed to attach to tab ${tabId}:`, error);
      throw error;
    }
  }

  public async detach(tabId: number): Promise<void> {
    if (!this.attachedTabs.has(tabId)) return;

    try {
      await chrome.debugger.detach({ tabId });
      this.attachedTabs.delete(tabId);
      console.log(`[DebuggerManager] Successfully detached from tab ${tabId}`);
    } catch (error) {
      console.error(`[DebuggerManager] Failed to detach from tab ${tabId}:`, error);
      throw error;
    }
  }

  public async ensureAttached(tabId: number): Promise<void> {
    if (!this.attachedTabs.has(tabId)) {
      console.warn(`[DebuggerManager] Tab ${tabId} not attached. Attempting to re-attach...`);
      await this.attach(tabId);
    }
  }

  public async sendCommand(tabId: number, method: string, params: any = {}): Promise<any> {
    await this.ensureAttached(tabId);

    try {
      console.log(`[DebuggerManager] Sending command ${method} to tab ${tabId}`, params);
      const result = await chrome.debugger.sendCommand({ tabId }, method, params);
      return result;
    } catch (error) {
      console.error(`[DebuggerManager] Command ${method} failed for tab ${tabId}:`, error);
      throw error;
    }
  }

  // Atomic Action: Click at coordinates
  public async clickAt(tabId: number, x: number, y: number): Promise<void> {
    try {
      await this.sendCommand(tabId, 'Input.dispatchMouseEvent', {
        type: 'mousePressed',
        x,
        y,
        button: 'left',
        clickCount: 1
      });
      // Small delay might be needed in real scenarios, but atomic for now
      await this.sendCommand(tabId, 'Input.dispatchMouseEvent', {
        type: 'mouseReleased',
        x,
        y,
        button: 'left',
        clickCount: 1
      });
      console.log(`[DebuggerManager] Clicked at (${x}, ${y}) on tab ${tabId}`);
    } catch (error) {
      console.error(`[DebuggerManager] Failed to click at (${x}, ${y}) on tab ${tabId}:`, error);
      throw error;
    }
  }

  // Atomic Action: Insert text
  public async insertText(tabId: number, text: string): Promise<void> {
    try {
      // Input.insertText is reliable for typing into focused fields
      await this.sendCommand(tabId, 'Input.insertText', { text });
      console.log(`[DebuggerManager] Inserted text "${text}" into tab ${tabId}`);
    } catch (error) {
      console.error(`[DebuggerManager] Failed to insert text into tab ${tabId}:`, error);
      throw error;
    }
  }

  // --- Phase 5: AI Healing Capabilities ---

  public async getDocument(tabId: number): Promise<any> {
    return this.sendCommand(tabId, 'DOM.getDocument', { depth: -1 });
  }

  public async querySelector(tabId: number, nodeId: number, selector: string): Promise<number | null> {
    try {
      const result: any = await this.sendCommand(tabId, 'DOM.querySelector', { nodeId, selector });
      return result.nodeId || null;
    } catch (error) {
      console.warn(`[DebuggerManager] Selector "${selector}" not found on tab ${tabId}`);
      return null;
    }
  }

  public async getBoxModel(tabId: number, nodeId: number): Promise<{ x: number, y: number, width: number, height: number }> {
    const result: any = await this.sendCommand(tabId, 'DOM.getBoxModel', { nodeId });
    const model = result.model;
    // Calculate center
    const x = model.content[0] + (model.width / 2);
    const y = model.content[1] + (model.height / 2);
    return { x, y, width: model.width, height: model.height };
  }

  public async captureScreenshot(tabId: number): Promise<string> {
    const result: any = await this.sendCommand(tabId, 'Page.captureScreenshot', { format: 'png' });
    return result.data; // Base64 string
  }

  public async getInputValue(tabId: number, selector: string): Promise<string> {
    try {
      const root = await this.getDocument(tabId);
      const nodeId = await this.querySelector(tabId, root.root.nodeId, selector);

      if (!nodeId) throw new Error(`Element ${selector} not found`);

      // Get value attribute? Or use Runtime.evaluate to get .value property which is more reliable for inputs
      // Using Runtime.evaluate is generally safer for live DOM properties
      const expression = `document.querySelector('${selector}').value || document.querySelector('${selector}').innerText`;
      const result: any = await this.sendCommand(tabId, 'Runtime.evaluate', { expression });

      return result.result.value;
    } catch (error) {
      console.error(`[DebuggerManager] Failed to get value from ${selector}:`, error);
      throw error;
    }
  }
}

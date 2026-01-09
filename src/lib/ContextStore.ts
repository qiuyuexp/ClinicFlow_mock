export class ContextStore {
    private static instance: ContextStore;
    private context: Record<string, any> = {};

    private constructor() { }

    public static getInstance(): ContextStore {
        if (!ContextStore.instance) {
            ContextStore.instance = new ContextStore();
        }
        return ContextStore.instance;
    }

    public setContext(data: Record<string, any>) {
        this.context = { ...this.context, ...data };
        console.log('[ContextStore] Updated:', this.context);
    }

    public getContext(): Record<string, any> {
        return this.context;
    }

    public clear() {
        this.context = {};
    }
}

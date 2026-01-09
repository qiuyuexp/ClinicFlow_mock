export type ActionType = 'GOTO' | 'CLICK' | 'TYPE' | 'READ' | 'WAIT';

export interface Step {
    id: string;
    action: ActionType;
    params: {
        url?: string;         // For GOTO
        x?: number;           // For CLICK (initial fixed coords or fallback)
        y?: number;
        selector?: string;    // For Robust Logic
        description?: string; // For AI Visual Fallback
        text?: string;        // For TYPE
        timeout?: number;     // For WAIT
    };
    next?: string; // ID of next step, default to next index if undefined
}

export interface Strategy {
    id: string;
    name: string;
    description: string;
    steps: Step[];
}

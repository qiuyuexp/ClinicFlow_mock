export interface Message {
    type: string;
    payload?: any;
}

export const MSG_ATTACH_DEBUGGER = 'ATTACH_DEBUGGER';
export const MSG_DEBUGGER_ATTACHED = 'DEBUGGER_ATTACHED';
export const MSG_STRATEGY_UPDATE = 'STRATEGY_UPDATE';

export interface StrategyEvent {
    type: 'STEP_START' | 'STEP_COMPLETE' | 'STRATEGY_COMPLETE' | 'ERROR';
    stepId?: string;
    message: string;
    timestamp: number;
    status: 'pending' | 'success' | 'error';
}

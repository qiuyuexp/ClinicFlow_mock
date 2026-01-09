import React from 'react';
import type { StrategyEvent } from '../lib/types';

interface TimelineProps {
    events: StrategyEvent[];
    onClear: () => void;
}

const Timeline: React.FC<TimelineProps> = ({ events, onClear }) => {
    const getIcon = (status: string) => {
        switch (status) {
            case 'success': return '✅';
            case 'error': return '❌';
            default: return '⏳';
        }
    };

    const getColor = (status: string) => {
        switch (status) {
            case 'success': return 'text-green-600 border-green-200 bg-green-50';
            case 'error': return 'text-red-600 border-red-200 bg-red-50';
            default: return 'text-blue-600 border-blue-200 bg-blue-50';
        }
    };

    return (
        <section className="p-4 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col max-h-[400px]">
            <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold text-xs uppercase tracking-wider text-slate-500">Live Timeline</h2>
                <button onClick={onClear} className="text-xs text-slate-400 hover:text-slate-600">
                    Clear Logs
                </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {events.length === 0 && (
                    <div className="text-center text-slate-400 text-xs py-4">
                        Ready to start...
                    </div>
                )}
                {events.map((event, idx) => (
                    <div key={idx} className={`p-3 rounded border text-sm flex gap-3 ${getColor(event.status)}`}>
                        <span className="text-base">{getIcon(event.status)}</span>
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <span className="font-medium">{event.message}</span>
                                <span className="text-xs opacity-70 font-mono">
                                    {new Date(event.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </span>
                            </div>
                            {event.stepId && <div className="text-xs opacity-75 mt-1 font-mono">Step: {event.stepId}</div>}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default Timeline;

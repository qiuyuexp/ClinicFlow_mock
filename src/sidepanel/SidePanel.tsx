import React, { useState, useEffect } from 'react';
import { MSG_ATTACH_DEBUGGER, MSG_STRATEGY_UPDATE, type StrategyEvent } from '../lib/types';
import Timeline from './Timeline';

const SidePanel: React.FC = () => {
    const [status, setStatus] = useState<string>('Idle');
    const [events, setEvents] = useState<StrategyEvent[]>([]);

    useEffect(() => {
        const listener = (message: any) => {
            if (message.type === MSG_STRATEGY_UPDATE) {
                setEvents(prev => [message.payload, ...prev]); // Newest first
            }
        };
        chrome.runtime.onMessage.addListener(listener);
        return () => chrome.runtime.onMessage.removeListener(listener);
    }, []);

    const handleAttach = async () => {
        // ... (existing code) ...
        // Get current tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
            console.log('Requesting attach to tab:', tab.id);
            chrome.runtime.sendMessage({ type: MSG_ATTACH_DEBUGGER, payload: { tabId: tab.id } }, (response: any) => {
                if (chrome.runtime.lastError) {
                    setStatus(`Error: ${chrome.runtime.lastError.message}`);
                } else {
                    setStatus(`Response: ${JSON.stringify(response)}`);
                }
            });
        } else {
            setStatus('No active tab found');
        }
    };

    // Interaction State
    const [coords, setCoords] = useState({ x: 0, y: 0 });
    // ...

    const [text, setText] = useState('');

    const sendCommand = async (type: string, payload: any) => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.id) {
            setStatus('No active tab');
            return;
        }

        setStatus(`Sending ${type}...`);
        chrome.runtime.sendMessage({
            type: 'DEBUGGER_COMMAND', // We need to add this type handler in background
            payload: { tabId: tab.id, command: type, args: payload }
        }, (response: any) => {
            if (chrome.runtime.lastError) {
                setStatus(`Error: ${chrome.runtime.lastError.message}`);
            } else {
                setStatus(`Result: ${JSON.stringify(response)}`);
            }
        });
    };

    const openMock = (page: string) => {
        chrome.tabs.create({ url: chrome.runtime.getURL(`mocks/${page}`) });
    };

    return (
        <div className="p-4 w-full h-screen flex flex-col font-sans text-slate-800 overflow-y-auto">
            <header className="mb-6">
                <h1 className="text-2xl font-bold text-blue-900">ClinicFlow</h1>
                <p className="text-sm text-slate-500">Next Gen AI Agent - DevTools</p>
            </header>

            <main className="flex-1 flex flex-col gap-6">
                {/* Status Section */}
                <section className="p-4 bg-white rounded-xl shadow-sm border border-slate-200">
                    <h2 className="font-semibold mb-2 text-xs uppercase tracking-wider text-slate-500">System Status</h2>
                    <div className="text-xs font-mono bg-slate-100 p-2 rounded break-all min-h-[3rem]">
                        {status}
                    </div>
                    <button
                        onClick={handleAttach}
                        className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded transition-colors"
                    >
                        Attach Debugger
                    </button>
                </section>

                {/* Timeline */}
                <Timeline events={events} onClear={() => setEvents([])} />

                {/* Automation Strategies */}
                <section className="p-4 bg-white rounded-xl shadow-sm border border-slate-200">
                    <h2 className="font-semibold mb-2 text-xs uppercase tracking-wider text-slate-500">Mock Environment</h2>
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => openMock('cms_legacy.html')} className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-2 rounded text-xs font-medium border border-slate-300">
                            Legacy CMS
                        </button>
                        <button onClick={() => openMock('cms_modern.html')} className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-2 rounded text-xs font-medium border border-slate-300">
                            Modern CMS
                        </button>
                        <button onClick={() => openMock('tpa_fullerton.html')} className="bg-blue-50 hover:bg-blue-100 text-blue-700 py-2 px-2 rounded text-xs font-medium border border-blue-200">
                            Fullerton TPA
                        </button>
                        <button onClick={() => openMock('tpa_da_flow.html')} className="bg-red-50 hover:bg-red-100 text-red-700 py-2 px-2 rounded text-xs font-medium border border-red-200">
                            DA Flow TPA
                        </button>
                    </div>
                </section>

                {/* Interaction Controls */}
                <section className="p-4 bg-white rounded-xl shadow-sm border border-slate-200">
                    <h2 className="font-semibold mb-2 text-xs uppercase tracking-wider text-slate-500">CDP Controls</h2>

                    <div className="space-y-4">
                        {/* Click Test */}
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-xs text-slate-500 block mb-1">X</label>
                                <input type="number" value={coords.x} onChange={e => setCoords({ ...coords, x: parseInt(e.target.value) })}
                                    className="w-full text-sm border rounded px-2 py-1" />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 block mb-1">Y</label>
                                <input type="number" value={coords.y} onChange={e => setCoords({ ...coords, y: parseInt(e.target.value) })}
                                    className="w-full text-sm border rounded px-2 py-1" />
                            </div>
                            <button onClick={() => sendCommand('CLICK', coords)}
                                className="col-span-2 bg-orange-100 hover:bg-orange-200 text-orange-800 py-1 rounded text-sm font-medium border border-orange-200">
                                Dispatch Click
                            </button>
                        </div>

                        {/* Type Test */}
                        <div>
                            <label className="text-xs text-slate-500 block mb-1">Text Input</label>
                            <div className="flex gap-2">
                                <input type="text" value={text} onChange={e => setText(e.target.value)}
                                    className="flex-1 text-sm border rounded px-2 py-1" placeholder="Type here..." />
                                <button onClick={() => sendCommand('TYPE', { text })}
                                    className="bg-green-100 hover:bg-green-200 text-green-800 px-3 rounded text-sm font-medium border border-green-200">
                                    Type
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Strategy Controls */}
                <section className="p-4 bg-white rounded-xl shadow-sm border border-slate-200">
                    <h2 className="font-semibold mb-2 text-xs uppercase tracking-wider text-slate-500">Automation Strategies</h2>
                    <button
                        onClick={() => {
                            setStatus('Running Strategy...');
                            chrome.runtime.sendMessage({ type: 'EXECUTE_STRATEGY', payload: { id: 'mock-tpa-check' } }, (response: any) => {
                                if (chrome.runtime.lastError) setStatus('Error: ' + chrome.runtime.lastError.message);
                                else setStatus('Strategy Result: ' + JSON.stringify(response));
                            });
                        }}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded shadow-sm text-sm font-medium transition-colors mb-2"
                    >
                        Run "Mock TPA Check"
                    </button>

                    <button
                        onClick={() => {
                            setStatus('Running Strategy...');
                            chrome.runtime.sendMessage({ type: 'EXECUTE_STRATEGY', payload: { id: 'broken-test' } }, (response: any) => {
                                if (chrome.runtime.lastError) setStatus('Error: ' + chrome.runtime.lastError.message);
                                else setStatus('Strategy Result: ' + JSON.stringify(response));
                            });
                        }}
                        className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded shadow-sm text-sm font-medium transition-colors mb-4"
                    >
                        Run "Broken (Test Healing)"
                    </button>

                    <div className="border-t pt-4 mt-4">
                        <h3 className="font-bold text-gray-700 mb-2">Phase 6: Clinical Bridge</h3>
                        <button
                            onClick={async () => {
                                setStatus('Running Multi-Platform Verification...');
                                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                                if (!tab?.id) {
                                    setStatus('Error: No active tab to extract from.');
                                    return;
                                }

                                chrome.runtime.sendMessage({ type: 'EXECUTE_CLINICAL_BRIDGE', payload: { tabId: tab.id } }, (response: any) => {
                                    if (chrome.runtime.lastError) setStatus('Error: ' + chrome.runtime.lastError.message);
                                    else setStatus('Bridge Result: ' + JSON.stringify(response));
                                });
                            }}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 px-4 rounded shadow-md text-sm font-bold transition-all transform hover:scale-105"
                        >
                            🚀 Multi-Platform Verification
                        </button>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default SidePanel;

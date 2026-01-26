import { ArrowUp, Brain } from 'lucide-react';
import React from 'react';

interface ChatInputProps {
    input: string;
    setInput: (value: string) => void;
    isDeeperResearch: boolean;
    setIsDeeperResearch: (value: boolean) => void;
    onSubmit: (e?: React.FormEvent) => void;
    isLoading: boolean;
}

export function ChatInput({
    input,
    setInput,
    isDeeperResearch,
    setIsDeeperResearch,
    onSubmit,
    isLoading
}: ChatInputProps) {
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
        }
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-[#FBFBFE] via-[#FBFBFE] to-transparent flex justify-center">
            <div className="w-full max-w-4xl">
                <form
                    onSubmit={onSubmit}
                    className="relative bg-white border border-neutral-200 rounded-[32px] shadow-xl shadow-blue-50/50 hover:border-neutral-300 transition-all duration-500 focus-within:border-blue-400 focus-within:ring-8 focus-within:ring-blue-50 overflow-hidden"
                >
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={isDeeperResearch ? "Provide specific research details..." : "Ask anything researchable..."}
                        rows={1}
                        className="w-full bg-transparent pl-8 pr-16 pt-6 pb-20 outline-none resize-none font-sans text-lg text-neutral-800 placeholder-neutral-400 min-h-[80px] max-h-[400px]"
                        style={{ height: 'auto', overflowY: 'hidden' }}
                    />

                    {/* Toolbar */}
                    <div className="absolute bottom-4 left-6 flex gap-3">
                        <button
                            type="button"
                            onClick={() => setIsDeeperResearch(!isDeeperResearch)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all duration-500 border-2 ${isDeeperResearch
                                ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200 scale-105'
                                : 'bg-white hover:bg-neutral-50 text-neutral-600 border-neutral-100'
                                }`}
                        >
                            <Brain className={`w-4 h-4 ${isDeeperResearch ? 'animate-pulse' : ''}`} />
                            <span>Deeper Research</span>
                        </button>
                    </div>

                    {/* Action Buttons */}
                    <div className="absolute bottom-4 right-6 flex items-center gap-3">
                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className={`p-3.5 rounded-2xl transition-all duration-500 ${input.trim()
                                ? 'bg-blue-600 text-white shadow-xl shadow-blue-200 scale-110 active:scale-95'
                                : 'bg-neutral-100 text-neutral-300'
                                }`}
                        >
                            <ArrowUp className="w-6 h-6 stroke-[3]" />
                        </button>
                    </div>
                </form>
                <p className="text-center text-[11px] text-neutral-400 mt-4 tracking-tight">
                    Deeper Research uses multiple parallel expert agents for definitive analysis.
                </p>
            </div>
        </div>
    );
}

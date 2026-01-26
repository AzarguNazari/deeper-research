import { Bot, Info, Sparkles, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { Message } from '../types';

interface ChatMessageProps {
    message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
    const isAssistant = message.role === 'assistant';

    return (
        <div className={`flex gap-6 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {isAssistant && (
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${message.isResearch ? 'bg-blue-600' : 'bg-neutral-100'}`}>
                    {message.isResearch ? <Sparkles className="w-6 h-6 text-white" /> : <Bot className="w-6 h-6 text-neutral-600" />}
                </div>
            )}

            <div className={`max-w-[90%] px-1 py-1 rounded-2xl ${message.role === 'user' ? 'bg-neutral-100 px-5 py-3 text-neutral-800' : ''}`}>
                {message.isClarification && (
                    <div className="mb-4 flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100 text-sm font-medium animate-pulse">
                        <Info className="w-4 h-4" />
                        Wait! The Research Architect needs more context...
                    </div>
                )}

                <div className={`prose prose-neutral max-w-none leading-relaxed prose-headings:font-outfit prose-headings:font-bold prose-p:text-neutral-700 ${message.role === 'user' ? 'text-[16px]' : 'text-[17px]'}`}>
                    {isAssistant ? (
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                    ) : (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                    )}
                </div>
            </div>

            {message.role === 'user' && (
                <div className="w-10 h-10 rounded-xl bg-neutral-200 flex items-center justify-center shrink-0">
                    <User className="w-6 h-6 text-neutral-600" />
                </div>
            )}
        </div>
    );
}

import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import {
  ArrowUp,
  Brain,
  User,
  Bot
} from 'lucide-react';

const api = axios.create({
  baseURL: 'http://localhost:5001/api',
});

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isDeeperResearch, setIsDeeperResearch] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const { data } = await api.post('/chat', { message, isDeeperResearch });
      return data.reply;
    },
    onSuccess: (reply) => {
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || chatMutation.isPending) return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    chatMutation.mutate(userMessage);
    setInput('');
  };

  const isInitialState = messages.length === 0;

  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans selection:bg-blue-100 flex flex-col items-center">
      {/* Dynamic Header */}
      {!isInitialState && (
        <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-neutral-100 z-10 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Brain className="text-white w-5 h-5" />
            </div>
            <span className="font-outfit font-bold text-lg tracking-tight">Deeper Research</span>
          </div>
          <button className="text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors">
            New Chat
          </button>
        </header>
      )}

      {/* Main Content Area */}
      <main className={`w-full max-w-3xl flex-1 flex flex-col ${isInitialState ? 'justify-center' : 'pt-24 pb-48'}`}>

        {isInitialState ? (
          <div className="flex flex-col items-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-blue-200">
              <Brain className="text-white w-10 h-10" />
            </div>
            <h1 className="text-4xl font-outfit font-bold tracking-tight text-neutral-900 mb-2">
              What would you like to research?
            </h1>
            <p className="text-neutral-400 text-lg">Advanced analysis and insights for your complex questions</p>
          </div>
        ) : (
          <div ref={scrollRef} className="flex-1 space-y-8 px-6 overflow-y-auto">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <Bot className="w-5 h-5 text-blue-600" />
                  </div>
                )}
                <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl ${msg.role === 'user'
                  ? 'bg-neutral-100 text-neutral-900'
                  : 'text-neutral-800 leading-relaxed'
                  }`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-neutral-600" />
                  </div>
                )}
              </div>
            ))}
            {chatMutation.isPending && (
              <div className="flex gap-4 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5 text-blue-300" />
                </div>
                <div className="space-y-2 mt-2">
                  <div className="h-4 w-48 bg-neutral-100 rounded"></div>
                  <div className="h-4 w-32 bg-neutral-100 rounded"></div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Floating Input Area */}
        <div className={`fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent flex justify-center`}>
          <div className="w-full max-w-3xl">
            <form
              onSubmit={handleSubmit}
              className="relative bg-white border border-neutral-200 rounded-[24px] shadow-sm hover:border-neutral-300 transition-all duration-300 focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-50"
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder="Message Deeper Research..."
                rows={1}
                className="w-full bg-transparent pl-6 pr-12 pt-4 pb-16 outline-none resize-none font-sans text-neutral-800 placeholder-neutral-400 min-h-[60px] max-h-[300px]"
                style={{
                  height: 'auto',
                  overflowY: 'hidden'
                }}
              />

              {/* Toolbar */}
              <div className="absolute bottom-3 left-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsDeeperResearch(!isDeeperResearch)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium transition-all duration-300 border ${isDeeperResearch
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-600 border-neutral-100'
                    }`}
                >
                  <Brain className={`w-3.5 h-3.5 ${isDeeperResearch ? 'animate-pulse' : ''}`} />
                  <span>DeeperResearch</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="absolute bottom-3 right-3 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={!input.trim() || chatMutation.isPending}
                  className={`p-2 rounded-full transition-all duration-300 ${input.trim()
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 scale-100'
                    : 'bg-neutral-100 text-neutral-300 scale-95'
                    }`}
                >
                  <ArrowUp className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;

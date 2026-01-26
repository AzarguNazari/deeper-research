import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Brain } from 'lucide-react';
import { chatService } from './services/api';
import { ChatHeader } from './components/ChatHeader';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { LoadingState } from './components/LoadingState';
import type { Message } from './types';

function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isDeeperResearch, setIsDeeperResearch] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      // Map current messages to OpenAI role/content format
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      return chatService.sendMessage({ message, isDeeperResearch, history });
    },
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply,
          isClarification: data.requiresClarification,
          isResearch: isDeeperResearch
        }
      ]);
    },
    onError: (error) => {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error processing your request. Please try again.',
        }
      ]);
    }
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, chatMutation.isPending]);

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
    <div className="min-h-screen bg-[#FBFBFE] text-neutral-900 font-sans selection:bg-blue-100 flex flex-col items-center">
      {!isInitialState && <ChatHeader onNewChat={() => setMessages([])} />}

      <main className={`w-full max-w-4xl flex-1 flex flex-col ${isInitialState ? 'justify-center' : 'pt-24 pb-48'}`}>
        {isInitialState ? (
          <div className="flex flex-col items-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mb-8 shadow-2xl shadow-blue-200 rotate-3 transform hover:rotate-0 transition-transform duration-500">
              <Brain className="text-white w-12 h-12" />
            </div>
            <h1 className="text-5xl font-outfit font-bold tracking-tighter text-neutral-900 mb-4 text-center">
              World-Class Research <span className="text-blue-600">Agents</span>
            </h1>
            <p className="text-neutral-400 text-xl text-center max-w-lg leading-relaxed">
              Launch parallel expert agents for definitive, high-resolution analysis on any complex topic.
            </p>
          </div>
        ) : (
          <div ref={scrollRef} className="flex-1 space-y-10 px-6 overflow-y-auto scroll-smooth">
            {messages.map((msg, i) => (
              <ChatMessage key={i} message={msg} />
            ))}
            {chatMutation.isPending && (
              <LoadingState isDeeperResearch={isDeeperResearch} />
            )}
          </div>
        )}

        <ChatInput
          input={input}
          setInput={setInput}
          isDeeperResearch={isDeeperResearch}
          setIsDeeperResearch={setIsDeeperResearch}
          onSubmit={handleSubmit}
          isLoading={chatMutation.isPending}
        />
      </main>
    </div>
  );
}

export default App;

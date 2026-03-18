import { useState, useRef, useEffect } from 'react';
import { Button, Input, Switch, message as antMessage, Drawer } from 'antd';
import {
  CopyOutlined,
  DeleteOutlined,
  PlusOutlined,
  ExperimentOutlined,
  SearchOutlined,
  HistoryOutlined,
  StopOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import { performResearch, type ResearchProgressEvent } from './api';

const { TextArea } = Input;

const HISTORY_KEY = 'deep_research_history';

type ResearchItem = {
  id: string;
  query: string;
  result: string;
  date: string;
};

type AgentStatus = 'pending' | 'running' | 'done';

type Agent = {
  title: string;
  status: AgentStatus;
};

type ProgressState = {
  statusMessage: string;
  agents: Agent[];
};

function loadHistory(): ResearchItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(items: ResearchItem[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
  } catch {
    // storage quota exceeded — ignore
  }
}

export default function App() {
  const [query, setQuery] = useState('');
  const [useDeep, setUseDeep] = useState(true);
  const [history, setHistory] = useState<ResearchItem[]>(loadHistory);
  const [activeItem, setActiveItem] = useState<ResearchItem | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [progress, setProgress] = useState<ProgressState | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    saveHistory(history);
  }, [history]);

  const handleSubmit = async () => {
    if (!query.trim() || isPending) return;

    const abortController = new AbortController();
    abortRef.current = abortController;
    setIsPending(true);
    setProgress({ statusMessage: 'Initializing...', agents: [] });

    const currentQuery = query;
    setQuery('');

    try {
      let finalReply = '';

      await performResearch(
        { message: currentQuery, useDeep },
        {
          signal: abortController.signal,
          onEvent: (event: ResearchProgressEvent) => {
            switch (event.type) {
              case 'status':
                setProgress((prev) => prev ? { ...prev, statusMessage: event.message } : null);
                break;

              case 'track_start':
                setProgress((prev) => {
                  if (!prev) return null;
                  const agents = [...prev.agents];
                  const existing = agents.find((a) => a.title === event.trackTitle);
                  if (!existing) {
                    agents.push({ title: event.trackTitle, status: 'running' });
                  } else {
                    existing.status = 'running';
                  }
                  return { ...prev, agents };
                });
                break;

              case 'track_done':
                setProgress((prev) => {
                  if (!prev) return null;
                  const agents = prev.agents.map((a) =>
                    a.title === event.trackTitle ? { ...a, status: 'done' as AgentStatus } : a
                  );
                  return { ...prev, agents };
                });
                break;

              case 'clarification':
                antMessage.info(event.question, 8);
                break;

              case 'done':
                finalReply = event.reply;
                break;

              case 'error':
                antMessage.error(event.message || 'An error occurred during research.');
                break;
            }
          },
        }
      );

      if (finalReply) {
        const newItem: ResearchItem = {
          id: Date.now().toString(),
          query: currentQuery,
          result: finalReply,
          date: new Date().toLocaleDateString('en-GB'),
        };
        setHistory((prev) => {
          const updated = [newItem, ...prev];
          saveHistory(updated);
          return updated;
        });
        setActiveItem(newItem);
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        antMessage.error(error.message || 'Failed to complete research.');
      }
    } finally {
      setIsPending(false);
      setProgress(null);
      abortRef.current = null;
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    antMessage.success('Copied to clipboard');
  };

  const deleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      saveHistory(updated);
      return updated;
    });
  };

  const agentIcon = (status: AgentStatus) => {
    if (status === 'running') return <LoadingOutlined className="text-amber-400" />;
    if (status === 'done') return <CheckCircleOutlined className="text-emerald-400" />;
    return <ClockCircleOutlined className="text-muted-foreground/40" />;
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      <div className="flex-1 max-w-[1400px] w-full mx-auto px-6 py-12 md:px-12">

        <header className="mb-12">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground tracking-tight mb-8">
            Deep Research
          </h1>

          <div className="flex items-center gap-8 border-b border-border pb-3 overflow-x-auto">
            <button className="flex items-center gap-2 text-sm font-medium text-foreground border-b-2 border-foreground pb-[14px] -mb-[15px] whitespace-nowrap">
              <SearchOutlined /> New Investigation
            </button>
            <button className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors pb-3 whitespace-nowrap">
              <HistoryOutlined /> Past Research
            </button>
            <button className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors pb-3 whitespace-nowrap">
              <ExperimentOutlined /> Agents Configuration
            </button>
          </div>
        </header>

        <div className="bg-card border border-border p-6 md:p-8 mb-12 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-serif font-medium flex items-center gap-2">
              <SearchOutlined /> Formulate Query
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Deep Mode</span>
              <Switch
                checked={useDeep}
                onChange={setUseDeep}
                className={useDeep ? 'bg-foreground' : 'bg-muted'}
                size="small"
                disabled={isPending}
              />
            </div>
          </div>

          <TextArea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Describe the topic or phenomenon to investigate deeply..."
            autoSize={{ minRows: 4, maxRows: 8 }}
            className="!bg-secondary/30 !border-border !rounded-sm !text-base !p-4 focus:!border-foreground focus:!ring-0 !transition-all text-foreground resize-none mb-6 font-serif italic placeholder:text-muted-foreground/50"
            disabled={isPending}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />

          <div className="flex justify-end gap-3">
            {isPending && (
              <Button
                icon={<StopOutlined />}
                onClick={handleStop}
                className="!rounded-none uppercase !text-xs tracking-[0.15em] !border-border h-10 px-6 font-semibold !text-destructive !border-destructive/50 hover:!border-destructive"
              >
                Stop
              </Button>
            )}
            <Button
              type="primary"
              icon={isPending ? undefined : <PlusOutlined />}
              loading={isPending}
              onClick={handleSubmit}
              disabled={!query.trim() || isPending}
              className="!bg-foreground !hidden md:!flex !text-background !rounded-none uppercase !text-xs tracking-[0.15em] !border-none h-10 px-6 font-semibold"
            >
              {isPending ? 'Investigating...' : 'Launch Agents'}
            </Button>
            <Button
              type="primary"
              loading={isPending}
              onClick={handleSubmit}
              disabled={!query.trim() || isPending}
              className="!bg-foreground md:!hidden !flex !text-background !rounded-none uppercase !text-xs tracking-wider !border-none h-10 px-4 font-semibold"
            >
              {isPending ? 'Running' : 'Launch'}
            </Button>
          </div>
        </div>

        {isPending && progress && (
          <div className="bg-card border border-border p-6 md:p-8 mb-12 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <LoadingOutlined className="text-foreground" />
              <h2 className="text-lg font-serif font-medium">Research in Progress</h2>
            </div>

            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-6 font-semibold">
              {progress.statusMessage}
            </p>

            {progress.agents.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {progress.agents.map((agent) => (
                  <div
                    key={agent.title}
                    className="flex items-center gap-3 bg-secondary/20 border border-border px-4 py-3 rounded-sm"
                  >
                    <span className="flex-shrink-0">{agentIcon(agent.status)}</span>
                    <span
                      className={`text-sm font-medium truncate ${
                        agent.status === 'done'
                          ? 'text-muted-foreground line-through'
                          : agent.status === 'running'
                          ? 'text-foreground'
                          : 'text-muted-foreground/40'
                      }`}
                    >
                      {agent.title}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {history.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-serif font-medium flex items-center gap-2">
                <HistoryOutlined /> Research History
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {history.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setActiveItem(item)}
                  className="group bg-card border border-border p-6 flex flex-col justify-between min-h-[220px] transition-all hover:border-foreground/30 hover:shadow-md cursor-pointer rounded-sm"
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-serif text-base font-semibold leading-snug line-clamp-2 pr-4 text-foreground">
                        {item.query}
                      </h3>
                      <div className="flex gap-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                        <CopyOutlined
                          className="hover:text-foreground transition-colors"
                          onClick={(e) => { e.stopPropagation(); copyToClipboard(item.result); }}
                        />
                        <DeleteOutlined
                          className="hover:text-destructive transition-colors"
                          onClick={(e) => deleteItem(item.id, e)}
                        />
                      </div>
                    </div>
                    <p className="font-serif italic text-muted-foreground text-sm line-clamp-4 leading-relaxed">
                      "{item.result.replace(/[#*`]/g, '').substring(0, 150)}..."
                    </p>
                  </div>
                  <div className="text-[10px] uppercase text-muted-foreground/60 tracking-[0.2em] font-semibold mt-6">
                    CREATED {item.date}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <footer className="py-8 text-center border-t border-border mt-auto">
        <p className="text-[10px] uppercase tracking-[0.3em] font-semibold text-muted-foreground/60">
          Precision Analysis • Agentic Orchestration • 2026
        </p>
      </footer>

      <Drawer
        title={<span className="font-serif text-xl font-semibold">Research Findings</span>}
        placement="right"
        size="large"
        onClose={() => setActiveItem(null)}
        open={!!activeItem}
        className="!bg-background"
        extra={
          <Button
            type="text"
            icon={<CopyOutlined />}
            onClick={() => activeItem && copyToClipboard(activeItem.result)}
          >
            Copy
          </Button>
        }
      >
        {activeItem && (
          <div className="flex flex-col gap-6">
            <div className="bg-secondary/30 border border-border p-6 rounded-sm">
              <h4 className="text-xs uppercase tracking-widest text-muted-foreground mb-3 font-semibold">Original Query</h4>
              <p className="font-serif italic text-foreground text-lg">{activeItem.query}</p>
            </div>
            <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none prose-headings:font-serif prose-headings:font-semibold prose-a:text-foreground prose-a:underline prose-a:underline-offset-4 prose-p:leading-loose marker:text-foreground">
              <ReactMarkdown>{activeItem.result}</ReactMarkdown>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

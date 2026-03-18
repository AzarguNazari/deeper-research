export type ResearchRequest = {
  message: string;
  useDeep: boolean;
  history?: any[];
};

export type ResearchProgressEvent =
  | { type: 'status'; message: string }
  | { type: 'track_start'; trackTitle: string }
  | { type: 'track_done'; trackTitle: string }
  | { type: 'done'; reply: string }
  | { type: 'error'; message: string }
  | { type: 'clarification'; question: string };

export type ResearchCallbacks = {
  onEvent: (event: ResearchProgressEvent) => void;
  signal: AbortSignal;
};

export const performResearch = async (
  data: ResearchRequest,
  callbacks: ResearchCallbacks
): Promise<void> => {
  const response = await fetch('http://localhost:5001/api/research', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    signal: callbacks.signal,
  });

  if (!response.ok || !response.body) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || 'Failed to connect to research service.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n\n');
    buffer = lines.pop() ?? '';

    for (const chunk of lines) {
      const line = chunk.trim();
      if (line.startsWith('data: ')) {
        try {
          const event = JSON.parse(line.slice(6)) as ResearchProgressEvent;
          callbacks.onEvent(event);
        } catch {
          // malformed event — skip
        }
      }
    }
  }
};

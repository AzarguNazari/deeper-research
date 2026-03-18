import OpenAI from 'openai';

export interface ResearchTrack {
    id: string;
    title: string;
    focus: string;
    methodology: string;
    hypothesis: string;
}

export interface ResearchPlan {
    needsClarification: boolean;
    clarificationQuestion: string | null;
    researchTracks: ResearchTrack[] | null;
}

export interface DeepResearchResult {
    reply: string;
    requiresClarification?: boolean;
}

export interface ChatRequest {
    message: string;
    isDeeperResearch: boolean;
    history?: OpenAI.Chat.Completions.ChatCompletionMessageParam[];
}

export type ResearchProgressEvent =
    | { type: 'status'; message: string }
    | { type: 'track_start'; trackTitle: string }
    | { type: 'track_done'; trackTitle: string }
    | { type: 'done'; reply: string }
    | { type: 'error'; message: string }
    | { type: 'clarification'; question: string };

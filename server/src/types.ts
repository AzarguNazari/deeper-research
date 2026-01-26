import OpenAI from 'openai';

export interface ResearchTrack {
    id: string;
    title: string;
    focus: string;
    methodology: string;
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

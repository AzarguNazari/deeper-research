export interface Message {
    role: 'user' | 'assistant';
    content: string;
    isClarification?: boolean;
    isResearch?: boolean;
}

export interface ChatResponse {
    reply: string;
    requiresClarification: boolean;
}

export interface ChatRequest {
    message: string;
    isDeeperResearch: boolean;
    history: { role: string; content: string }[];
}

import axios from 'axios';
import type { ChatRequest, ChatResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = axios.create({
    baseURL: API_BASE_URL,
});

export const chatService = {
    sendMessage: async (payload: ChatRequest): Promise<ChatResponse> => {
        const { data } = await api.post<ChatResponse>('/chat', payload);
        return data;
    },
    checkHealth: async () => {
        const { data } = await api.get('/health');
        return data;
    }
};

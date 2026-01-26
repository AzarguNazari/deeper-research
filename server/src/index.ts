import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';

import { performDeepResearch } from './deepResearchService.js';
import type { ChatRequest } from './types.js';

dotenv.config();

// Validation
if (!process.env.DEEPSEEK_API_KEY) {
    console.error('CRITICAL: DEEPSEEK_API_KEY is missing in environment variables.');
    process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5001;

const openai = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: 'https://api.deepseek.com/v1',
});

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
});

app.post('/api/chat', async (req: Request, res: Response) => {
    try {
        const { message, isDeeperResearch, history = [] } = req.body as ChatRequest;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // We now use the history provided by the client to keep the server stateless
        const currentHistory = [...history, { role: 'user', content: message } as const];

        let reply = '';
        let requiresClarification = false;

        if (isDeeperResearch) {
            // Note: performDeepResearch might do multiple internal calls
            const result = await performDeepResearch(openai, message, history);
            reply = result.reply;
            requiresClarification = result.requiresClarification || false;
        } else {
            const response = await openai.chat.completions.create({
                model: 'deepseek-chat',
                messages: currentHistory as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
            });
            reply = response.choices[0]?.message?.content || 'No response from AI';
        }

        res.json({ reply, requiresClarification });
    } catch (error) {
        console.error('Chat API Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

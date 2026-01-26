import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

const openai = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: 'https://api.deepseek.com/v1',
});

app.use(cors());
app.use(express.json());

app.get('/api/hello', (req: Request, res: Response) => {
    res.json({ message: 'Hello from Express + TypeScript!' });
});

const chatHistory: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: "You are a helpful assistant. Please respond in the same language as the user's message." }
];

app.post('/api/chat', async (req: Request, res: Response) => {
    try {
        const { message, isDeeperResearch } = req.body;

        // Add user message to history
        chatHistory.push({ role: 'user', content: message });

        const messages = [...chatHistory];

        // If DeeperResearch is enabled, we can prepend a technical instruction or change behavior
        if (isDeeperResearch) {
            messages.unshift({
                role: 'system',
                content: "DEEPER RESEARCH MODE ENABLED: Provide extremely thorough, multi-step analysis. Use academic terminology and ensure every claim is logically sound. Focus on structural depth."
            });
        }

        const response = await openai.chat.completions.create({
            model: 'deepseek-chat',
            messages: messages,
        });

        const reply = response.choices[0]?.message?.content || 'No response from AI';

        // Add assistant reply to history
        chatHistory.push({ role: 'assistant', content: reply });

        res.json({ reply });
    } catch (error) {
        console.error('DeepSeek API Error:', error);
        res.status(500).json({ error: 'Failed to fetch from DeepSeek' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

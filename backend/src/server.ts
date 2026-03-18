import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { performDeepResearch } from './deepResearchService.js';
import { getOpenAIClient } from './client.js';
import type { ResearchProgressEvent } from './types.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 3000;

app.post('/api/research', async (req, res) => {
    const { message, history = [], useDeep = true } = req.body;

    if (!message) {
        res.status(400).json({ error: 'Message is required' });
        return;
    }

    const openai = getOpenAIClient();
    const abortController = new AbortController();

    req.on('close', () => {
        abortController.abort();
    });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const sendEvent = (event: ResearchProgressEvent) => {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    try {
        if (useDeep) {
            await performDeepResearch(openai, message, history, sendEvent, abortController.signal);
        } else {
            sendEvent({ type: 'status', message: 'Processing...' });
            const response = await openai.chat.completions.create({
                model: 'deepseek-chat',
                messages: [
                    ...history,
                    { role: 'user', content: message }
                ],
            }, { signal: abortController.signal, timeout: 60000 });
            const reply = response.choices[0]?.message?.content || 'No response from AI';
            sendEvent({ type: 'done', reply });
        }
    } catch (error: any) {
        if (!abortController.signal.aborted) {
            console.error('Research error:', error.message);
            sendEvent({ type: 'error', message: error.message || 'Internal Server Error' });
        }
    } finally {
        res.end();
    }
});

app.listen(port, () => {
    console.log(`Deep Research Backend listening on port ${port}`);
});

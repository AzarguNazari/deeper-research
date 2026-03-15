import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

export function getOpenAIClient(): OpenAI {
    const apiKey = process.env.DEEPSEEK_API_KEY;

    if (!apiKey || apiKey === 'your_key_here') {
        console.error('CRITICAL: DEEPSEEK_API_KEY is missing or invalid in .env file.');
        process.exit(1);
    }

    return new OpenAI({
        apiKey,
        baseURL: 'https://api.deepseek.com',
        timeout: 120000,
    });
}


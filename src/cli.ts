import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import OpenAI from 'openai';
import { performDeepResearch } from './deepResearchService.js';
import { getOpenAIClient } from './client.js';

async function main() {
    let openai: OpenAI;
    try {
        openai = getOpenAIClient();
    } catch (e) {
        return;
    }

    const rl = readline.createInterface({ input, output });

    console.log('\n=======================================');
    console.log('   DEEP RESEARCH CLI (DeepSeek Mode)   ');
    console.log('=======================================\n');
    console.log('Type your research question. Type "exit" to quit.\n');

    const history: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

    while (true) {
        const message = await rl.question('Research Query: ');

        if (message.toLowerCase() === 'exit' || message.toLowerCase() === 'quit') {
            break;
        }

        if (!message.trim()) continue;

        const useDeepInput = await rl.question('Use Deep Research? (y/n) [y]: ');
        const useDeep = useDeepInput.toLowerCase() !== 'n';

        console.log('\n[Processing request...]');

        try {
            let reply = '';
            if (useDeep) {
                // Timeouts are handled inside the service or globally if needed
                const result = await performDeepResearch(openai, message, history);
                reply = result.reply;
            } else {
                const response = await openai.chat.completions.create({
                    model: 'deepseek-chat',
                    messages: [
                        ...history,
                        { role: 'user', content: message }
                    ],
                }, { timeout: 60000 });
                reply = response.choices[0]?.message?.content || 'No response from AI';
            }

            console.log('\n--- FINAL RESPONSE ---\n');
            console.log(reply);
            console.log('\n----------------------\n');

            history.push({ role: 'user', content: message });
            history.push({ role: 'assistant', content: reply });

        } catch (error: any) {
            console.error('\n[!] Error during execution:');
            console.error(error.message || error);
            console.log('\nYou can try asking another question or type "exit".\n');
        }
    }

    rl.close();
    console.log('Goodbye!');
}

main().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
});

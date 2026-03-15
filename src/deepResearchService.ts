import OpenAI from 'openai';
import type { DeepResearchResult, ResearchPlan, ResearchTrack } from './types.js';

const MODEL = 'deepseek-chat';

export async function performDeepResearch(
    openai: OpenAI,
    message: string,
    history: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
    signal?: AbortSignal
): Promise<DeepResearchResult> {
    console.log('\n--- Starting Deep Research ---');

    console.log('Architecting research plan...');
    const plan = await designResearchPlan(openai, message, history, signal);

    if (plan.needsClarification) {
        return {
            reply: plan.clarificationQuestion || "More details needed.",
            requiresClarification: true
        };
    }

    const tracks = plan.researchTracks || [];
    console.log(`Launching ${tracks.length} research agents in parallel...`);
    
    const researchCorpus = await conductInvestigation(openai, message, tracks, signal);

    console.log('Synthesizing all agent findings...');
    let finalAnswer = await synthesizeFindings(openai, message, researchCorpus, signal);
    
    console.log('Running final quality reflection...');
    finalAnswer = await runReflectionLoop(openai, message, finalAnswer, signal);

    console.log('--- Deep Research Complete ---\n');
    return { reply: finalAnswer };
}

async function designResearchPlan(
    openai: OpenAI,
    message: string,
    history: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
    signal?: AbortSignal
): Promise<ResearchPlan> {
    const response = await openai.chat.completions.create({
        model: MODEL,
        messages: [
            {
                role: 'system',
                content: `You are a Lead Research Architect. Ensure the research is World-Class and Definitive.
                
If the query is broad, ask for clarification on:
- Geographic scope
- Time horizon
- Target Audience
- Success Criteria

If clarification is needed: Set 'needsClarification' to true and provide questions.
If context exists: Design 4-6 specific research tracks.

Format ONLY as JSON:
{
  "needsClarification": boolean,
  "clarificationQuestion": string | null,
  "researchTracks": [
    { "id": string, "title": string, "focus": string, "methodology": string }
  ] | null
}`
            },
            ...history,
            { role: 'user', content: message }
        ],
        response_format: { type: 'json_object' }
    }, { signal });

    return JSON.parse(response.choices[0]?.message?.content || '{}') as ResearchPlan;
}

async function conductInvestigation(
    openai: OpenAI,
    message: string,
    tracks: ResearchTrack[],
    signal?: AbortSignal
): Promise<string> {
    const researchTasks = tracks.map(async (track) => {
        console.log(`  > Agent [${track.title}] starting...`);
        try {
            const result = await openai.chat.completions.create({
                model: MODEL,
                messages: [
                    {
                        role: 'system',
                        content: `You are an expert Subject Matter Researcher for: ${track.title}.
Focus: ${track.focus}
Methodology: ${track.methodology}`
                    },
                    { role: 'user', content: message }
                ]
            }, { signal });
            console.log(`  > Agent [${track.title}] completed.`);
            return `### Track: ${track.title}\nFindings: ${result.choices[0]?.message?.content}\n`;
        } catch (error: any) {
            if (error.name === 'AbortError') throw error;
            console.error(`  > Agent [${track.title}] failed:`, error.message);
            return `### Track: ${track.title}\nError: Failed to conduct investigation.\n`;
        }
    });

    const allFindings = await Promise.all(researchTasks);
    return allFindings.join('\n\n---\n\n');
}

async function synthesizeFindings(
    openai: OpenAI,
    message: string,
    researchCorpus: string,
    signal?: AbortSignal
): Promise<string> {
    const response = await openai.chat.completions.create({
        model: MODEL,
        messages: [
            {
                role: 'system',
                content: `You are a Senior Synthesis Agent. Compile findings into a definitive report.
Structure:
- Executive Summary
- Multi-dimensional Analysis
- Interdisciplinary Connections
- Future Projections
- Critical Risks & Opportunities`
            },
            { role: 'user', content: `Original Question: ${message}\n\nResearch Corpus:\n${researchCorpus}` }
        ]
    }, { signal });

    return response.choices[0]?.message?.content || "Failed to synthesize findings.";
}

async function runReflectionLoop(
    openai: OpenAI,
    message: string,
    initialReport: string,
    signal?: AbortSignal
): Promise<string> {
    let finalAnswer = initialReport;
    const maxIterations = 1;

    for (let i = 0; i < maxIterations; i++) {
        if (signal?.aborted) throw new Error('AbortError');
        
        const response = await openai.chat.completions.create({
            model: MODEL,
            messages: [
                {
                    role: 'system',
                    content: `You are the Quality Control Agent for Deep Research. Evaluate for:
1. Logical consistency
2. Depth of insight
3. Direct responsiveness

Identify what is missing or weak. Provide a revised version.
Respond ONLY with JSON:
{
  "isSatisfactory": boolean,
  "critique": string | null,
  "revisedReport": string | null
}`
                },
                { role: 'user', content: `Original Question: ${message}\n\nCurrent Report:\n${finalAnswer}` }
            ],
            response_format: { type: 'json_object' }
        }, { signal });

        const reflection = JSON.parse(response.choices[0]?.message?.content || '{}');

        if (reflection.isSatisfactory) {
            break;
        } else if (reflection.revisedReport) {
            finalAnswer = reflection.revisedReport;
        }
    }

    return finalAnswer;
}

import OpenAI from 'openai';
import type { DeepResearchResult, ResearchPlan, ResearchTrack } from './types.js';

export async function performDeepResearch(
    openai: OpenAI,
    message: string,
    history: OpenAI.Chat.Completions.ChatCompletionMessageParam[]
): Promise<DeepResearchResult> {
    console.log('--- Starting Agentic Deep Research ---');

    // 1. Initial Plan & Clarification Check
    const plan = await designResearchPlan(openai, message, history);

    if (plan.needsClarification) {
        return {
            reply: plan.clarificationQuestion || "More details needed.",
            requiresClarification: true
        };
    }

    const tracks = plan.researchTracks || [];

    // 2. Parallel Agentic Investigation
    const researchCorpus = await conductInvestigation(openai, message, tracks);

    // 3. Global Synthesis & Cross-Correlation
    let finalAnswer = await synthesizeFindings(openai, message, researchCorpus);

    // 4. Self-Reflective Optimization Layer
    finalAnswer = await runReflectionLoop(openai, message, finalAnswer);

    console.log('--- Deep Research Complete ---');
    return { reply: finalAnswer };
}

async function designResearchPlan(
    openai: OpenAI,
    message: string,
    history: OpenAI.Chat.Completions.ChatCompletionMessageParam[]
): Promise<ResearchPlan> {
    const response = await openai.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
            {
                role: 'system',
                content: `You are a Lead Research Architect. Your goal is to ensure the research is "World-Class" and "Definitive."
                
CRITICAL INSTRUCTION:
Deep Research requires high-resolution context. If the user's query is broad (e.g., "tell me about AI"), you MUST ask for clarification. 
Do not start research if any of the following are missing or ambiguous:
- Geographic scope (Global vs Local)
- Time horizon (Present vs 2030 vs 2050)
- Target Audience/Perspective (Economic, Technical, Ethical)
- Specific Success Criteria (What would make this the "best" answer?)

If clarification is needed: Set 'needsClarification' to true and provide 3-4 highly targeted questions.
If enough context exists: Design 4-6 specific research tracks.

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
    });

    return JSON.parse(response.choices[0]?.message?.content || '{}') as ResearchPlan;
}

async function conductInvestigation(
    openai: OpenAI,
    message: string,
    tracks: ResearchTrack[]
): Promise<string> {
    console.log(`Launching ${tracks.length} parallel research agents...`);

    const researchTasks = tracks.map(async (track) => {
        console.log(`Agent [${track.id}] starting: ${track.title}`);
        try {
            const result = await openai.chat.completions.create({
                model: 'deepseek-chat',
                messages: [
                    {
                        role: 'system',
                        content: `You are an expert Subject Matter Researcher for: ${track.title}.
Focus: ${track.focus}
Methodology: ${track.methodology}

Provide a deep-dive analysis. Do not summarize; provide raw, detailed evidence, data-driven projections, and structural insights. Force yourself to find non-obvious connections.`
                    },
                    { role: 'user', content: message }
                ]
            });
            console.log(`Agent [${track.id}] completed investigation.`);
            return `### Track: ${track.title}\nFocus: ${track.focus}\nFindings: ${result.choices[0]?.message?.content}\n`;
        } catch (error) {
            console.error(`Agent [${track.id}] failed:`, error);
            return `### Track: ${track.title}\nError: Failed to conduct investigation for this track.\n`;
        }
    });

    const allFindings = await Promise.all(researchTasks);
    return allFindings.join('\n\n---\n\n');
}

async function synthesizeFindings(
    openai: OpenAI,
    message: string,
    researchCorpus: string
): Promise<string> {
    console.log('Synthesizing research corpus...');
    const response = await openai.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
            {
                role: 'system',
                content: `You are a Senior Synthesis Agent. Take the following multi-track research findings and compile them into a definitive, high-resolution report. 
Address the user's original query with extreme depth. 
Structure:
- Executive Summary
- Multi-dimensional Analysis
- Interdisciplinary Connections
- Future Projections
- Critical Risks & Opportunities`
            },
            { role: 'user', content: `Original Question: ${message}\n\nResearch Corpus:\n${researchCorpus}` }
        ]
    });

    return response.choices[0]?.message?.content || "Failed to synthesize findings.";
}

async function runReflectionLoop(
    openai: OpenAI,
    message: string,
    initialReport: string
): Promise<string> {
    let finalAnswer = initialReport;
    const maxIterations = 1;

    console.log('Commencing Self-Reflection Loop...');

    for (let i = 0; i < maxIterations; i++) {
        const response = await openai.chat.completions.create({
            model: 'deepseek-chat',
            messages: [
                {
                    role: 'system',
                    content: `You are the Quality Control Agent for Deep Research. Evaluate the following report for:
1. Logical consistency
2. Depth of insight (avoiding surface-level platitudes)
3. Direct responsiveness to the original user query.

Identify exactly what is missing or weak. Then, provide a revised, perfected version of the report.
Respond ONLY with JSON.

Format:
{
  "isSatisfactory": boolean,
  "critique": string | null,
  "revisedReport": string | null
}`
                },
                { role: 'user', content: `Original Question: ${message}\n\nCurrent Report:\n${finalAnswer}` }
            ],
            response_format: { type: 'json_object' }
        });

        const reflection = JSON.parse(response.choices[0]?.message?.content || '{}');

        if (reflection.isSatisfactory) {
            console.log('Quality Control: Report satisfies depth requirements.');
            break;
        } else if (reflection.revisedReport) {
            finalAnswer = reflection.revisedReport;
            console.log(`Quality Control: Applied improvements (Iteration ${i + 1}).`);
        }
    }

    return finalAnswer;
}


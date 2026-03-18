import OpenAI from 'openai';
import type { ResearchPlan, ResearchTrack, ResearchProgressEvent } from './types.js';

const MODEL = 'deepseek-chat';
const REFLECTION_ITERATIONS = 2;

type OnEvent = (event: ResearchProgressEvent) => void;

export async function performDeepResearch(
    openai: OpenAI,
    message: string,
    history: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
    onEvent: OnEvent,
    signal?: AbortSignal
): Promise<void> {
    onEvent({ type: 'status', message: 'Architecting research plan...' });
    const plan = await designResearchPlan(openai, message, history, signal);

    if (plan.needsClarification) {
        onEvent({ type: 'clarification', question: plan.clarificationQuestion || 'More details needed.' });
        return;
    }

    const tracks = plan.researchTracks || [];
    onEvent({ type: 'status', message: `Launching ${tracks.length} research agents in parallel...` });

    const researchCorpus = await conductDeepInvestigation(openai, message, tracks, onEvent, signal);

    onEvent({ type: 'status', message: 'Cross-pollinating findings across tracks...' });
    const enrichedCorpus = await crossPollinateFindings(openai, message, researchCorpus, signal);

    onEvent({ type: 'status', message: 'Synthesizing all agent findings into report...' });
    let finalAnswer = await synthesizeFindings(openai, message, enrichedCorpus, signal);

    onEvent({ type: 'status', message: 'Running quality reflection loop...' });
    finalAnswer = await runReflectionLoop(openai, message, finalAnswer, onEvent, signal);

    onEvent({ type: 'done', reply: finalAnswer });
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
                content: `You are a Lead Research Architect designing a world-class, comprehensive investigation.

Your goal is to decompose any query into 6-8 ORTHOGONAL research tracks, each attacking a distinct angle.
Each track must have a testable hypothesis that guides the investigation.

If the query is genuinely ambiguous or too vague to pursue meaningfully, ask for clarification on:
- Geographic scope (if geographic)
- Time horizon
- Target audience and expertise level
- Primary success criteria

If clarification is needed: Set "needsClarification": true and provide a focused clarification question.
If the query is sufficiently specific (even if broad in topic): Design 6-8 research tracks.

Each track should cover a DIFFERENT dimension: e.g. historical, mechanistic, comparative, ethical, economic, technical, empirical, future-oriented.

Return ONLY as valid JSON:
{
  "needsClarification": boolean,
  "clarificationQuestion": string | null,
  "researchTracks": [
    {
      "id": string,
      "title": string,
      "focus": string,
      "methodology": string,
      "hypothesis": string
    }
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

async function conductDeepInvestigation(
    openai: OpenAI,
    message: string,
    tracks: ResearchTrack[],
    onEvent: OnEvent,
    signal?: AbortSignal
): Promise<string> {
    const researchTasks = tracks.map(async (track) => {
        onEvent({ type: 'track_start', trackTitle: track.title });
        try {
            const subQuestions = await decomposeTrack(openai, message, track, signal);
            const findings = await investigateSubQuestions(openai, message, track, subQuestions, signal);
            onEvent({ type: 'track_done', trackTitle: track.title });
            return `### Track: ${track.title}\nHypothesis: ${track.hypothesis}\n\n${findings}\n`;
        } catch (error: any) {
            if (error.name === 'AbortError' || signal?.aborted) throw error;
            console.error(`Agent [${track.title}] failed:`, error.message);
            return `### Track: ${track.title}\nError: Investigation could not be completed.\n`;
        }
    });

    const allFindings = await Promise.all(researchTasks);
    return allFindings.join('\n\n---\n\n');
}

async function decomposeTrack(
    openai: OpenAI,
    originalQuery: string,
    track: ResearchTrack,
    signal?: AbortSignal
): Promise<string[]> {
    const response = await openai.chat.completions.create({
        model: MODEL,
        messages: [
            {
                role: 'system',
                content: `You are a specialist research planner. Given a research track and its hypothesis, decompose it into exactly 3 highly specific sub-questions that will produce the most insight when answered.

Each sub-question should be concrete, answerable with evidence, and together they should comprehensively test the hypothesis.

Return ONLY a JSON array of 3 strings: ["sub-question 1", "sub-question 2", "sub-question 3"]`
            },
            {
                role: 'user',
                content: `Original Research Question: ${originalQuery}

Track: ${track.title}
Focus: ${track.focus}
Methodology: ${track.methodology}
Hypothesis: ${track.hypothesis}

Generate 3 specific sub-questions for this track.`
            }
        ],
        response_format: { type: 'json_object' }
    }, { signal });

    try {
        const parsed = JSON.parse(response.choices[0]?.message?.content || '[]');
        if (Array.isArray(parsed)) return parsed as string[];
        const keys = Object.keys(parsed);
        for (const k of keys) {
            if (Array.isArray(parsed[k])) return parsed[k] as string[];
        }
        return [];
    } catch {
        return [];
    }
}

async function investigateSubQuestions(
    openai: OpenAI,
    originalQuery: string,
    track: ResearchTrack,
    subQuestions: string[],
    signal?: AbortSignal
): Promise<string> {
    const subQText = subQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n');

    const response = await openai.chat.completions.create({
        model: MODEL,
        messages: [
            {
                role: 'system',
                content: `You are an expert Subject Matter Researcher specializing in: ${track.title}.

Your focus: ${track.focus}
Your methodology: ${track.methodology}
Your hypothesis to test: ${track.hypothesis}

For each sub-question provided, give a thorough, evidence-based answer. Then synthesize into a cohesive track summary that assesses whether the hypothesis holds.

Be specific. Use concrete facts, mechanisms, data points, or logical reasoning. Avoid vague generalities.`
            },
            {
                role: 'user',
                content: `Original Research Question: ${originalQuery}

Sub-questions to investigate:
${subQText}

Answer each sub-question in depth, then synthesize your track findings.`
            }
        ]
    }, { signal });

    return response.choices[0]?.message?.content || 'No findings.';
}

async function crossPollinateFindings(
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
                content: `You are a Cross-Disciplinary Synthesis Analyst. Your role is to read all research tracks and identify:

1. CONVERGENCES: Where multiple tracks independently arrive at the same conclusion (strengthens evidence)
2. CONTRADICTIONS: Where tracks conflict — explain why and which evidence is stronger
3. INTERDEPENDENCIES: Where findings from one track significantly affect the interpretation of another
4. UNEXPECTED CONNECTIONS: Surprising links between tracks that open new insights

Output the enriched corpus with your cross-pollination analysis woven in as a new section at the top called "## Cross-Track Analysis". Keep all original track findings intact below it.`
            },
            {
                role: 'user',
                content: `Original Research Question: ${message}\n\nResearch Corpus:\n${researchCorpus}`
            }
        ]
    }, { signal });

    return response.choices[0]?.message?.content || researchCorpus;
}

async function synthesizeFindings(
    openai: OpenAI,
    message: string,
    enrichedCorpus: string,
    signal?: AbortSignal
): Promise<string> {
    const response = await openai.chat.completions.create({
        model: MODEL,
        messages: [
            {
                role: 'system',
                content: `You are a Senior Research Synthesis Agent. Produce a comprehensive, definitive report that a domain expert would find genuinely valuable.

Structure your report as follows:
## Executive Summary
A 3-5 sentence synthesis of the most critical findings and their implications.

## Key Findings
The most important, evidence-backed conclusions organized by importance.

## Multi-dimensional Analysis
Deep analysis organized thematically, drawing on multiple tracks. Show how different dimensions interact.

## Critical Tensions & Contradictions
Honest assessment of where evidence is uncertain, conflicting, or where experts disagree.

## Future Projections & Opportunities
Evidence-based projections, emerging trends, or open research questions.

## Actionable Recommendations
Concrete recommendations. For whom? What specifically should they do, based on the evidence?

Write in authoritative, precise prose. Do not hedging excessively. Back every claim with reasoning from the research corpus.`
            },
            {
                role: 'user',
                content: `Original Research Question: ${message}\n\nEnriched Research Corpus:\n${enrichedCorpus}`
            }
        ]
    }, { signal });

    return response.choices[0]?.message?.content || 'Failed to synthesize findings.';
}

async function runReflectionLoop(
    openai: OpenAI,
    message: string,
    initialReport: string,
    onEvent: OnEvent,
    signal?: AbortSignal
): Promise<string> {
    let currentReport = initialReport;

    for (let i = 0; i < REFLECTION_ITERATIONS; i++) {
        if (signal?.aborted) throw new Error('AbortError');

        onEvent({ type: 'status', message: `Quality reflection pass ${i + 1}/${REFLECTION_ITERATIONS}...` });

        const response = await openai.chat.completions.create({
            model: MODEL,
            messages: [
                {
                    role: 'system',
                    content: `You are the Chief Quality Reviewer for an elite research organization. Evaluate this report ruthlessly for:

1. UNSUPPORTED CLAIMS: Any assertion not backed by reasoning or evidence
2. COVERAGE GAPS: Important aspects of the original question left unaddressed
3. LOGICAL INCONSISTENCIES: Internal contradictions or flawed reasoning chains
4. SHALLOW ANALYSIS: Areas where depth is insufficient for a domain expert
5. MISSING NUANCE: Important caveats, exceptions, or context omitted

If the report is genuinely excellent and complete, say so.
If it has significant weaknesses, provide a substantially improved revised version that fixes them.

Respond ONLY with valid JSON:
{
  "isSatisfactory": boolean,
  "critique": string | null,
  "revisedReport": string | null
}`
                },
                {
                    role: 'user',
                    content: `Original Research Question: ${message}\n\nCurrent Report:\n${currentReport}`
                }
            ],
            response_format: { type: 'json_object' }
        }, { signal });

        const reflection = JSON.parse(response.choices[0]?.message?.content || '{}');

        if (reflection.isSatisfactory) {
            break;
        } else if (reflection.revisedReport) {
            currentReport = reflection.revisedReport;
        }
    }

    return currentReport;
}

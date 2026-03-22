import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

const dbPath = path.join(process.cwd(), 'data.db');

const SYSTEM_PROMPT = `You are Constructor PRO, an expert AI assistant for construction project management.
You help project managers and site engineers with:
- Analyzing site diaries and daily reports
- Reviewing budgets and cost variances
- Tracking project timelines and schedules
- Identifying risks and compliance issues
- Generating structured reports

Always respond in a concise, professional manner. If you need more context, ask a targeted question.`;

type ChatMessage = { role: 'user' | 'ai'; text: string };

function getDb() {
    return new Database(dbPath);
}

function loadHistory(db: Database.Database, projectId: string): ChatMessage[] {
    try {
        const row = db.prepare('SELECT chat_history FROM projects WHERE id = ?').get(projectId) as { chat_history: string | null } | undefined;
        if (!row || !row.chat_history) return [];
        const parsed = JSON.parse(row.chat_history);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function saveHistory(db: Database.Database, projectId: string, history: ChatMessage[]) {
    db.prepare('UPDATE projects SET chat_history = ? WHERE id = ?').run(JSON.stringify(history), projectId);
}

function resolveProjectId(db: Database.Database, providedId?: string): string | null {
    if (providedId) return providedId;
    // Fallback: use first project in DB so MVP works even if frontend doesn't send projectId
    const row = db.prepare('SELECT id FROM projects LIMIT 1').get() as { id: string } | undefined;
    return row?.id ?? null;
}

async function generateAiReply(userMessage: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (apiKey) {
        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
            const result = await model.generateContent(`${SYSTEM_PROMPT}\n\nUser: ${userMessage}`);
            return result.response.text() || 'No response generated.';
        } catch (geminiErr) {
            console.error('[chat] Gemini error:', geminiErr);
        }
    }

    // Fallback to OpenAI if Gemini key not available
    try {
        const { aiProvider } = await import('@/lib/ai/openai');
        return await aiProvider.generateText(SYSTEM_PROMPT, userMessage);
    } catch (openaiErr) {
        console.error('[chat] OpenAI fallback error:', openaiErr);
        throw new Error('AI provider unavailable');
    }
}

// GET /api/chat?projectId=xxx  — returns plain array
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) return NextResponse.json([]);

    try {
        const db = getDb();
        const history = loadHistory(db, projectId);
        db.close();
        return NextResponse.json(history);
    } catch (err) {
        console.error('[chat GET] error:', err);
        return NextResponse.json([]);
    }
}

// POST /api/chat  — saves user message, generates AI reply, returns full updated array
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { message, projectId: rawProjectId } = body;

        if (!message || typeof message !== 'string') {
            return NextResponse.json([], { status: 400 });
        }

        const db = getDb();
        const projectId = resolveProjectId(db, rawProjectId);

        if (!projectId) {
            db.close();
            console.error('[chat POST] No project found in DB');
            return NextResponse.json([]);
        }

        // Load existing history
        const history = loadHistory(db, projectId);

        // Add user message
        const userMsg: ChatMessage = { role: 'user', text: message };
        const updatedHistory: ChatMessage[] = [...history, userMsg];

        // Generate AI reply
        const aiText = await generateAiReply(message);
        const aiMsg: ChatMessage = { role: 'ai', text: aiText };
        updatedHistory.push(aiMsg);

        // Persist to DB
        saveHistory(db, projectId, updatedHistory);
        db.close();

        // Return the full updated array directly (not wrapped in an object)
        return NextResponse.json(updatedHistory);
    } catch (error) {
        console.error('[chat POST] error:', error);
        return NextResponse.json([]);
    }
}

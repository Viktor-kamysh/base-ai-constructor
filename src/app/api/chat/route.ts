import { NextResponse } from 'next/server';
import { aiProvider } from '@/lib/ai/openai';
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data.db');

const SYSTEM_PROMPT = `You are Constructor PRO, an expert AI assistant for construction project management.
You help project managers and site engineers with:
- Analyzing site diaries and daily reports
- Reviewing budgets and cost variances
- Tracking project timelines and schedules
- Identifying risks and compliance issues
- Generating structured reports

Always respond in a concise, professional manner. If you need more context, ask a targeted question.`;

// GET /api/chat?projectId=xxx   — returns plain array (never wrapped in an object)
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
        return NextResponse.json([]);
    }

    try {
        const db = new Database(dbPath);
        const row = db.prepare('SELECT chat_history FROM projects WHERE id = ?').get(projectId) as { chat_history: string | null } | undefined;
        db.close();

        if (!row || !row.chat_history) {
            return NextResponse.json([]);
        }

        try {
            const parsed = JSON.parse(row.chat_history);
            return NextResponse.json(Array.isArray(parsed) ? parsed : []);
        } catch {
            return NextResponse.json([]);
        }
    } catch (err) {
        console.error('[chat GET] DB error:', err);
        return NextResponse.json([]);
    }
}

// POST /api/chat   — saves a user message, generates AI reply, persists full history
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { projectId, message } = body;

        if (!message || typeof message !== 'string') {
            return NextResponse.json(
                { error: 'missing_required_fields', response_text: 'Message is required.' },
                { status: 400 }
            );
        }

        // Load existing history
        let history: { role: 'user' | 'assistant'; content: string }[] = [];
        if (projectId) {
            try {
                const db = new Database(dbPath);
                const row = db.prepare('SELECT chat_history FROM projects WHERE id = ?').get(projectId) as { chat_history: string | null } | undefined;
                db.close();
                if (row?.chat_history) {
                    const parsed = JSON.parse(row.chat_history);
                    if (Array.isArray(parsed)) history = parsed;
                }
            } catch {
                history = [];
            }
        }

        // Generate AI response
        const responseText = await aiProvider.generateText(SYSTEM_PROMPT, message);
        const aiReply = responseText || 'No response generated.';

        // Build updated history
        const updatedHistory = [
            ...history,
            { role: 'user' as const, content: message },
            { role: 'assistant' as const, content: aiReply }
        ];

        // Persist to DB
        if (projectId) {
            try {
                const db = new Database(dbPath);
                db.prepare('UPDATE projects SET chat_history = ? WHERE id = ?').run(
                    JSON.stringify(updatedHistory),
                    projectId
                );
                db.close();
            } catch (dbErr) {
                console.error('[chat POST] DB save error:', dbErr);
            }
        }

        return NextResponse.json({
            response_text: aiReply,
            messages: updatedHistory
        });
    } catch (error) {
        console.error('[chat POST] Error:', error);
        return NextResponse.json(
            { response_text: 'Internal server error. Please try again.', messages: [] },
            { status: 500 }
        );
    }
}

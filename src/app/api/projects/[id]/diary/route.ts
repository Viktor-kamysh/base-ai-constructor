import { NextResponse } from 'next/server';
import { diaryRepo } from '@/lib/repositories/diary';
import { processSiteDiary } from '@/lib/agent/siteDiaryPipeline';

export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }) {
    const params = await context.params;
    try {
        const entries = diaryRepo.findByProjectId(params.id);
        return NextResponse.json({ entries });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch diaries' }, { status: 500 });
    }
}

export async function POST(
    request: Request,
    context: { params: Promise<{ id: string }> }) {
    const params = await context.params;
    try {
        const body = await request.json();
        const { date, rawText, photoContext } = body;

        if (!date || !rawText) {
            return NextResponse.json({ error: 'Missing date or rawText' }, { status: 400 });
        }

        const diaryEntry = await processSiteDiary(params.id, date, rawText, photoContext);

        return NextResponse.json({ diaryEntry });
    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: error.message || 'Pipeline failed' }, { status: 500 });
    }
}

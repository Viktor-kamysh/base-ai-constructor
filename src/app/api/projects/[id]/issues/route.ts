import { NextResponse } from 'next/server';
import { issuesRepo } from '@/lib/repositories/issues';

export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }) {
    const params = await context.params;
    try {
        const issues = issuesRepo.findByProjectId(params.id);
        return NextResponse.json({ issues });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch issues' }, { status: 500 });
    }
}

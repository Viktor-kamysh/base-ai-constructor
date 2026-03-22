import { NextResponse } from 'next/server';
import { diaryRepo } from '@/lib/repositories/diary';
import { issuesRepo } from '@/lib/repositories/issues';

export async function GET(
    request: Request,
    context: { params: Promise<{ id: string, diaryId: string }> }) {
    const params = await context.params;
    try {
        const entry = diaryRepo.findById(params.diaryId);
        if (!entry) {
            return NextResponse.json({ error: 'Diary entry not found' }, { status: 404 });
        }

        // Get all issues for the project that came from this diary
        const allIssues = issuesRepo.findByProjectId(params.id);
        const diaryIssues = allIssues.filter(issue => issue.source_diary_id === params.diaryId);

        return NextResponse.json({ entry, issues: diaryIssues });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch diary entry' }, { status: 500 });
    }
}

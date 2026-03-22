import { NextResponse } from 'next/server';
import { diaryRepo } from '@/lib/repositories/diary';
import { auditLogsRepo } from '@/lib/repositories/auditLogsRepo';

export async function PATCH(request: Request, context: { params: Promise<{ id: string, diaryId: string }> }) {
    const params = await context.params;
    try {
        const { resolutionNote, userName, action } = await request.json();

        const diary = diaryRepo.findById(params.diaryId);
        if (!diary) return NextResponse.json({ error: 'Diary not found' }, { status: 404 });

        const reviewStatus = action === 'disputed' ? 'disputed' : 'resolved';

        diaryRepo.updateResolution(params.diaryId, reviewStatus, resolutionNote);

        auditLogsRepo.create({
            entity_type: 'site_diary_entry',
            entity_id: params.diaryId,
            action: `Quality Gate Override (${reviewStatus})`,
            user_name: userName || 'System User',
            reason: resolutionNote
        });

        return NextResponse.json({ success: true, status: reviewStatus });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

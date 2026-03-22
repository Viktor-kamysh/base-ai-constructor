import { NextResponse } from 'next/server';
import { projectScheduleRepo } from '@/lib/repositories/projectScheduleRepo';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
    const params = await context.params;
    try {
        const schedule = projectScheduleRepo.findByProjectId(params.id);
        return NextResponse.json({ schedule });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

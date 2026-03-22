import { NextResponse } from 'next/server';
import { projectScheduleRepo } from '@/lib/repositories/projectScheduleRepo';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
    const params = await context.params;
    try {
        const data = await request.json();
        if (Array.isArray(data)) {
            data.forEach(item => {
                projectScheduleRepo.create({
                    project_id: params.id,
                    task_name: item.task_name,
                    start_date: item.start_date,
                    end_date: item.end_date,
                    dependency_id: item.dependency_id || null
                });
            });
            return NextResponse.json({ success: true, imported: data.length });
        }
        return NextResponse.json({ error: 'Invalid format. Expected JSON array of schedule objects.' }, { status: 400 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

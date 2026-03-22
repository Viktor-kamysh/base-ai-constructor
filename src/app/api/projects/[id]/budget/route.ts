import { NextResponse } from 'next/server';
import { projectEstimatesRepo } from '@/lib/repositories/projectEstimatesRepo';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
    const params = await context.params;
    try {
        const budget = projectEstimatesRepo.findByProjectId(params.id);
        return NextResponse.json({ budget });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

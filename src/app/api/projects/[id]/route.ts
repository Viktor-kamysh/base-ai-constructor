import { NextResponse } from 'next/server';
import { projectsRepo } from '@/lib/repositories/projects';

export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }) {
    const params = await context.params;
    try {
        const project = projectsRepo.findById(params.id);
        if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json({ project });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 });
    }
}

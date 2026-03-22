import { NextResponse } from 'next/server';
import { projectsRepo } from '@/lib/repositories/projects';

export async function GET() {
    try {
        const projects = projectsRepo.findAll();
        return NextResponse.json({ projects });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        if (!body.name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

        const project = projectsRepo.create(body.name, body.address);
        return NextResponse.json({ project });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
    }
}

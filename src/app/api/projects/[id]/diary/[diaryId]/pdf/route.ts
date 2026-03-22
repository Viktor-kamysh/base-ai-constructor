import { NextResponse } from 'next/server';
import { diaryRepo } from '@/lib/repositories/diary';
import { projectsRepo } from '@/lib/repositories/projects';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string, diaryId: string }> }) {
    const params = await context.params;
  try {
    const project = projectsRepo.findById(params.id);
    const entry = diaryRepo.findById(params.diaryId);

    if (!project || !entry) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const data = JSON.parse(entry.structured_data);

    const docText = `
CONSTRUCTION PRO AGENT - SITE DIARY (DRAFT FOR REVIEW)
======================================================
Project: ${project.name}
Date: ${data.date}
Confidence: ${entry.confidence.toUpperCase()}
${entry.missing_data ? `Missing Data: ${JSON.parse(entry.missing_data).join(', ')}` : ''}

Summary:
${data.summary}

---
${(data.sections || []).map((s: any) => `${s.title}\n${s.content}\n`).join('\n')}

Issues:
${(data.open_issues || []).map((i: any) => `- [${i.status}] ${i.description}`).join('\n')}
`;

    return new NextResponse(docText, {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="SiteDiary_${data.date}.txt"`
      }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 });
  }
}

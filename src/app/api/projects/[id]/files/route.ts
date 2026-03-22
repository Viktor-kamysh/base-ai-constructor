import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import db from '@/lib/db';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }) {
    const params = await context.params;
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure uploads directory exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const ext = path.extname(file.name);
    const filename = `${randomUUID()}${ext}`;
    const filePath = path.join(uploadDir, filename);

    // Write file to filesystem
    fs.writeFileSync(filePath, buffer);

    // Save to database
    const fileId = randomUUID();
    const url = `/uploads/${filename}`;

    db.prepare('INSERT INTO project_files (id, project_id, type, url) VALUES (?, ?, ?, ?)').run(
      fileId, params.id, file.type, url
    );

    return NextResponse.json({ fileId, url, name: file.name });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

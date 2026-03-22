import db from '../db';
import { randomUUID } from 'crypto';

export interface Issue {
    id: string;
    project_id: string;
    source_diary_id: string | null;
    description: string;
    status: 'open' | 'in_progress' | 'resolved';
    date: string;
    created_at: string;
}

export const issuesRepo = {
    findByProjectId: (projectId: string): Issue[] => {
        return db.prepare('SELECT * FROM issues WHERE project_id = ? ORDER BY date DESC, created_at DESC').all(projectId) as Issue[];
    },

    create: (data: Omit<Issue, 'id' | 'created_at'>): Issue => {
        const id = randomUUID();
        db.prepare(`
      INSERT INTO issues (id, project_id, source_diary_id, description, status, date) 
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
            id,
            data.project_id,
            data.source_diary_id || null,
            data.description,
            data.status || 'open',
            data.date
        );
        const issue = db.prepare('SELECT * FROM issues WHERE id = ?').get(id) as Issue;
        return issue;
    },

    updateStatus: (id: string, status: Issue['status']): void => {
        db.prepare('UPDATE issues SET status = ? WHERE id = ?').run(status, id);
    }
};

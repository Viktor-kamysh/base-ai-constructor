import db from '../db';
import { randomUUID } from 'crypto';

export interface ProjectSchedule {
    id: string;
    project_id: string;
    task_name: string;
    start_date: string;
    end_date: string;
    dependency_id: string | null;
    status: 'not_started' | 'in_progress' | 'completed';
    created_at: string;
}

export const projectScheduleRepo = {
    findByProjectId: (projectId: string): ProjectSchedule[] => {
        return db.prepare('SELECT * FROM project_schedule WHERE project_id = ?').all(projectId) as ProjectSchedule[];
    },

    findByTaskName: (projectId: string, taskName: string): ProjectSchedule | undefined => {
        // case-insensitive matching for robust lookups
        return db.prepare('SELECT * FROM project_schedule WHERE project_id = ? AND LOWER(task_name) = LOWER(?)').get(projectId, taskName) as ProjectSchedule | undefined;
    },

    updateStatus: (id: string, status: 'not_started' | 'in_progress' | 'completed') => {
        if (status === 'completed') {
            const task = db.prepare('SELECT * FROM project_schedule WHERE id = ?').get(id) as ProjectSchedule;
            if (task) {
                const projectDiaries = db.prepare('SELECT * FROM site_diary_entries WHERE project_id = ?').all(task.project_id) as any[];
                const blockingDiaries = projectDiaries.filter(d =>
                    d.compliance_status === 'violation' &&
                    d.review_status !== 'resolved' &&
                    (d.structured_data || '').includes(task.task_name)
                );
                if (blockingDiaries.length > 0) {
                    throw new Error(`Quality Gate Failure: Cannot complete task '${task.task_name}'. It has unresolved violations.`);
                }
            }
        }
        db.prepare('UPDATE project_schedule SET status = ? WHERE id = ?').run(status, id);
    },

    create: (data: Omit<ProjectSchedule, 'id' | 'created_at' | 'status'>): ProjectSchedule => {
        const id = randomUUID();
        db.prepare(`
            INSERT INTO project_schedule (id, project_id, task_name, start_date, end_date, dependency_id, status)
            VALUES (?, ?, ?, ?, ?, ?, 'not_started')
        `).run(id, data.project_id, data.task_name, data.start_date, data.end_date, data.dependency_id || null);
        return db.prepare('SELECT * FROM project_schedule WHERE id = ?').get(id) as ProjectSchedule;
    }
};

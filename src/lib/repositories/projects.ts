import db from '../db';
import { randomUUID } from 'crypto';

export interface Project {
    id: string;
    name: string;
    address: string | null;
    created_at: string;
    updated_at: string;
}

export const projectsRepo = {
    findAll: (): Project[] => {
        return db.prepare('SELECT * FROM projects ORDER BY updated_at DESC').all() as Project[];
    },

    findById: (id: string): Project | undefined => {
        return db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as Project | undefined;
    },

    create: (name: string, address?: string): Project => {
        const id = randomUUID();
        db.prepare('INSERT INTO projects (id, name, address) VALUES (?, ?, ?)').run(id, name, address || null);
        return projectsRepo.findById(id)!;
    },

    update: (id: string, name: string, address?: string): Project => {
        db.prepare('UPDATE projects SET name = ?, address = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(name, address || null, id);
        return projectsRepo.findById(id)!;
    },

    delete: (id: string): void => {
        db.prepare('DELETE FROM projects WHERE id = ?').run(id);
    }
};

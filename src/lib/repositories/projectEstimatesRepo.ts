import db from '../db';
import { randomUUID } from 'crypto';

export interface ProjectEstimate {
    id: string;
    project_id: string;
    item_name: string;
    unit: string;
    planned_quantity: number;
    unit_price: number;
    total_budget: number;
    used_quantity: number;
    created_at: string;
}

export const projectEstimatesRepo = {
    findByProjectId: (projectId: string): ProjectEstimate[] => {
        return db.prepare('SELECT * FROM project_estimates WHERE project_id = ?').all(projectId) as ProjectEstimate[];
    },

    findByItemName: (projectId: string, itemName: string): ProjectEstimate | undefined => {
        // Simple case-insensitive match for demo/MVP
        return db.prepare('SELECT * FROM project_estimates WHERE project_id = ? AND LOWER(item_name) = LOWER(?)').get(projectId, itemName) as ProjectEstimate | undefined;
    },

    create: (data: Omit<ProjectEstimate, 'id' | 'created_at' | 'used_quantity'>): ProjectEstimate => {
        const id = randomUUID();
        db.prepare(`
            INSERT INTO project_estimates (id, project_id, item_name, unit, planned_quantity, unit_price, total_budget)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(id, data.project_id, data.item_name, data.unit, data.planned_quantity, data.unit_price, data.total_budget);
        return db.prepare('SELECT * FROM project_estimates WHERE id = ?').get(id) as ProjectEstimate;
    },

    addUsedQuantity: (id: string, amount: number) => {
        db.prepare('UPDATE project_estimates SET used_quantity = used_quantity + ? WHERE id = ?').run(amount, id);
    }
};

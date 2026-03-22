import db from '../db';
import { randomUUID } from 'crypto';

export interface EstimateReview {
    id: string;
    project_id: string;
    source_file_id: string;
    findings_json: string; // JSON detailed findings
    confidence: 'high' | 'medium' | 'low';
    source_refs: string | null; // JSON array
    missing_data: string | null; // JSON array
    needs_confirmation: boolean;
    version: number;
    created_at: string;
}

export const estimatesRepo = {
    findByProjectId: (projectId: string): EstimateReview[] => {
        return db.prepare('SELECT * FROM estimate_reviews WHERE project_id = ? ORDER BY created_at DESC').all(projectId) as EstimateReview[];
    },

    create: (data: Omit<EstimateReview, 'id' | 'created_at' | 'version'>): EstimateReview => {
        const id = randomUUID();
        db.prepare(`
      INSERT INTO estimate_reviews 
      (id, project_id, source_file_id, findings_json, confidence, source_refs, missing_data, needs_confirmation) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
            id,
            data.project_id,
            data.source_file_id,
            data.findings_json,
            data.confidence,
            data.source_refs,
            data.missing_data,
            data.needs_confirmation ? 1 : 0
        );
        const review = db.prepare('SELECT * FROM estimate_reviews WHERE id = ?').get(id) as EstimateReview;
        return review;
    }
};

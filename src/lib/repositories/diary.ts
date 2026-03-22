import db from '../db';
import { randomUUID } from 'crypto';

export interface SiteDiaryEntry {
    id: string;
    project_id: string;
    date: string;
    raw_text: string | null;
    structured_data: string; // JSON
    confidence: 'high' | 'medium' | 'low';
    source_refs: string | null; // JSON array
    missing_data: string | null; // JSON array
    needs_confirmation: boolean;
    version: number;
    rule_violations: string | null; // JSON
    compliance_status: 'compliant' | 'flagged' | 'violation';
    review_status: 'pending' | 'resolved' | 'disputed';
    resolution_note: string | null;
    visual_evidence_summary: string | null;
    created_at: string;
}

export const diaryRepo = {
    findByProjectId: (projectId: string): SiteDiaryEntry[] => {
        return db.prepare('SELECT * FROM site_diary_entries WHERE project_id = ? ORDER BY date DESC, created_at DESC').all(projectId) as SiteDiaryEntry[];
    },

    findById: (id: string): SiteDiaryEntry | undefined => {
        return db.prepare('SELECT * FROM site_diary_entries WHERE id = ?').get(id) as SiteDiaryEntry | undefined;
    },

    create: (data: Omit<SiteDiaryEntry, 'id' | 'created_at' | 'version' | 'review_status' | 'resolution_note'>): SiteDiaryEntry => {
        const id = randomUUID();
        db.prepare(`
      INSERT INTO site_diary_entries 
      (id, project_id, date, raw_text, structured_data, confidence, source_refs, missing_data, needs_confirmation, rule_violations, compliance_status, visual_evidence_summary, review_status, resolution_note) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NULL)
    `).run(
            id,
            data.project_id,
            data.date,
            data.raw_text,
            data.structured_data,
            data.confidence,
            data.source_refs,
            data.missing_data,
            data.needs_confirmation ? 1 : 0,
            data.rule_violations,
            data.compliance_status,
            data.visual_evidence_summary
        );
        return diaryRepo.findById(id)!;
    },

    updateResolution: (id: string, review_status: string, resolution_note: string) => {
        db.prepare(`UPDATE site_diary_entries SET review_status = ?, resolution_note = ? WHERE id = ?`).run(review_status, resolution_note, id);
    }
};

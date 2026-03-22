import db from '../db';
import { randomUUID } from 'crypto';

export interface AuditLog {
    id: string;
    entity_type: string;
    entity_id: string;
    action: string;
    user_name: string;
    reason: string | null;
    created_at: string;
}

export const auditLogsRepo = {
    create: (data: Omit<AuditLog, 'id' | 'created_at'>): AuditLog => {
        const id = randomUUID();
        db.prepare(`
            INSERT INTO audit_logs (id, entity_type, entity_id, action, user_name, reason)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(id, data.entity_type, data.entity_id, data.action, data.user_name, data.reason || null);
        return db.prepare('SELECT * FROM audit_logs WHERE id = ?').get(id) as AuditLog;
    },

    findByEntity: (entityType: string, entityId: string): AuditLog[] => {
        return db.prepare('SELECT * FROM audit_logs WHERE entity_type = ? AND entity_id = ? ORDER BY created_at DESC').all(entityType, entityId) as AuditLog[];
    }
};

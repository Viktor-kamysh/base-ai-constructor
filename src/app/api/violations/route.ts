import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
    try {
        const violations = db.prepare(`
            SELECT d.id as diary_id, d.project_id, d.date, d.rule_violations, d.created_at, p.name as project_name 
            FROM site_diary_entries d 
            JOIN projects p ON d.project_id = p.id
            WHERE d.review_status = 'pending' AND d.compliance_status = 'violation'
            ORDER BY d.created_at DESC
        `).all() as any[];

        const enriched = violations.map(v => {
            const row = db.prepare('SELECT structured_data FROM site_diary_entries WHERE id = ?').get(v.diary_id) as any;
            const data = row ? JSON.parse(row.structured_data || "{}") : {};
            return {
                ...v,
                predicted_completion_date: data.predicted_completion_date,
                financial_impacts: data.financial_impacts
            };
        });

        return NextResponse.json({ violations: enriched });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

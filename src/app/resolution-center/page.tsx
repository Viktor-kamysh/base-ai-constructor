"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function ResolutionCenter() {
    const [violations, setViolations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchViolations();
    }, []);

    const fetchViolations = () => {
        fetch('/api/violations')
            .then(r => r.json())
            .then(data => {
                setViolations(data.violations || []);
                setLoading(false);
            })
            .catch(e => {
                console.error(e);
                setLoading(false);
            });
    };

    const handleAction = async (diaryId: string, projectId: string, actionName: string) => {
        let note = "";
        const user = prompt("Enter your name for the Audit Trail:") || "Admin";

        if (actionName === 'disputed') {
            note = prompt("Enter resolution reason (Override Justification):") || "";
            if (!note) return;
        } else {
            note = "Accepted AI Finding. Notification sent to foreman.";
        }

        const res = await fetch(`/api/projects/${projectId}/diary/${diaryId}/resolve`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resolutionNote: note, userName: user, action: actionName })
        });

        if (res.ok) {
            fetchViolations();
        } else {
            alert("Failed to process action.");
        }
    };

    if (loading) return <div>Loading Resolution Center...</div>;

    return (
        <div>
            <h2>Inbox: Resolution Center</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Review unhandled exceptions and AI alerts across all interconnected construction projects.</p>

            {violations.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
                    <h3>All Clear!</h3>
                    <p>No critical issues or budget overruns currently require your attention.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    {violations.map((v, i) => {
                        let parsedRules = [];
                        try { parsedRules = JSON.parse(v.rule_violations || '[]'); } catch (e) { }

                        const hoursPending = Math.floor((new Date().getTime() - new Date(v.created_at).getTime()) / (1000 * 60 * 60));

                        return (
                            <div key={i} className="card" style={{ borderLeft: hoursPending > 24 ? '4px solid var(--error)' : '4px solid var(--warning)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                                    <h3 style={{ margin: 0 }}>Project: <Link href={`/projects/${v.project_id}`} style={{ color: 'var(--primary)' }}>{v.project_name}</Link></h3>
                                    <span style={{ fontSize: '0.875rem', color: hoursPending > 24 ? 'var(--error)' : 'var(--text-muted)', fontWeight: hoursPending > 24 ? 'bold' : 'normal' }}>
                                        {hoursPending}h pending
                                    </span>
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <strong>Violations Detected ({v.date}):</strong>
                                    <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem', fontSize: '0.875rem' }}>
                                        {parsedRules.map((rule: any, idx: number) => (
                                            <li key={idx}><strong>{rule.rule_id}:</strong> {rule.description}</li>
                                        ))}
                                    </ul>
                                </div>

                                {v.predicted_completion_date && (
                                    <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '4px', fontSize: '0.875rem', marginBottom: '1rem', border: '1px solid #e2e8f0' }}>
                                        <strong>⏱️ Timeline Impact:</strong> Resolving this issue rapidly might reduce the currently forecasted overall completion date of <strong style={{ color: 'var(--primary)' }}>{v.predicted_completion_date}</strong>.
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                    <button onClick={() => handleAction(v.diary_id, v.project_id, 'resolved')} className="btn btn-primary" style={{ background: '#10b981', border: 'none' }}>
                                        ✅ Accept Finding
                                    </button>
                                    <button onClick={() => handleAction(v.diary_id, v.project_id, 'disputed')} className="btn" style={{ background: '#eab308', color: '#000', border: 'none' }}>
                                        ✍️ Override (Veto)
                                    </button>
                                    <Link href={`/projects/${v.project_id}/diary/${v.diary_id}`} className="btn" style={{ border: '1px solid var(--border)', color: 'var(--text)' }}>
                                        🔍 View Context
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

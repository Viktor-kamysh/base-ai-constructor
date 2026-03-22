"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function DiaryAnalysisView() {
    const { id, diaryId } = useParams();
    const router = useRouter();

    const [entry, setEntry] = useState<any>(null);
    const [issues, setIssues] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const handleGenerateChangeOrder = async (description: string) => {
        const match = description.match(/for '([^']+)' \(([\d.]+) ([^)]+)\)/);
        const itemName = match ? match[1] : 'Unknown Item';
        const quantity = match ? parseFloat(match[2]) : 1;
        const unit = match ? match[3] : 'ks';

        const res = await fetch(`/api/projects/${id}/diary/${diaryId}/change-order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ itemName, quantity, unit })
        });

        if (res.ok) {
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ChangeOrder_${itemName.replace(/\\s+/g, '_')}.pdf`;
            a.click();
        } else {
            alert("Failed to generate Change Order document.");
        }
    };

    const handleResolve = async () => {
        const note = prompt("Enter resolution reason (e.g. 'Approved material replacement'):");
        if (!note) return;
        const user = prompt("Enter your name for the Audit Trail:") || "Admin";

        const res = await fetch(`/api/projects/${id}/diary/${diaryId}/resolve`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resolutionNote: note, userName: user, action: 'resolved' })
        });

        if (res.ok) {
            window.location.reload();
        } else {
            alert("Failed to resolve the violation.");
        }
    };

    useEffect(() => {
        fetch(`/api/projects/${id}/diary/${diaryId}`)
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    console.error(data.error);
                } else {
                    setEntry(data.entry);
                    setIssues(data.issues || []);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [id, diaryId]);

    if (loading) return <div>Loading analysis...</div>;
    if (!entry) return <div>Diary entry not found.</div>;

    const data = JSON.parse(entry.structured_data);
    const missingData = entry.missing_data ? JSON.parse(entry.missing_data) : [];
    const ruleViolations = entry.rule_violations ? JSON.parse(entry.rule_violations) : [];

    const ConfidenceBadge = ({ conf }: { conf: string }) => {
        const colorClass = conf === 'high' ? 'conf-high' : conf === 'medium' ? 'conf-medium' : 'conf-low';
        return (
            <span className={`confidence-indicator ${colorClass}`} title="Confidence Score">
                {conf}
            </span>
        );
    };

    return (
        <div>
            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button onClick={() => router.back()} className="btn" style={{ background: 'var(--border)', color: 'var(--text)' }}>
                    ← Back
                </button>
                <h2 style={{ margin: 0 }}>Site Diary Analysis: {data.date}</h2>
                <span className="draft-badge">Draft For Review</span>
                <ConfidenceBadge conf={entry.confidence} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '1.5rem', alignItems: 'start' }}>

                {/* Main Content Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="card">
                        <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Summary</h3>
                        <p>{data.summary}</p>
                    </div>

                    <div className="card">
                        <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Work Performed</h3>
                        {data.sections && data.sections.map((sec: any, idx: number) => (
                            <div key={idx} style={{ marginBottom: '1rem' }}>
                                <h4 style={{ color: 'var(--primary-hover)' }}>{sec.title}</h4>
                                <p style={{ whiteSpace: 'pre-wrap' }}>{sec.content}</p>
                            </div>
                        ))}
                        {(!data.sections || data.sections.length === 0) && <p style={{ color: 'var(--text-muted)' }}>No specific work sections recorded.</p>}
                    </div>

                    <div className="card">
                        <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Participants</h3>
                        {data.participants && data.participants.length > 0 ? (
                            <ul style={{ paddingLeft: '1.5rem' }}>
                                {data.participants.map((p: string, i: number) => (
                                    <li key={i}>{p}</li>
                                ))}
                            </ul>
                        ) : (
                            <p style={{ color: 'var(--text-muted)' }}>No participants recorded.</p>
                        )}
                    </div>
                </div>

                {/* Sidebar Column for Insights/Issues/Missing */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Critical Issues Block */}
                    <div className="card card-critical">
                        <h3>🔴 Critical Issues</h3>
                        <p style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>Extracted problems requiring attention.</p>
                        {issues.length > 0 || (data.open_issues && data.open_issues.length > 0) ? (
                            <ul style={{ paddingLeft: '1.2rem', margin: 0 }}>
                                {issues.map(iss => (
                                    <li key={iss.id} style={{ marginBottom: '0.5rem' }}>
                                        <strong>{iss.status.toUpperCase()}:</strong> {iss.description}
                                    </li>
                                ))}
                                {issues.length === 0 && data.open_issues?.map((iss: any, i: number) => (
                                    <li key={i} style={{ marginBottom: '0.5rem' }}>
                                        <strong>{iss.status?.toUpperCase()}:</strong> {iss.description}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No critical issues detected.</p>
                        )}
                    </div>

                    {/* Missing Info Block */}
                    {missingData.length > 0 && (
                        <div className="card card-missing">
                            <h3 style={{ color: 'var(--warning)' }}>⚠️ Missing Info</h3>
                            <p style={{ fontSize: '0.875rem', marginBottom: '1rem', color: 'var(--text)' }}>
                                The following required data was missing from the input:
                            </p>
                            <ul style={{ paddingLeft: '1.2rem', margin: 0, color: 'var(--text)' }}>
                                {missingData.map((miss: string, idx: number) => (
                                    <li key={idx} style={{ marginBottom: '0.25rem' }}>{miss.replace(/_/g, ' ')}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {/* Tech Supervision Rules Block */}
                    {ruleViolations.length > 0 && (
                        <div className={`card ${entry.compliance_status === 'violation' ? 'card-critical' : 'card-missing'}`}>
                            <h3>{entry.compliance_status === 'violation' ? '❌ Rule Violations' : '⚠️ Rule Warnings'}</h3>
                            <ul style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.875rem' }}>
                                {ruleViolations.map((v: any, idx: number) => (
                                    <li key={idx} style={{ marginBottom: '0.5rem' }}>
                                        <strong>{v.rule_id}:</strong> {v.description}
                                        {v.rule_id === 'item_not_in_estimate' && (
                                            <div style={{ marginTop: '0.5rem' }}>
                                                <button
                                                    onClick={() => handleGenerateChangeOrder(v.description)}
                                                    className="btn btn-primary"
                                                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', backgroundColor: '#eab308', color: '#000' }}
                                                >
                                                    📄 Generate Change Order for this item
                                                </button>
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {entry.compliance_status === 'compliant' && (
                        <div className="card" style={{ border: '2px solid var(--success)', backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                            <h3 style={{ color: 'var(--success)', margin: 0 }}>✅ Compliant</h3>
                            <p style={{ fontSize: '0.875rem', margin: '0.5rem 0 0 0' }}>Passed all tech supervision rules.</p>
                        </div>
                    )}

                    {/* Resolution / Quality Gate Blocks */}
                    {entry.compliance_status === 'violation' && entry.review_status === 'pending' && (
                        <div className="card" style={{ border: '2px solid var(--warning)', backgroundColor: 'rgba(234, 179, 8, 0.1)' }}>
                            <h3 style={{ margin: 0 }}>🚧 Quality Gate Locked</h3>
                            <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>This diary contains violations. Interdependent schedule tasks cannot be marked complete until resolved.</p>
                            <button onClick={handleResolve} className="btn" style={{ marginTop: '1rem', background: 'var(--warning)', color: '#000', fontWeight: 'bold' }}>✍️ Override & Resolve</button>
                        </div>
                    )}
                    {entry.review_status === 'resolved' && (
                        <div className="card" style={{ border: '2px solid var(--success)', backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                            <h3 style={{ margin: 0, color: 'var(--success)' }}>🛡️ Violation Resolved</h3>
                            <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}><strong>Audit Reason:</strong> {entry.resolution_note}</p>
                        </div>
                    )}

                    {/* Visual Evidence Summary Block */}
                    {entry.visual_evidence_summary && (
                        <div className="card" style={{ border: '1px solid var(--border)' }}>
                            <h3>📷 Visual Evidence Audit</h3>
                            <p style={{ fontSize: '0.875rem', marginTop: '0.5rem', whiteSpace: 'pre-wrap' }}>
                                {entry.visual_evidence_summary}
                            </p>
                        </div>
                    )}

                    {/* Financial Impact Block */}
                    {data.financial_impacts && data.financial_impacts.length > 0 && (
                        <div className="card" style={{ border: '1px solid var(--border)' }}>
                            <h3>💰 Financial Impact</h3>
                            {data.financial_impacts.map((impact: any, idx: number) => (
                                <p key={idx} style={{ fontSize: '0.875rem', marginTop: '0.5rem', color: impact.is_overrun ? 'var(--error)' : 'inherit' }}>
                                    За сегодня израсходовано {impact.consumed_pct.toFixed(2)}% бюджета на <strong>{impact.item_name}</strong>.
                                    Остаток по смете: {impact.remaining_pct.toFixed(2)}%.
                                    {impact.is_overrun && <strong> (⚠️ ПРЕВЫШЕНИЕ БЮДЖЕТА!)</strong>}
                                </p>
                            ))}
                        </div>
                    )}

                    {/* Context Details */}
                    <div className="card">
                        <h3>Metadata</h3>
                        <div style={{ fontSize: '0.875rem', marginTop: '1rem', display: 'grid', gap: '0.5rem' }}>
                            <div><strong>Weather:</strong> {data.weather || '-'}</div>
                            <div><strong>Author:</strong> {data.author || '-'}</div>
                            <div><strong>Generated:</strong> {new Date(entry.created_at).toLocaleString()}</div>
                            <div><strong>Version:</strong> {entry.version}</div>
                            {data.predicted_completion_date && (
                                <div style={{ color: 'var(--primary-hover)', fontWeight: 'bold' }}>
                                    <strong>AI Predicted Completion:</strong> {data.predicted_completion_date}
                                </div>
                            )}
                        </div>
                        <div style={{ marginTop: '1.5rem' }}>
                            <Link href={`/api/projects/${id}/diary/${diaryId}/pdf`} target="_blank" className="btn btn-primary" style={{ width: '100%' }}>
                                📄 Export PDF Draft
                            </Link>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'diary' | 'estimates' | 'issues'>('diary');
  const [loading, setLoading] = useState(true);

  // Diary State
  const [diaryNote, setDiaryNote] = useState("");
  const [diaries, setDiaries] = useState<any[]>([]);

  // Estimate State
  const [estimates, setEstimates] = useState<any[]>([]);

  // Issues State
  const [issues, setIssues] = useState<any[]>([]);

  // Budget State
  const [budgetItems, setBudgetItems] = useState<any[]>([]);

  // Schedule State
  const [schedule, setSchedule] = useState<any[]>([]);

  // Export Settings
  const [reportLang, setReportLang] = useState('en');

  useEffect(() => {
    fetch(`/api/projects/${id}`).then(r => r.json()).then(d => { setProject(d.project); setLoading(false); });
    fetch(`/api/projects/${id}/diary`).then(r => r.json()).then(d => setDiaries(d.entries || []));
    fetch(`/api/projects/${id}/issues`).then(r => r.json()).then(d => setIssues(d.issues || []));
    fetch(`/api/projects/${id}/estimates`).then(r => r.json()).then(d => setEstimates(d.reviews || []));
    fetch(`/api/projects/${id}/budget`).then(r => r.json()).then(d => setBudgetItems(d.budget || []));
    fetch(`/api/projects/${id}/schedule`).then(r => r.json()).then(d => setSchedule(d.schedule || []));
  }, [id]);

  const handleGenerateDiary = async () => {
    if (!diaryNote.trim()) return;
    const res = await fetch(`/api/projects/${id}/diary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: new Date().toISOString().split('T')[0], rawText: diaryNote })
    });
    const data = await res.json();
    if (data.diaryEntry) {
      setDiaries([data.diaryEntry, ...diaries]);
      setDiaryNote("");
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!project) return <div>Project not found</div>;

  let predictedDelayDays = 0;
  if (schedule.length > 0 && diaries.length > 0) {
    const maxPlannedEnd = Math.max(...schedule.map(s => new Date(s.end_date).getTime()));
    for (const diary of diaries) {
      const struct = diary.structured_data ? JSON.parse(diary.structured_data) : {};
      if (struct.predicted_completion_date) {
        const predictedEnd = new Date(struct.predicted_completion_date).getTime();
        const diffMs = predictedEnd - maxPlannedEnd;
        if (diffMs > 0) {
          predictedDelayDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        }
        break;
      }
    }
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>{project.name}</h2>
          <p style={{ color: 'var(--text-muted)' }}>{project.address || 'No address provided'}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {predictedDelayDays > 0 && (
            <div style={{ padding: '0.5rem 1rem', background: 'var(--error)', color: '#fff', borderRadius: '4px', fontWeight: 'bold' }}>
              Прогноз задержки: +{predictedDelayDays} дней
            </div>
          )}
          <select value={reportLang} onChange={e => setReportLang(e.target.value)} className="btn" style={{ padding: '0.5rem' }}>
            <option value="en">English Report</option>
            <option value="cs">Český Report</option>
            <option value="ru">Русский Отчет</option>
          </select>
          <Link href={`/api/projects/${id}/reports/weekly?lang=${reportLang}`} target="_blank" className="btn btn-primary" style={{ backgroundColor: '#2563eb' }}>
            📊 Export Weekly Report
          </Link>
        </div>
      </div>

      {/* Budget Progress Bar Widget */}
      {budgetItems && budgetItems.length > 0 && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3>Budget Progress</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
            {budgetItems.map(item => {
              const pct = item.planned_quantity > 0 ? (item.used_quantity / item.planned_quantity) * 100 : 0;
              const isOver = pct > 100;
              return (
                <div key={item.id} style={{ border: '1px solid var(--border)', padding: '1rem', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <strong>{item.item_name}</strong>
                    <span style={{ color: isOver ? 'var(--error)' : 'var(--text-muted)' }}>{pct.toFixed(1)}%</span>
                  </div>
                  <div style={{ width: '100%', backgroundColor: '#eee', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: isOver ? 'var(--error)' : 'var(--primary)', height: '100%' }}></div>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    {item.used_quantity} / {item.planned_quantity} {item.unit}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Timeline Widget */}
      {schedule && schedule.length > 0 && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3>🗓️ Timeline Tracker (Plan vs Actual)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            {schedule.map(item => {
              const isCritical = schedule.some(s => s.dependency_id === item.id);
              const isDelayed = item.status !== 'completed' && new Date() > new Date(item.end_date);
              const pulseStyle = (isCritical && isDelayed) ? { animation: 'pulse-red 2s infinite', borderLeft: '4px solid var(--error)' } : {};

              const startDate = new Date(item.start_date).getTime();
              const endDate = new Date(item.end_date).getTime();
              const durMs = endDate - startDate;
              const days = Math.ceil(durMs / (1000 * 60 * 60 * 24)) || 1;
              const todayMs = new Date().getTime();
              const daysPassed = Math.ceil((todayMs - startDate) / (1000 * 60 * 60 * 24));
              let progressWidth = Math.max(0, Math.min(100, (daysPassed / days) * 100));
              if (item.status === 'completed') progressWidth = 100;

              return (
                <div key={item.id} style={{ ...pulseStyle, padding: '1rem', border: '1px solid var(--border)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <strong>
                      {item.task_name}
                      {isCritical && <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', background: '#eab308', color: '#000', padding: '0.1rem 0.5rem', borderRadius: '4px' }}>Path Dependency</span>}
                    </strong>
                    <span style={{ fontSize: '0.875rem' }}>
                      {item.start_date} → {item.end_date}
                      <strong style={{ marginLeft: '0.5rem', color: item.status === 'completed' ? 'var(--success)' : (isDelayed ? 'var(--error)' : 'inherit') }}>
                        [{item.status.toUpperCase()}]
                      </strong>
                    </span>
                  </div>
                  {/* Plan Line (Blue) */}
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.3rem' }}>
                    <div style={{ width: '60px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>PLAN</div>
                    <div style={{ flex: 1, backgroundColor: '#eee', height: '10px', borderRadius: '5px' }}>
                      <div style={{ width: '100%', height: '100%', backgroundColor: '#3b82f6', borderRadius: '5px' }} />
                    </div>
                  </div>
                  {/* Actual Line (Orange/Green) */}
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ width: '60px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>ACTUAL</div>
                    <div style={{ flex: 1, backgroundColor: '#eee', height: '10px', borderRadius: '5px' }}>
                      <div style={{ width: `${progressWidth}%`, height: '100%', backgroundColor: item.status === 'completed' ? '#10b981' : '#f97316', borderRadius: '5px' }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <style>{`
            @keyframes pulse-red {
              0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
              70% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
              100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
            }
          `}</style>
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border)', marginBottom: '2rem' }}>
        {(['diary', 'estimates', 'issues'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '0.5rem 1rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
              fontWeight: activeTab === tab ? 'bold' : 'normal',
              textTransform: 'capitalize'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'diary' && (
        <div>
          <div className="card" style={{ marginBottom: '2rem' }}>
            <h3>Create Site Diary</h3>
            <textarea
              value={diaryNote}
              onChange={e => setDiaryNote(e.target.value)}
              placeholder="Enter raw notes or voice transcript..."
              style={{ width: '100%', minHeight: '100px', margin: '1rem 0', padding: '0.5rem' }}
            />
            <button className="btn btn-primary" onClick={handleGenerateDiary}>Generate Structured Diary</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {diaries.map(d => {
              const data = JSON.parse(d.structured_data);
              return (
                <div key={d.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h4>{data.date} - {data.project_name}</h4>
                    <span className="draft-badge">Draft for Review</span>
                  </div>
                  <div style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>
                    <strong>Confidence:</strong> <span style={{ textTransform: 'uppercase', color: d.confidence === 'low' ? 'var(--error)' : d.confidence === 'high' ? 'var(--success)' : 'var(--warning)' }}>{d.confidence}</span>
                    {d.missing_data && (
                      <div style={{ color: 'var(--error)', marginTop: '0.5rem' }}>
                        <strong>Missing Data:</strong> {JSON.parse(d.missing_data).join(', ')}
                      </div>
                    )}
                  </div>
                  <p><strong>Summary:</strong> {data.summary}</p>
                  <div style={{ marginTop: '1rem' }}>
                    <Link href={`/projects/${id}/diary/${d.id}`} className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem' }}>
                      View Analysis & Insights
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'estimates' && (
        <div>
          <div className="card" style={{ marginBottom: '2rem' }}>
            <h3>Review Estimate (MVP)</h3>
            <p style={{ color: 'var(--text-muted)' }}>To test this in MVP, we will rely on integration logic or manual POST requests with parsed lines.</p>
          </div>
          {estimates.map(e => (
            <div key={e.id} className="card" style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <h4>Estimate Review</h4>
                <span className="draft-badge">Draft for Review</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'issues' && (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {issues.map(iss => (
            <div key={iss.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{iss.date}</strong>
                <span style={{
                  padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem',
                  background: iss.status === 'open' ? 'var(--error)' : 'var(--success)', color: 'white'
                }}>{iss.status}</span>
              </div>
              <p style={{ marginTop: '0.5rem' }}>{iss.description}</p>
            </div>
          ))}
          {issues.length === 0 && <p>No issues tracked yet.</p>}
        </div>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Project {
    id: string;
    name: string;
    address: string | null;
    updated_at: string;
}

export default function Home() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/projects')
            .then(res => res.json())
            .then(data => {
                setProjects(data.projects || []);
                setLoading(false);
            });
    }, []);

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2>Projects</h2>
                <Link href="/projects/new" className="btn btn-primary">
                    + New Project
                </Link>
            </div>

            <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                {loading ? (
                    <p>Loading projects...</p>
                ) : projects.length === 0 ? (
                    <div className="card" style={{ gridColumn: '1 / -1' }}>
                        <p style={{ color: 'var(--text-muted)' }}>No projects found. Create one to get started.</p>
                    </div>
                ) : (
                    projects.map(p => (
                        <Link key={p.id} href={`/projects/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                            <div className="card" style={{ cursor: 'pointer', transition: 'transform 0.2s', border: '1px solid var(--border)' }}>
                                <h3>{p.name}</h3>
                                {p.address && <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>📍 {p.address}</p>}
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
                                    Updated: {new Date(p.updated_at).toLocaleDateString()}
                                </p>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div >
    );
}

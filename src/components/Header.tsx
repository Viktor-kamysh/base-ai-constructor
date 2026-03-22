"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Header() {
    const [pendingCount, setPendingCount] = useState(0);
    const [hasOldViolations, setHasOldViolations] = useState(false);

    useEffect(() => {
        fetch('/api/violations')
            .then(r => r.json())
            .then(data => {
                if (data.violations) {
                    setPendingCount(data.violations.length);
                    const now = new Date().getTime();
                    const old = data.violations.find((v: any) => (now - new Date(v.created_at).getTime()) > 24 * 60 * 60 * 1000);
                    if (old) setHasOldViolations(true);
                }
            })
            .catch(e => console.error(e));
    }, []);

    return (
        <header style={{ padding: '1rem 2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff' }}>
            <h2 style={{ margin: 0 }}>
                <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>🏗️ Constructor Pro</Link>
            </h2>
            <nav style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', fontWeight: 'bold' }}>
                <Link href="/" style={{ textDecoration: 'none', color: 'var(--text)' }}>Projects</Link>
                <Link href="/resolution-center" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'var(--text)' }}>
                    Resolution Center
                    {pendingCount > 0 && (
                        <span style={{
                            background: hasOldViolations ? 'var(--error)' : 'var(--warning)',
                            color: hasOldViolations ? '#fff' : '#000',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            animation: hasOldViolations ? 'pulse-red 2s infinite' : 'none'
                        }}>
                            {pendingCount} {hasOldViolations ? '🔴' : '🔔'}
                        </span>
                    )}
                </Link>
            </nav>
            <style>{`
            @keyframes pulse-red {
              0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
              70% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
              100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
            }
          `}</style>
        </header>
    );
}

import React, { useState, useEffect } from 'react';
import type { Run } from '../types';

export default function RunsList() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRun, setSelectedRun] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'timestamp' | 'score'>('timestamp');

  useEffect(() => {
    loadRuns();
  }, []);

  const loadRuns = async () => {
    try {
      // In production, fetch from API endpoint
      // For now, use mock data or localStorage
      const mockRuns: Run[] = [
        {
          id: 'run-001',
          candidateId: 'candidate-abc',
          timestamp: new Date().toISOString(),
          status: 'complete',
          duration: 1250,
          metrics: {
            functional: { accuracy: 0.95, errorRate: 0.05, testsPassed: 19, testsFailed: 1 },
            chaos: { latencyP95: 450, chaosDivergence: 0.08, retryHygieneScore: 0.92 },
            idempotency: { idempotencyViolations: 0, correctReplays: 10 },
            overall: { score: 0.94, passed: true },
          },
        },
      ];
      
      setRuns(mockRuns);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load runs:', error);
      setLoading(false);
    }
  };

  const sortedRuns = [...runs].sort((a, b) => {
    if (sortBy === 'timestamp') {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    } else {
      return (b.metrics.overall?.score ?? 0) - (a.metrics.overall?.score ?? 0);
    }
  });

  if (loading) {
    return <div style={styles.loading}>Loading runs...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>Evaluation Runs</h2>
        <div style={styles.controls}>
          <label>
            Sort by:
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} style={styles.select}>
              <option value="timestamp">Timestamp</option>
              <option value="score">Score</option>
            </select>
          </label>
        </div>
      </div>

      {runs.length === 0 ? (
        <div style={styles.empty}>No runs found. Generate candidates and run evaluations to see results here.</div>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th>Run ID</th>
              <th>Candidate</th>
              <th>Timestamp</th>
              <th>Status</th>
              <th>Score</th>
              <th>Accuracy</th>
              <th>Latency P95</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
            {sortedRuns.map((run) => (
              <tr
                key={run.id}
                onClick={() => setSelectedRun(run.id)}
                style={{
                  ...styles.row,
                  ...(selectedRun === run.id ? styles.rowSelected : {}),
                }}
              >
                <td>{run.id}</td>
                <td>{run.candidateId.slice(0, 12)}...</td>
                <td>{new Date(run.timestamp).toLocaleString()}</td>
                <td>
                  <span style={getStatusStyle(run.status)}>{run.status}</span>
                </td>
                <td>{((run.metrics.overall?.score ?? 0) * 100).toFixed(1)}%</td>
                <td>{((run.metrics.functional?.accuracy ?? 0) * 100).toFixed(1)}%</td>
                <td>{run.metrics.chaos?.latencyP95 ?? 'N/A'}ms</td>
                <td>{run.duration ? `${run.duration}ms` : 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function getStatusStyle(status: Run['status']): React.CSSProperties {
  const base = { padding: '4px 8px', borderRadius: '4px', fontSize: '12px' };
  switch (status) {
    case 'complete':
      return { ...base, backgroundColor: '#d4edda', color: '#155724' };
    case 'running':
      return { ...base, backgroundColor: '#fff3cd', color: '#856404' };
    case 'failed':
      return { ...base, backgroundColor: '#f8d7da', color: '#721c24' };
  }
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '16px',
    fontFamily: 'system-ui, sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  controls: {
    display: 'flex',
    gap: '12px',
  },
  select: {
    marginLeft: '8px',
    padding: '4px 8px',
    borderRadius: '4px',
    border: '1px solid #ccc',
  },
  loading: {
    textAlign: 'center',
    padding: '32px',
    color: '#666',
  },
  empty: {
    textAlign: 'center',
    padding: '32px',
    color: '#666',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: 'white',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  row: {
    cursor: 'pointer',
    borderBottom: '1px solid #eee',
  },
  rowSelected: {
    backgroundColor: '#e3f2fd',
  },
};
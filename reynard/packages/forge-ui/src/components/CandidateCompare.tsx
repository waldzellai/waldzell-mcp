import React, { useState } from 'react';
import type { Candidate, ComparisonData } from '../types';

interface Props {
  candidate1?: Candidate;
  candidate2?: Candidate;
}

export default function CandidateCompare({ candidate1, candidate2 }: Props) {
  const [showManifests, setShowManifests] = useState(true);
  const [showMetrics, setShowMetrics] = useState(true);
  const [showFindings, setShowFindings] = useState(true);

  if (!candidate1 || !candidate2) {
    return (
      <div style={styles.empty}>
        Select two candidates to compare. Use the RunsList to pick candidates.
      </div>
    );
  }

  const comparison = computeComparison(candidate1, candidate2);

  return (
    <div style={styles.container}>
      <h2>Candidate Comparison</h2>

      <div style={styles.header}>
        <div style={styles.candidateInfo}>
          <h3>Candidate A</h3>
          <p>{candidate1.id}</p>
          <p style={styles.meta}>{new Date(candidate1.createdAt).toLocaleString()}</p>
        </div>
        <div style={styles.vs}>vs</div>
        <div style={styles.candidateInfo}>
          <h3>Candidate B</h3>
          <p>{candidate2.id}</p>
          <p style={styles.meta}>{new Date(candidate2.createdAt).toLocaleString()}</p>
        </div>
      </div>

      {/* Metrics Comparison */}
      <section style={styles.section}>
        <div style={styles.sectionHeader} onClick={() => setShowMetrics(!showMetrics)}>
          <h3>Metrics Comparison {showMetrics ? '▼' : '▶'}</h3>
        </div>
        {showMetrics && (
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Metric</th>
                <th>Candidate A</th>
                <th>Candidate B</th>
                <th>Difference</th>
              </tr>
            </thead>
            <tbody>
              {comparison.metricsDiff.map((diff, idx) => (
                <tr key={idx}>
                  <td>{diff.field}</td>
                  <td>{diff.value1.toFixed(3)}</td>
                  <td>{diff.value2.toFixed(3)}</td>
                  <td style={getDiffStyle(diff.diff)}>
                    {diff.diff > 0 ? '+' : ''}{diff.diff.toFixed(3)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Manifest Comparison */}
      <section style={styles.section}>
        <div style={styles.sectionHeader} onClick={() => setShowManifests(!showManifests)}>
          <h3>Manifest Comparison {showManifests ? '▼' : '▶'}</h3>
        </div>
        {showManifests && (
          <div style={styles.manifestGrid}>
            <div>
              <h4>Candidate A Models</h4>
              <pre style={styles.pre}>{JSON.stringify(candidate1.manifest.modelPins, null, 2)}</pre>
              <h4>Budgets</h4>
              <pre style={styles.pre}>{JSON.stringify(candidate1.manifest.budgets, null, 2)}</pre>
            </div>
            <div>
              <h4>Candidate B Models</h4>
              <pre style={styles.pre}>{JSON.stringify(candidate2.manifest.modelPins, null, 2)}</pre>
              <h4>Budgets</h4>
              <pre style={styles.pre}>{JSON.stringify(candidate2.manifest.budgets, null, 2)}</pre>
            </div>
          </div>
        )}
      </section>

      {/* Findings Comparison */}
      <section style={styles.section}>
        <div style={styles.sectionHeader} onClick={() => setShowFindings(!showFindings)}>
          <h3>Security Findings {showFindings ? '▼' : '▶'}</h3>
        </div>
        {showFindings && (
          <div>
            <div style={styles.findingsCompare}>
              <div>
                <h4>Only in A ({comparison.findingsDiff.onlyIn1.length})</h4>
                {comparison.findingsDiff.onlyIn1.map(f => (
                  <div key={f.id} style={styles.finding}>
                    {getSeverityBadge(f.severity)}
                    {f.description}
                  </div>
                ))}
              </div>
              <div>
                <h4>Only in B ({comparison.findingsDiff.onlyIn2.length})</h4>
                {comparison.findingsDiff.onlyIn2.map(f => (
                  <div key={f.id} style={styles.finding}>
                    {getSeverityBadge(f.severity)}
                    {f.description}
                  </div>
                ))}
              </div>
              <div>
                <h4>Common ({comparison.findingsDiff.common.length})</h4>
                {comparison.findingsDiff.common.map(f => (
                  <div key={f.id} style={styles.finding}>
                    {getSeverityBadge(f.severity)}
                    {f.description}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function computeComparison(c1: Candidate, c2: Candidate): ComparisonData {
  const metricsDiff = [
    {
      field: 'Overall Score',
      value1: c1.metrics?.overall?.score ?? 0,
      value2: c2.metrics?.overall?.score ?? 0,
      diff: (c2.metrics?.overall?.score ?? 0) - (c1.metrics?.overall?.score ?? 0),
    },
    {
      field: 'Accuracy',
      value1: c1.metrics?.functional?.accuracy ?? 0,
      value2: c2.metrics?.functional?.accuracy ?? 0,
      diff: (c2.metrics?.functional?.accuracy ?? 0) - (c1.metrics?.functional?.accuracy ?? 0),
    },
    {
      field: 'Latency P95',
      value1: c1.metrics?.chaos?.latencyP95 ?? 0,
      value2: c2.metrics?.chaos?.latencyP95 ?? 0,
      diff: (c2.metrics?.chaos?.latencyP95 ?? 0) - (c1.metrics?.chaos?.latencyP95 ?? 0),
    },
  ];

  const findingsDiff = {
    onlyIn1: c1.redteamFindings?.filter(f1 => !c2.redteamFindings?.some(f2 => f2.id === f1.id)) ?? [],
    onlyIn2: c2.redteamFindings?.filter(f2 => !c1.redteamFindings?.some(f1 => f1.id === f2.id)) ?? [],
    common: c1.redteamFindings?.filter(f1 => c2.redteamFindings?.some(f2 => f2.id === f1.id)) ?? [],
  };

  return {
    candidates: [c1, c2],
    metricsDiff,
    findingsDiff,
  };
}

function getDiffStyle(diff: number): React.CSSProperties {
  if (diff > 0.05) return { color: '#28a745', fontWeight: 'bold' };
  if (diff < -0.05) return { color: '#dc3545', fontWeight: 'bold' };
  return { color: '#6c757d' };
}

function getSeverityBadge(severity: string): React.ReactElement {
  const styles: Record<string, React.CSSProperties> = {
    critical: { backgroundColor: '#dc3545', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', marginRight: '8px' },
    high: { backgroundColor: '#fd7e14', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', marginRight: '8px' },
    medium: { backgroundColor: '#ffc107', color: 'black', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', marginRight: '8px' },
    low: { backgroundColor: '#28a745', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', marginRight: '8px' },
  };
  return <span style={styles[severity] || styles.low}>{severity.toUpperCase()}</span>;
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '16px',
    fontFamily: 'system-ui, sans-serif',
  },
  empty: {
    textAlign: 'center',
    padding: '32px',
    color: '#666',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: '24px',
    padding: '16px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
  },
  candidateInfo: {
    textAlign: 'center',
  },
  meta: {
    fontSize: '12px',
    color: '#666',
  },
  vs: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#6c757d',
  },
  section: {
    marginBottom: '24px',
    border: '1px solid #dee2e6',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  sectionHeader: {
    padding: '12px 16px',
    backgroundColor: '#f8f9fa',
    cursor: 'pointer',
    userSelect: 'none',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  manifestGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    padding: '16px',
  },
  pre: {
    backgroundColor: '#f5f5f5',
    padding: '8px',
    borderRadius: '4px',
    fontSize: '12px',
    overflow: 'auto',
  },
  findingsCompare: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '16px',
    padding: '16px',
  },
  finding: {
    padding: '8px',
    marginBottom: '8px',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
    fontSize: '13px',
  },
};
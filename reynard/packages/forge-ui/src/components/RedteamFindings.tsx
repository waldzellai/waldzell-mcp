import React, { useState } from 'react';
import type { Finding } from '../types';

interface Props {
  findings: Finding[];
  candidateId?: string;
}

export default function RedteamFindings({ findings, candidateId }: Props) {
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const [expandedFindings, setExpandedFindings] = useState<Set<string>>(new Set());

  if (findings.length === 0) {
    return (
      <div style={styles.empty}>
        ✅ No security findings detected. Candidate passed all red team scenarios.
      </div>
    );
  }

  const filteredFindings = findings.filter(f => filter === 'all' || f.severity === filter);

  const stats = {
    total: findings.length,
    critical: findings.filter(f => f.severity === 'critical').length,
    high: findings.filter(f => f.severity === 'high').length,
    medium: findings.filter(f => f.severity === 'medium').length,
    low: findings.filter(f => f.severity === 'low').length,
  };

  const toggleFinding = (id: string) => {
    const newExpanded = new Set(expandedFindings);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedFindings(newExpanded);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>Security Findings</h2>
        {candidateId && (
          <div style={styles.candidateInfo}>
            Candidate: {candidateId.slice(0, 12)}...
          </div>
        )}
      </div>

      {/* Statistics */}
      <div style={styles.stats}>
        <div style={styles.statCard}>
          <span style={styles.statValue}>{stats.total}</span>
          <span style={styles.statLabel}>Total</span>
        </div>
        <div style={{ ...styles.statCard, ...styles.critical }}>
          <span style={styles.statValue}>{stats.critical}</span>
          <span style={styles.statLabel}>Critical</span>
        </div>
        <div style={{ ...styles.statCard, ...styles.high }}>
          <span style={styles.statValue}>{stats.high}</span>
          <span style={styles.statLabel}>High</span>
        </div>
        <div style={{ ...styles.statCard, ...styles.medium }}>
          <span style={styles.statValue}>{stats.medium}</span>
          <span style={styles.statLabel}>Medium</span>
        </div>
        <div style={{ ...styles.statCard, ...styles.low }}>
          <span style={styles.statValue}>{stats.low}</span>
          <span style={styles.statLabel}>Low</span>
        </div>
      </div>

      {/* Filters */}
      <div style={styles.filters}>
        <label>Filter by severity:</label>
        <select value={filter} onChange={(e) => setFilter(e.target.value as any)} style={styles.select}>
          <option value="all">All ({stats.total})</option>
          <option value="critical">Critical ({stats.critical})</option>
          <option value="high">High ({stats.high})</option>
          <option value="medium">Medium ({stats.medium})</option>
          <option value="low">Low ({stats.low})</option>
        </select>
      </div>

      {/* Findings List */}
      <div style={styles.findingsList}>
        {filteredFindings.map((finding) => {
          const isExpanded = expandedFindings.has(finding.id);

          return (
            <div key={finding.id} style={styles.finding}>
              <div
                style={styles.findingHeader}
                onClick={() => toggleFinding(finding.id)}
              >
                <span style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</span>
                {getSeverityBadge(finding.severity)}
                {getCategoryBadge(finding.category)}
                <span style={styles.findingTitle}>{finding.description}</span>
                <span style={styles.likelihood}>
                  Likelihood: {(finding.likelihood * 100).toFixed(0)}%
                </span>
              </div>

              {isExpanded && (
                <div style={styles.findingDetails}>
                  <div style={styles.detailSection}>
                    <h4>Scenario</h4>
                    <p>{finding.scenario}</p>
                  </div>

                  <div style={styles.detailSection}>
                    <h4>Category</h4>
                    <p>{formatCategory(finding.category)}</p>
                  </div>

                  <div style={styles.detailSection}>
                    <h4>Evidence</h4>
                    <ul style={styles.evidenceList}>
                      {finding.evidence.map((ev, idx) => (
                        <li key={idx}>{ev}</li>
                      ))}
                    </ul>
                  </div>

                  <div style={styles.detailSection}>
                    <h4>Risk Assessment</h4>
                    <div style={styles.risk}>
                      <div style={styles.riskItem}>
                        <strong>Severity:</strong> {finding.severity.toUpperCase()}
                      </div>
                      <div style={styles.riskItem}>
                        <strong>Likelihood:</strong> {(finding.likelihood * 100).toFixed(0)}%
                      </div>
                      <div style={styles.riskItem}>
                        <strong>Combined Risk:</strong>{' '}
                        {calculateRiskScore(finding.severity, finding.likelihood)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredFindings.length === 0 && (
        <div style={styles.noResults}>
          No findings match the selected filter.
        </div>
      )}
    </div>
  );
}

function getSeverityBadge(severity: string): React.ReactElement {
  const styles: Record<string, React.CSSProperties> = {
    critical: { backgroundColor: '#dc3545', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', marginRight: '8px' },
    high: { backgroundColor: '#fd7e14', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', marginRight: '8px' },
    medium: { backgroundColor: '#ffc107', color: 'black', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', marginRight: '8px' },
    low: { backgroundColor: '#28a745', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', marginRight: '8px' },
  };
  return <span style={styles[severity] || styles.low}>{severity.toUpperCase()}</span>;
}

function getCategoryBadge(category: string): React.ReactElement {
  const style: React.CSSProperties = {
    backgroundColor: '#6c757d',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    marginRight: '8px',
  };
  return <span style={style}>{formatCategory(category)}</span>;
}

function formatCategory(category: string): string {
  return category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function calculateRiskScore(severity: string, likelihood: number): string {
  const severityScore = { critical: 4, high: 3, medium: 2, low: 1 }[severity] || 1;
  const risk = severityScore * likelihood;
  
  if (risk >= 3) return '🔴 HIGH RISK';
  if (risk >= 2) return '🟡 MEDIUM RISK';
  return '🟢 LOW RISK';
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '16px',
    fontFamily: 'system-ui, sans-serif',
  },
  empty: {
    textAlign: 'center',
    padding: '32px',
    fontSize: '18px',
    color: '#28a745',
    backgroundColor: '#d4edda',
    borderRadius: '8px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  candidateInfo: {
    fontSize: '14px',
    color: '#666',
  },
  stats: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
  },
  statCard: {
    flex: 1,
    padding: '16px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    textAlign: 'center',
  },
  critical: {
    backgroundColor: '#fff5f5',
    borderLeft: '4px solid #dc3545',
  },
  high: {
    backgroundColor: '#fff8f0',
    borderLeft: '4px solid #fd7e14',
  },
  medium: {
    backgroundColor: '#fffbf0',
    borderLeft: '4px solid #ffc107',
  },
  low: {
    backgroundColor: '#f0fff4',
    borderLeft: '4px solid #28a745',
  },
  statValue: {
    display: 'block',
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '4px',
  },
  statLabel: {
    display: 'block',
    fontSize: '12px',
    color: '#666',
  },
  filters: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  select: {
    padding: '6px 12px',
    borderRadius: '4px',
    border: '1px solid #ccc',
  },
  findingsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  finding: {
    border: '1px solid #dee2e6',
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: 'white',
  },
  findingHeader: {
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    userSelect: 'none',
    backgroundColor: '#f8f9fa',
  },
  expandIcon: {
    width: '16px',
    marginRight: '8px',
    color: '#666',
  },
  findingTitle: {
    flex: 1,
    fontWeight: '500',
  },
  likelihood: {
    fontSize: '12px',
    color: '#666',
  },
  findingDetails: {
    padding: '16px',
    borderTop: '1px solid #dee2e6',
  },
  detailSection: {
    marginBottom: '16px',
  },
  evidenceList: {
    marginTop: '8px',
    paddingLeft: '20px',
  },
  risk: {
    display: 'flex',
    gap: '24px',
  },
  riskItem: {
    fontSize: '14px',
  },
  noResults: {
    textAlign: 'center',
    padding: '32px',
    color: '#666',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
  },
};

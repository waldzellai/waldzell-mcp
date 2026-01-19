import React from 'react';
import type { RunMetrics } from '../types';

interface Props {
  metrics: RunMetrics;
  thresholds?: {
    accuracy?: number;
    latencyP95?: number;
    overallScore?: number;
  };
}

export default function MetricsDisplay({ metrics, thresholds = {} }: Props) {
  const defaultThresholds = {
    accuracy: 0.90,
    latencyP95: 500,
    overallScore: 0.85,
    ...thresholds,
  };

  return (
    <div style={styles.container}>
      <h3>Evaluation Metrics</h3>

      {/* Overall Score */}
      {metrics.overall && (
        <section style={styles.section}>
          <h4>Overall</h4>
          <div style={styles.metric}>
            <div style={styles.metricLabel}>
              <span>Overall Score</span>
              {getStatusBadge(
                metrics.overall.score >= defaultThresholds.overallScore,
                metrics.overall.passed
              )}
            </div>
            <ProgressBar
              value={metrics.overall.score}
              threshold={defaultThresholds.overallScore}
            />
            <div style={styles.metricValue}>
              {(metrics.overall.score * 100).toFixed(1)}%
            </div>
          </div>
        </section>
      )}

      {/* Functional Metrics */}
      {metrics.functional && (
        <section style={styles.section}>
          <h4>Functional Tests</h4>
          <div style={styles.metric}>
            <div style={styles.metricLabel}>
              <span>Accuracy</span>
            </div>
            <ProgressBar
              value={metrics.functional.accuracy}
              threshold={defaultThresholds.accuracy}
            />
            <div style={styles.metricValue}>
              {(metrics.functional.accuracy * 100).toFixed(1)}%
            </div>
          </div>

          <div style={styles.metric}>
            <div style={styles.metricLabel}>
              <span>Error Rate</span>
            </div>
            <ProgressBar
              value={1 - metrics.functional.errorRate}
              threshold={0.95}
              inverse
            />
            <div style={styles.metricValue}>
              {(metrics.functional.errorRate * 100).toFixed(1)}%
            </div>
          </div>

          <div style={styles.statsRow}>
            <div style={styles.stat}>
              <span style={styles.statValue}>{metrics.functional.testsPassed}</span>
              <span style={styles.statLabel}>Passed</span>
            </div>
            <div style={styles.stat}>
              <span style={styles.statValue}>{metrics.functional.testsFailed}</span>
              <span style={styles.statLabel}>Failed</span>
            </div>
          </div>
        </section>
      )}

      {/* Chaos Metrics */}
      {metrics.chaos && (
        <section style={styles.section}>
          <h4>Chaos Engineering</h4>
          <div style={styles.metric}>
            <div style={styles.metricLabel}>
              <span>Latency P95</span>
            </div>
            <ProgressBar
              value={Math.min(1, defaultThresholds.latencyP95 / metrics.chaos.latencyP95)}
              threshold={0.8}
              inverse
            />
            <div style={styles.metricValue}>
              {metrics.chaos.latencyP95.toFixed(0)}ms
            </div>
          </div>

          <div style={styles.metric}>
            <div style={styles.metricLabel}>
              <span>Chaos Divergence</span>
            </div>
            <ProgressBar
              value={1 - metrics.chaos.chaosDivergence}
              threshold={0.9}
              inverse
            />
            <div style={styles.metricValue}>
              {(metrics.chaos.chaosDivergence * 100).toFixed(1)}%
            </div>
          </div>

          <div style={styles.metric}>
            <div style={styles.metricLabel}>
              <span>Retry Hygiene Score</span>
            </div>
            <ProgressBar
              value={metrics.chaos.retryHygieneScore}
              threshold={0.85}
            />
            <div style={styles.metricValue}>
              {(metrics.chaos.retryHygieneScore * 100).toFixed(1)}%
            </div>
          </div>
        </section>
      )}

      {/* Idempotency Metrics */}
      {metrics.idempotency && (
        <section style={styles.section}>
          <h4>Idempotency</h4>
          <div style={styles.statsRow}>
            <div style={styles.stat}>
              <span style={{
                ...styles.statValue,
                color: metrics.idempotency.idempotencyViolations === 0 ? '#28a745' : '#dc3545'
              }}>
                {metrics.idempotency.idempotencyViolations}
              </span>
              <span style={styles.statLabel}>Violations</span>
            </div>
            <div style={styles.stat}>
              <span style={styles.statValue}>{metrics.idempotency.correctReplays}</span>
              <span style={styles.statLabel}>Correct Replays</span>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

interface ProgressBarProps {
  value: number;
  threshold: number;
  inverse?: boolean;
}

function ProgressBar({ value, threshold, inverse }: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, value * 100));
  const meetsThreshold = inverse ? value >= threshold : value >= threshold;

  return (
    <div style={styles.progressBar}>
      <div
        style={{
          ...styles.progressFill,
          width: `${percentage}%`,
          backgroundColor: meetsThreshold ? '#28a745' : '#dc3545',
        }}
      />
      <div
        style={{
          ...styles.threshold,
          left: `${threshold * 100}%`,
        }}
      />
    </div>
  );
}

function getStatusBadge(meetsThreshold: boolean, passed: boolean): React.ReactElement {
  const style = passed
    ? { backgroundColor: '#28a745', color: 'white' }
    : { backgroundColor: '#dc3545', color: 'white' };

  return (
    <span style={{ ...styles.badge, ...style }}>
      {passed ? 'PASS' : 'FAIL'}
    </span>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '16px',
    fontFamily: 'system-ui, sans-serif',
  },
  section: {
    marginBottom: '24px',
    padding: '16px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
  },
  metric: {
    marginBottom: '16px',
  },
  metricLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: '500',
  },
  metricValue: {
    textAlign: 'right',
    fontSize: '14px',
    color: '#666',
    marginTop: '4px',
  },
  progressBar: {
    position: 'relative',
    height: '24px',
    backgroundColor: '#e9ecef',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    transition: 'width 0.3s ease',
  },
  threshold: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '2px',
    backgroundColor: '#495057',
  },
  statsRow: {
    display: 'flex',
    gap: '16px',
    marginTop: '12px',
  },
  stat: {
    flex: 1,
    textAlign: 'center',
    padding: '12px',
    backgroundColor: 'white',
    borderRadius: '4px',
  },
  statValue: {
    display: 'block',
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#495057',
  },
  statLabel: {
    display: 'block',
    fontSize: '12px',
    color: '#6c757d',
    marginTop: '4px',
  },
  badge: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 'bold',
  },
};

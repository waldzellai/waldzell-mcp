import React, { useState } from 'react';
import type { Trace, TraceNode } from '../types';

interface Props {
  trace?: Trace;
}

export default function TraceViewer({ trace }: Props) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  if (!trace) {
    return (
      <div style={styles.empty}>
        No trace selected. Select a run to view its execution trace.
      </div>
    );
  }

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>Execution Trace</h2>
        <div style={styles.metadata}>
          <span>Run: {trace.runId}</span>
          <span>Candidate: {trace.candidateId.slice(0, 12)}...</span>
          <span>Duration: {trace.totalDurationMs}ms</span>
          <span>Nodes: {trace.nodes.length}</span>
        </div>
      </div>

      <div style={styles.timeline}>
        {trace.nodes.map((node, idx) => {
          const isExpanded = expandedNodes.has(node.nodeId);
          const hasError = !!node.error;

          return (
            <div
              key={`${node.nodeId}-${idx}`}
              style={{
                ...styles.node,
                ...(hasError ? styles.nodeError : {}),
              }}
            >
              <div style={styles.nodeHeader} onClick={() => toggleNode(node.nodeId)}>
                <span style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</span>
                <span style={styles.nodeId}>{node.nodeId}</span>
                {getKindBadge(node.kind)}
                <span style={styles.duration}>{node.durationMs}ms</span>
                <span style={styles.timestamp}>
                  {new Date(node.timestamp).toLocaleTimeString()}
                </span>
                {hasError && <span style={styles.errorBadge}>ERROR</span>}
              </div>

              {isExpanded && (
                <div style={styles.nodeDetails}>
                  <div style={styles.detailSection}>
                    <h4>Input</h4>
                    <pre style={styles.pre}>
                      {JSON.stringify(node.input, null, 2)}
                    </pre>
                  </div>

                  {node.error ? (
                    <div style={styles.detailSection}>
                      <h4>Error</h4>
                      <pre style={{...styles.pre, ...styles.errorPre}}>
                        {node.error}
                      </pre>
                    </div>
                  ) : (
                    <div style={styles.detailSection}>
                      <h4>Output</h4>
                      <pre style={styles.pre}>
                        {JSON.stringify(node.output, null, 2)}
                      </pre>
                    </div>
                  )}

                  <div style={styles.detailSection}>
                    <h4>Timing</h4>
                    <div style={styles.timing}>
                      <span>Started: {new Date(node.timestamp).toISOString()}</span>
                      <span>Duration: {node.durationMs}ms</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={styles.summary}>
        <h3>Trace Summary</h3>
        <div style={styles.summaryGrid}>
          <div>
            <strong>Total Nodes:</strong> {trace.nodes.length}
          </div>
          <div>
            <strong>Total Duration:</strong> {trace.totalDurationMs}ms
          </div>
          <div>
            <strong>Errors:</strong> {trace.nodes.filter(n => n.error).length}
          </div>
          <div>
            <strong>Average Node Time:</strong>{' '}
            {(trace.totalDurationMs / trace.nodes.length).toFixed(1)}ms
          </div>
        </div>
      </div>
    </div>
  );
}

function getKindBadge(kind: string): React.ReactElement {
  const styles: Record<string, React.CSSProperties> = {
    tool: { backgroundColor: '#17a2b8', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', marginLeft: '8px' },
    llm: { backgroundColor: '#6f42c1', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', marginLeft: '8px' },
    router: { backgroundColor: '#fd7e14', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', marginLeft: '8px' },
    critic: { backgroundColor: '#28a745', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', marginLeft: '8px' },
  };
  return <span style={styles[kind] || styles.tool}>{kind.toUpperCase()}</span>;
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
    marginBottom: '24px',
  },
  metadata: {
    display: 'flex',
    gap: '16px',
    fontSize: '14px',
    color: '#666',
    marginTop: '8px',
  },
  timeline: {
    border: '1px solid #dee2e6',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  node: {
    borderBottom: '1px solid #dee2e6',
    backgroundColor: 'white',
  },
  nodeError: {
    backgroundColor: '#fff5f5',
    borderLeft: '4px solid #dc3545',
  },
  nodeHeader: {
    padding: '12px 16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    userSelect: 'none',
  },
  expandIcon: {
    width: '16px',
    color: '#666',
  },
  nodeId: {
    fontWeight: 'bold',
    flex: 1,
  },
  duration: {
    fontSize: '12px',
    color: '#666',
  },
  timestamp: {
    fontSize: '12px',
    color: '#999',
  },
  errorBadge: {
    backgroundColor: '#dc3545',
    color: 'white',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 'bold',
  },
  nodeDetails: {
    padding: '16px',
    backgroundColor: '#f8f9fa',
    borderTop: '1px solid #dee2e6',
  },
  detailSection: {
    marginBottom: '16px',
  },
  pre: {
    backgroundColor: 'white',
    padding: '12px',
    borderRadius: '4px',
    fontSize: '12px',
    overflow: 'auto',
    maxHeight: '300px',
    border: '1px solid #dee2e6',
  },
  errorPre: {
    backgroundColor: '#fff5f5',
    borderColor: '#dc3545',
    color: '#dc3545',
  },
  timing: {
    display: 'flex',
    gap: '16px',
    fontSize: '13px',
  },
  summary: {
    marginTop: '24px',
    padding: '16px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginTop: '12px',
  },
};
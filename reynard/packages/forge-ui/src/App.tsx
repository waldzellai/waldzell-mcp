import React, { useState } from 'react';
import RunsList from './components/RunsList';
import CandidateCompare from './components/CandidateCompare';
import TraceViewer from './components/TraceViewer';
import MetricsDisplay from './components/MetricsDisplay';
import RedteamFindings from './components/RedteamFindings';
import type { Candidate, Trace, RunMetrics, Finding } from './types';

type View = 'runs' | 'compare' | 'trace' | 'metrics' | 'redteam';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('runs');
  const [selectedCandidates, setSelectedCandidates] = useState<[Candidate?, Candidate?]>([undefined, undefined]);
  const [selectedTrace, setSelectedTrace] = useState<Trace | undefined>();
  const [selectedMetrics, setSelectedMetrics] = useState<RunMetrics | undefined>();
  const [selectedFindings, setSelectedFindings] = useState<Finding[]>([]);

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <h1 style={styles.title}>Reynard Forge UI</h1>
        <p style={styles.subtitle}>Operator Interface for ADAS Evaluation</p>
      </header>

      <nav style={styles.nav}>
        <button
          style={currentView === 'runs' ? { ...styles.navButton, ...styles.navButtonActive } : styles.navButton}
          onClick={() => setCurrentView('runs')}
        >
          📋 Runs List
        </button>
        <button
          style={currentView === 'compare' ? { ...styles.navButton, ...styles.navButtonActive } : styles.navButton}
          onClick={() => setCurrentView('compare')}
        >
          ⚖️ Compare
        </button>
        <button
          style={currentView === 'trace' ? { ...styles.navButton, ...styles.navButtonActive } : styles.navButton}
          onClick={() => setCurrentView('trace')}
        >
          🔍 Trace
        </button>
        <button
          style={currentView === 'metrics' ? { ...styles.navButton, ...styles.navButtonActive } : styles.navButton}
          onClick={() => setCurrentView('metrics')}
        >
          📊 Metrics
        </button>
        <button
          style={currentView === 'redteam' ? { ...styles.navButton, ...styles.navButtonActive } : styles.navButton}
          onClick={() => setCurrentView('redteam')}
        >
          🔒 Security
        </button>
      </nav>

      <main style={styles.main}>
        {currentView === 'runs' && <RunsList />}
        {currentView === 'compare' && (
          <CandidateCompare
            candidate1={selectedCandidates[0]}
            candidate2={selectedCandidates[1]}
          />
        )}
        {currentView === 'trace' && <TraceViewer trace={selectedTrace} />}
        {currentView === 'metrics' && selectedMetrics && (
          <MetricsDisplay metrics={selectedMetrics} />
        )}
        {currentView === 'redteam' && (
          <RedteamFindings findings={selectedFindings} />
        )}
      </main>

      <footer style={styles.footer}>
        <p>Reynard Forge v0.0.1 | ADAS System for Agent Development</p>
      </footer>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  app: {
    minHeight: '100vh',
    backgroundColor: '#f5f7fa',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  header: {
    backgroundColor: 'white',
    borderBottom: '2px solid #e1e8ed',
    padding: '24px 32px',
  },
  title: {
    margin: 0,
    fontSize: '28px',
    color: '#1a202c',
  },
  subtitle: {
    margin: '4px 0 0 0',
    fontSize: '14px',
    color: '#718096',
  },
  nav: {
    backgroundColor: 'white',
    borderBottom: '1px solid #e1e8ed',
    padding: '0 32px',
    display: 'flex',
    gap: '8px',
  },
  navButton: {
    padding: '12px 20px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    color: '#4a5568',
    borderBottom: '3px solid transparent',
    transition: 'all 0.2s',
  },
  navButtonActive: {
    color: '#2d3748',
    borderBottomColor: '#3182ce',
  },
  main: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '24px 32px',
  },
  footer: {
    backgroundColor: 'white',
    borderTop: '1px solid #e1e8ed',
    padding: '16px 32px',
    textAlign: 'center',
    color: '#718096',
    fontSize: '12px',
    marginTop: '48px',
  },
};
import React from 'react';

function App() {
  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#05060A',
        color: '#fff',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      <header style={{ padding: '8px 16px', borderBottom: '1px solid #1E1E1E' }}>
        <span style={{ fontSize: 14 }}>Kubernetes YAML Lint</span>
      </header>
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* editor + errors will go here */}
      </main>
    </div>
  );
}

export default App;

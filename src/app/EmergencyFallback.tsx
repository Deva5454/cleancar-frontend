/**
 * Emergency fallback component
 * No dependencies, no hooks, just pure JSX
 */

export function EmergencyFallback() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#fee',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: '600px',
          padding: '2rem',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}
      >
        <h1 style={{ color: '#c00', marginBottom: '1rem' }}>
          ⚠️ Application Failed to Load
        </h1>
        <p style={{ color: '#666', marginBottom: '1rem' }}>
          The application encountered a critical error during initialization.
        </p>
        <details style={{ marginTop: '1rem' }}>
          <summary style={{ cursor: 'pointer', color: '#666' }}>
            Technical Details
          </summary>
          <pre
            style={{
              marginTop: '0.5rem',
              padding: '0.5rem',
              backgroundColor: '#f5f5f5',
              fontSize: '0.75rem',
              overflow: 'auto',
            }}
          >
            {`Timestamp: ${new Date().toISOString()}
URL: ${typeof window !== 'undefined' ? window.location.href : 'N/A'}
User Agent: ${typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'}`}
          </pre>
        </details>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: '1rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#c00',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Reload Page
        </button>
      </div>
    </div>
  );
}

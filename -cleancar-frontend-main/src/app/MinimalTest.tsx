/**
 * Absolute minimal test component
 */
export default function MinimalTest() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f0f0f0',
      fontFamily: 'sans-serif'
    }}>
      <div style={{
        padding: '2rem',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        textAlign: 'center'
      }}>
        <h1 style={{ color: '#333', marginBottom: '1rem' }}>✓ React is Working</h1>
        <p style={{ color: '#666' }}>Minimal test component rendered successfully</p>
        <p style={{ color: '#999', fontSize: '0.875rem', marginTop: '1rem' }}>
          {new Date().toLocaleString()}
        </p>
      </div>
    </div>
  );
}

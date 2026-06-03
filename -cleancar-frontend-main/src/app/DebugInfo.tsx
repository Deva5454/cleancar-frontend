/**
 * Debug component to display app initialization status
 */

export function DebugInfo() {
  const info = {
    timestamp: new Date().toISOString(),
    location: {
      href: typeof window !== 'undefined' ? window.location.href : 'N/A',
      pathname: typeof window !== 'undefined' ? window.location.pathname : 'N/A',
      search: typeof window !== 'undefined' ? window.location.search : 'N/A',
      hash: typeof window !== 'undefined' ? window.location.hash : 'N/A',
    },
    environment: {
      mode: import.meta.env.MODE,
      dev: import.meta.env.DEV,
      prod: import.meta.env.PROD,
    },
  };

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg shadow-lg max-w-md text-xs font-mono opacity-90 z-50">
      <div className="font-bold mb-2">Debug Info</div>
      <pre className="whitespace-pre-wrap overflow-auto max-h-96">
        {JSON.stringify(info, null, 2)}
      </pre>
    </div>
  );
}

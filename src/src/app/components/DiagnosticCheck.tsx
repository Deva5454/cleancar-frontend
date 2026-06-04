export function DiagnosticCheck() {
  return (
    <div className="p-8 bg-green-100 border-4 border-green-600">
      <h1 className="text-2xl font-bold text-green-900">✓ React App is Running!</h1>
      <p className="text-green-800 mt-2">If you see this, the preview is loading correctly.</p>
      <p className="text-sm text-green-700 mt-4">
        Timestamp: {new Date().toLocaleString()}
      </p>
    </div>
  );
}

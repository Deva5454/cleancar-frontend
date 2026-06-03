// Minimal test to verify rendering works
export default function TestApp() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Test App</h1>
        <p className="text-gray-600">If you see this, React is rendering correctly.</p>
      </div>
    </div>
  );
}

import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { Toaster } from "sonner";
import { Component, ErrorInfo, ReactNode } from "react";
class ErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean; error: Error | null}> {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error("App error:", error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:"24px",fontFamily:"sans-serif"}}>
          <div style={{maxWidth:"500px",textAlign:"center"}}>
            <h2 style={{color:"#DC2626",marginBottom:"16px"}}>Something went wrong</h2>
            <p style={{color:"#6B7280",marginBottom:"24px"}}>Please refresh the page to try again.</p>
            <button onClick={() => window.location.reload()} style={{background:"#1B3A5C",color:"#fff",padding:"10px 24px",borderRadius:"6px",border:"none",cursor:"pointer",fontSize:"14px"}}>
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppContent() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors />
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

import { Component, type ReactNode, type ErrorInfo } from "react";

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"60vh",gap:16,padding:24,textAlign:"center"}}>
          <span style={{fontSize:64}}>🌾</span>
          <h1 style={{fontSize:22,fontWeight:700,color:"#111"}}>একটি সমস্যা হয়েছে</h1>
          <p style={{fontSize:13,color:"#6b7280",maxWidth:320}}>অপ্রত্যাশিত ত্রুটি। পৃষ্ঠা রিফ্রেশ করুন বা DAE হটলাইন 16123 এ কল করুন।</p>
          <button onClick={() => window.location.reload()} style={{padding:"12px 28px",background:"#1b8a3e",border:"none",borderRadius:10,color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer"}}>
            আবার চেষ্টা করুন
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

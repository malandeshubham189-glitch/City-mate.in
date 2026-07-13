import { Component, ErrorInfo, ReactNode } from "react";
import { ShieldAlert, RefreshCw, AlertCircle, Copy, Check } from "lucide-react";

interface Props {
  children: ReactNode;
  darkMode?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

export default class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    copied: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { 
      hasError: true, 
      error, 
      errorInfo: null,
      copied: false 
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("GlobalErrorBoundary captured a runtime exception:", error, errorInfo);
    (this as any).setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleCopyDetails = () => {
    const self = this as any;
    if (!self.state.error) return;
    const diagnostics = `Error: ${self.state.error.message}\nStack: ${self.state.error.stack || ""}\nComponent Stack: ${self.state.errorInfo?.componentStack || ""}`;
    navigator.clipboard.writeText(diagnostics);
    self.setState({ copied: true });
    setTimeout(() => self.setState({ copied: false }), 3000);
  };

  public render() {
    const self = this as any;
    if (self.state.hasError) {
      const isDark = self.props.darkMode !== false; // default to dark mode style matching the premium layout
      return (
        <div className={`min-h-screen w-full flex items-center justify-center p-6 ${
          isDark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
        }`}>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />

          <div className={`relative max-w-lg w-full rounded-3xl border p-8 space-y-6 shadow-2xl z-10 transition-all ${
            isDark 
              ? "bg-slate-900/90 border-slate-800 shadow-indigo-500/5" 
              : "bg-white border-slate-200 shadow-slate-200/50"
          }`}>
            <div className="flex items-center gap-4 border-b border-dashed pb-5 border-slate-800">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <ShieldAlert className="h-6 w-6 animate-pulse" />
              </div>
              <div>
                <h2 className="text-sm font-black uppercase tracking-wider text-rose-400">System Intercept Active</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Runtime exception handled gracefully</p>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-extrabold">Relocation Session Desynchronized</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                An unexpected exception was detected during client state evaluation. The application shell was isolated to prevent further memory leakage.
              </p>
            </div>

            {/* Diagnostics Console Box */}
            <div className={`rounded-xl border p-4 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-40 space-y-1 ${
              isDark ? "bg-slate-950 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-150 text-slate-600"
            }`}>
              <div className="flex items-center justify-between border-b border-slate-800/50 pb-1.5 mb-1.5">
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 text-rose-400" />
                  <span>Exception Log</span>
                </span>
                <button
                  onClick={this.handleCopyDetails}
                  className="p-1 rounded bg-slate-850 hover:bg-slate-800 border border-slate-800 text-[9px] font-bold text-indigo-400 flex items-center gap-1 cursor-pointer"
                >
                  {self.state.copied ? (
                    <>
                      <Check className="h-3 w-3" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy Log</span>
                    </>
                  )}
                </button>
              </div>
              <p className="font-bold text-rose-400">{self.state.error?.name}: {self.state.error?.message}</p>
              {self.state.errorInfo?.componentStack && (
                <p className="text-[10px] opacity-70 mt-1 whitespace-pre">
                  {self.state.errorInfo.componentStack.trim().split("\n").slice(0, 3).join("\n")}
                </p>
              )}
            </div>

            {/* Atomic Interaction Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReload}
                className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/10"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Reload Relocation Session</span>
              </button>
              <button
                onClick={() => { window.location.href = "/"; }}
                className="py-3 px-5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-2xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
              >
                Reset to Main
              </button>
            </div>
          </div>
        </div>
      );
    }

    return self.props.children;
  }
}

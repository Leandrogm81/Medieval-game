import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
          <div className="bg-slate-900 border-2 border-red-900/50 rounded-2xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center text-red-500 mx-auto border-2 border-red-500/50">
              <AlertTriangle size={40} />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-white uppercase tracking-tighter">Erro no Reino</h1>
              <p className="text-slate-400 text-sm font-serif italic">
                Um evento catastrófico ocorreu e o jogo não pôde continuar. Nossos escribas foram notificados.
              </p>
            </div>
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-left overflow-auto max-h-32">
              <code className="text-xs text-red-400 font-mono">
                {this.state.error?.message || 'Erro desconhecido'}
              </code>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-red-700 hover:bg-red-600 text-white font-black rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest text-sm"
            >
              <RefreshCw size={18} /> Reiniciar Jogo
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

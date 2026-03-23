import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-stone-950 flex items-center justify-center p-8 text-center">
          <div className="max-w-md space-y-4">
             <h2 className="text-3xl font-serif font-black text-amber-500 uppercase">Colapso Total</h2>
             <p className="text-stone-400 font-serif italic text-sm">Um erro catastrófico ocorreu no reino. Por favor, reinicie e reze para que nada se perca.</p>
             <button onClick={() => window.location.reload()} className="px-8 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-black uppercase rounded-sm mt-4">Reiniciar</button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

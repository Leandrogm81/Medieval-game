import React, { ErrorInfo, ReactNode } from 'react';

export class ErrorBoundary extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Game Crash caught by ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-[#1a0f0a] text-[#f5f2ed] p-10 text-center font-serif">
          <h2 className="text-3xl text-red-500 mb-4 font-bold medieval-title">O Reino Entrou em Colapso!</h2>
          <p className="mb-6 opacity-80">Um erro inesperado ocorreu. Os escribas estão investigando.</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-[#d4af37] text-black px-6 py-2 rounded-lg font-bold hover:bg-[#b8860b] transition-all"
          >
            Recomeçar Jornada
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

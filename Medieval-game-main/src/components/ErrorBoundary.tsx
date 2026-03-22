import React, { ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false
  };

  public static getDerivedStateFromError(_error: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("Game Crash caught by ErrorBoundary:", error, errorInfo);
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-[#1a0f0a] text-[#f5f2ed] p-10 text-center font-serif">
          <h2 className="text-3xl text-red-500 mb-4 font-bold medieval-title text-shadow">O Reino Entrou em Colapso!</h2>
          <p className="mb-6 opacity-80 max-w-md mx-auto">Um erro inesperado ocorreu nos alicerces do reino. Os escribas reais foram notificados.</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-[#d4af37] text-black px-8 py-3 rounded-xl font-bold hover:bg-[#b8860b] transition-all transform active:scale-95 shadow-lg shadow-[#d4af37]/20"
          >
            Restaurar a Ordem
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

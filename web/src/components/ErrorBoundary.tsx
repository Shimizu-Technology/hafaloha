import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-warm-50 border border-warm-200 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-warm-900 mb-4">
              Configuration Error
            </h2>
            <p className="text-warm-600 mb-4">
              The application encountered a configuration issue. This is likely due to missing or invalid API keys.
            </p>
            <p className="text-sm text-warm-500 font-mono bg-white p-3 rounded border border-warm-200">
              {this.state.error?.message || 'Unknown error'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 w-full bg-hafalohaRed text-white py-2 px-4 rounded hover:bg-red-700 transition"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

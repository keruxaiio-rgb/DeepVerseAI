'use client';

import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    console.error('Error caught by boundary:', error, errorInfo);

    // In production, you would send this to an error tracking service
    // Example: Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

const DefaultErrorFallback: React.FC<{ error?: Error; resetError: () => void }> = ({
  error,
  resetError
}) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    background: '#F7F7FA',
    color: '#333'
  }}>
    <div style={{
      background: 'white',
      padding: '40px',
      borderRadius: '12px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
      textAlign: 'center',
      maxWidth: '500px'
    }}>
      <h2 style={{ color: '#DC3545', marginBottom: '16px' }}>Something went wrong</h2>
      <p style={{ marginBottom: '24px', color: '#666' }}>
        We encountered an unexpected error. Please try refreshing the page.
      </p>
      {process.env.NODE_ENV === 'development' && error && (
        <details style={{ marginBottom: '24px', textAlign: 'left' }}>
          <summary style={{ cursor: 'pointer', color: '#007AFF' }}>Error Details (Development)</summary>
          <pre style={{
            background: '#F8F9FA',
            padding: '12px',
            borderRadius: '4px',
            fontSize: '12px',
            marginTop: '8px',
            overflow: 'auto',
            color: '#DC3545'
          }}>
            {error.message}
          </pre>
        </details>
      )}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <button
          onClick={resetError}
          style={{
            padding: '10px 20px',
            background: '#007AFF',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Try Again
        </button>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 20px',
            background: '#6C757D',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Refresh Page
        </button>
      </div>
    </div>
  </div>
);

export default ErrorBoundary;

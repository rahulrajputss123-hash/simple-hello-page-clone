import { Component, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  private errorInfo: React.ErrorInfo | null = null;

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.errorInfo = errorInfo;
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    console.error("Current URL:", typeof window !== 'undefined' ? window.location.href : 'N/A');
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
    this.errorInfo = null;
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }

      const currentUrl = typeof window !== 'undefined' ? window.location.href : 'N/A';
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : 'N/A';

      return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
          <div className="w-full max-w-2xl space-y-4">
            <div className="text-center">
              <div className="mx-auto grid size-16 place-items-center rounded-full bg-destructive/10">
                <AlertTriangle className="size-8 text-destructive" />
              </div>
              <h1 className="mt-4 text-2xl font-bold">This page didn't load</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                We encountered an error while loading this page. Try refreshing or return to the home page.
              </p>
            </div>

            {/* Technical Details - Always show in production for debugging */}
            <details className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
              <summary className="cursor-pointer text-sm font-semibold text-destructive">
                Technical details (click to expand)
              </summary>
              <div className="mt-3 space-y-3 text-left">
                {/* Error Message */}
                <div>
                  <p className="text-xs font-semibold text-destructive/80">Error Message:</p>
                  <p className="mt-1 font-mono text-xs text-destructive">{this.state.error.message}</p>
                </div>

                {/* Current URL */}
                <div>
                  <p className="text-xs font-semibold text-destructive/80">Current URL:</p>
                  <p className="mt-1 break-all font-mono text-xs text-destructive">{currentUrl}</p>
                </div>

                {/* Route Path */}
                <div>
                  <p className="text-xs font-semibold text-destructive/80">Route Path:</p>
                  <p className="mt-1 font-mono text-xs text-destructive">{currentPath}</p>
                </div>

                {/* Error Stack */}
                {this.state.error.stack && (
                  <div>
                    <p className="text-xs font-semibold text-destructive/80">Stack Trace:</p>
                    <pre className="mt-1 max-h-60 overflow-auto rounded border border-destructive/20 bg-black/5 p-2 font-mono text-[10px] leading-tight text-destructive/90">
                      {this.state.error.stack}
                    </pre>
                  </div>
                )}

                {/* Component Stack */}
                {this.errorInfo?.componentStack && (
                  <div>
                    <p className="text-xs font-semibold text-destructive/80">Component Stack:</p>
                    <pre className="mt-1 max-h-40 overflow-auto rounded border border-destructive/20 bg-black/5 p-2 font-mono text-[10px] leading-tight text-destructive/90">
                      {this.errorInfo.componentStack}
                    </pre>
                  </div>
                )}

                {/* Error Name/Type */}
                <div>
                  <p className="text-xs font-semibold text-destructive/80">Error Type:</p>
                  <p className="mt-1 font-mono text-xs text-destructive">
                    {this.state.error.name || 'Error'}
                  </p>
                </div>

                {/* Timestamp */}
                <div>
                  <p className="text-xs font-semibold text-destructive/80">Timestamp:</p>
                  <p className="mt-1 font-mono text-xs text-destructive">
                    {new Date().toISOString()}
                  </p>
                </div>
              </div>
            </details>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-4 sm:flex-row sm:justify-center">
              <Button onClick={() => window.location.reload()} className="gap-2">
                <RefreshCw className="size-4" />
                Refresh page
              </Button>
              <Button asChild variant="outline" className="gap-2">
                <Link to="/">
                  <Home className="size-4" />
                  Go home
                </Link>
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

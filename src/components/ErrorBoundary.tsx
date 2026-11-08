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

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }

      return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
          <div className="w-full max-w-md space-y-4 text-center">
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-destructive/10">
              <AlertTriangle className="size-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold">Something went wrong</h1>
            <p className="text-sm text-muted-foreground">
              We encountered an error while loading this page. Try refreshing or return to the home
              page.
            </p>
            {process.env.NODE_ENV === "development" && (
              <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-left">
                <p className="text-xs font-mono text-destructive">{this.state.error.message}</p>
                {this.state.error.stack && (
                  <pre className="mt-2 max-h-40 overflow-auto text-[10px] text-destructive/70">
                    {this.state.error.stack}
                  </pre>
                )}
              </div>
            )}
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

import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary to prevent component crashes from propagating
 * Wraps components that might fail (e.g., due to image loading errors)
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    console.error("⚠️ [ERROR BOUNDARY] Component error caught:", error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("⚠️ [ERROR BOUNDARY] Error details:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="text-destructive mb-2">
            <i className="fas fa-exclamation-triangle text-3xl" />
          </div>
          <p className="text-sm text-muted-foreground">
            일시적인 오류가 발생했습니다
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

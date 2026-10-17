import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
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
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 rounded-2xl bg-red-950/30 border border-red-500/30 text-white my-3 space-y-2">
          <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{this.props.fallbackTitle || 'এই অংশটি লোড করতে সমস্যা হয়েছে'}</span>
          </div>
          <p className="text-xs text-neutral-300 font-bengali">
            {this.props.fallbackMessage || 'সাময়িক ত্রুটি ঘটেছে। পুনরায় চেষ্টা করুন বা রিফ্রেশ করুন।'}
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>আবার চেষ্টা করুন</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

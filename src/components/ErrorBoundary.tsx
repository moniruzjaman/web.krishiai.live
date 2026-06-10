/**
 * ErrorBoundary — React error boundary for tool pages
 *
 * Catches runtime errors in child components and displays
 * a Bengali-friendly error card instead of crashing.
 */

"use client";

import { Component, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary] Caught error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[300px] flex items-center justify-center p-6">
          <div className="bg-white border-2 border-red-200 rounded-2xl p-6 max-w-md w-full text-center shadow-sm">
            <div className="text-4xl mb-3">⚠️</div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              কিছু একটা সমস্যা হয়েছে
            </h2>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              এই পৃষ্ঠাটি লোড করতে সমস্যা হচ্ছে। অনুগ্রহ করে আবার চেষ্টা করুন অথবা কিছুক্ষণ পর ফিরে আসুন।
            </p>
            {this.state.error && (
              <details className="text-left mb-4">
                <summary className="text-xs text-gray-400 cursor-pointer">ত্রুটির বিবরণ</summary>
                <pre className="mt-2 text-[10px] text-red-600 bg-red-50 p-2 rounded-lg overflow-auto max-h-32">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <button
              onClick={this.handleRetry}
              className="bg-green-600 hover:bg-green-700 text-white font-bold text-sm rounded-full px-6 py-2.5 transition-colors cursor-pointer border-none"
            >
              আবার চেষ্টা করুন
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

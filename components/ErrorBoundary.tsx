import React, { ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

const ErrorBoundary: React.FC<Props> = ({ children, fallback }) => {
  try {
    return <>{children}</>;
  } catch (error) {
    console.error("Error caught by boundary:", error);

    return (
      fallback || (
        <div className="flex items-center justify-center h-full bg-red-50">
          <div className="text-center p-4">
            <h2 className="text-lg font-semibold text-red-800 mb-2">
              Something went wrong
            </h2>
            <p className="text-red-600 mb-4">
              Please refresh the page to try again.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )
    );
  }
};

export default ErrorBoundary;

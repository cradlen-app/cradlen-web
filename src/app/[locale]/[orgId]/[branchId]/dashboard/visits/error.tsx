"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Dashboard error]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-8">
      <h2 className="text-lg font-semibold text-brand-black">Something went wrong</h2>
      <p className="text-sm text-gray-500 text-center max-w-sm">
        {error.message || "An unexpected error occurred. Please try again."}
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 text-sm font-medium text-white rounded-lg bg-brand-primary hover:opacity-90 transition-opacity"
      >
        Try again
      </button>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center p-6">
      <div className="max-w-md rounded-3xl border border-red-100 bg-red-50/50 p-6 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600">
          <AlertTriangle size={24} />
        </div>
        <h2 className="mt-4 font-medium text-neutral-900 text-lg">Something went wrong</h2>
        <p className="mt-1 text-xs text-neutral-600">
          {error.message || "An unexpected error occurred while processing your request."}
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-5 rounded-xl bg-[#0b0f1a] px-4 py-2.5 text-xs font-medium text-white transition hover:bg-neutral-800"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

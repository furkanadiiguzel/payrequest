'use client';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Something went wrong</h1>
            <button
              onClick={reset}
              className="text-indigo-600 hover:text-indigo-500 font-medium"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

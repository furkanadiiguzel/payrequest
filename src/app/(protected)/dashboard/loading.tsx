export default function DashboardLoading() {
  return (
    <div style={{ animation: 'fade-in 0.2s ease-out both' }}>
      {/* Stats bar skeleton */}
      <div className="grid grid-cols-2 gap-4 mb-8 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="relative bg-card rounded-xl border border-border p-4 overflow-hidden animate-pulse">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-muted" />
            <div className="h-7 w-10 bg-muted rounded mb-1.5" />
            <div className="h-3 w-24 bg-muted/60 rounded" />
          </div>
        ))}
      </div>

      {/* Tab bar skeleton */}
      <div className="h-9 w-40 bg-muted rounded-lg animate-pulse mb-6" />

      {/* Card skeletons */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="relative bg-card rounded-xl border border-border overflow-hidden animate-pulse"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-muted" />
            <div className="px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1 ml-2 space-y-2">
                  <div className="h-4 w-40 bg-muted rounded" />
                  <div className="h-3 w-56 bg-muted/60 rounded" />
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="h-4 w-16 bg-muted rounded" />
                  <div className="h-5 w-16 bg-muted/60 rounded-full" />
                </div>
              </div>
              <div className="h-3 w-20 bg-muted/60 rounded mt-2.5 ml-2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

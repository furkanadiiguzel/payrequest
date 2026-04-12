export default function DashboardLoading() {
  return (
    <div>
      <div className="h-8 w-40 bg-gray-200 rounded animate-pulse mb-6" />
      <div className="h-10 w-64 bg-gray-200 rounded animate-pulse mb-6" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border bg-white p-4 animate-pulse">
            <div className="flex justify-between">
              <div className="space-y-2">
                <div className="h-4 w-36 bg-gray-200 rounded" />
                <div className="h-3 w-48 bg-gray-100 rounded" />
              </div>
              <div className="space-y-2 items-end flex flex-col">
                <div className="h-4 w-16 bg-gray-200 rounded" />
                <div className="h-5 w-16 bg-gray-100 rounded-full" />
              </div>
            </div>
            <div className="h-3 w-20 bg-gray-100 rounded mt-2" />
          </div>
        ))}
      </div>
    </div>
  );
}

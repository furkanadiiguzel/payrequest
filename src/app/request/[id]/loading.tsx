export default function RequestDetailLoading() {
  return (
    <div className="max-w-lg mx-auto space-y-4 animate-pulse">
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="text-center space-y-2">
          <div className="h-10 w-32 bg-gray-200 rounded mx-auto" />
          <div className="h-6 w-20 bg-gray-100 rounded-full mx-auto" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between">
              <div className="h-4 w-16 bg-gray-100 rounded" />
              <div className="h-4 w-32 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function TimKiemLoading() {
  return (
    <div className="bg-gray-50 min-h-screen animate-pulse">
      <div className="bg-white border-b">
        <div className="container max-w-6xl mx-auto px-4 py-2.5">
          <div className="h-4 w-48 bg-gray-200 rounded" />
        </div>
      </div>
      <div className="container max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          <div className="flex-1 min-w-0 space-y-4">
            <div className="h-6 w-64 bg-gray-200 rounded" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white rounded border p-4 flex gap-4">
                <div className="w-[140px] h-[100px] bg-gray-200 rounded shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-20 bg-blue-200 rounded" />
                  <div className="h-5 bg-gray-200 rounded w-full" />
                  <div className="h-5 bg-gray-200 rounded w-4/5" />
                  <div className="h-3 w-32 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
          <aside className="w-72 shrink-0 space-y-4">
            <div className="bg-white rounded border p-4">
              <div className="h-4 w-24 bg-gray-200 rounded mb-3" />
              <div className="h-9 bg-gray-200 rounded" />
            </div>
            <div className="bg-white rounded border p-4 space-y-3">
              <div className="h-4 w-32 bg-gray-200 rounded" />
              <div className="h-8 bg-gray-200 rounded" />
              <div className="h-8 bg-gray-200 rounded" />
              <div className="h-8 bg-gray-200 rounded" />
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

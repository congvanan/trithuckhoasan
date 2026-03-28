export default function BlogListLoading() {
  return (
    <div className="bg-gray-50 min-h-screen animate-pulse">
      <div className="bg-white border-b">
        <div className="container max-w-6xl mx-auto px-4 py-2.5">
          <div className="h-4 w-48 bg-gray-200 rounded" />
        </div>
      </div>
      <div className="container max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          <div className="flex-1 min-w-0">
            <div className="h-7 w-56 bg-blue-200 rounded mb-2" />
            <div className="h-4 w-32 bg-gray-200 rounded mb-4" />
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded border p-4 flex gap-4">
                  <div className="w-[160px] h-[110px] bg-gray-200 rounded shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-gray-200 rounded w-full" />
                    <div className="h-5 bg-gray-200 rounded w-4/5" />
                    <div className="h-3 w-40 bg-gray-200 rounded" />
                    <div className="h-4 bg-gray-200 rounded w-full" />
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                    <div className="h-4 w-20 bg-blue-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <aside className="w-72 shrink-0 hidden lg:block space-y-5">
            <div className="bg-white rounded border p-4">
              <div className="h-4 w-20 bg-gray-200 rounded mb-3" />
              <div className="h-9 bg-gray-200 rounded" />
            </div>
            <div className="bg-white rounded border p-4 space-y-3">
              <div className="h-4 w-32 bg-gray-200 rounded mb-1" />
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-2">
                  <div className="w-16 h-12 bg-gray-200 rounded shrink-0" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 bg-gray-200 rounded w-full" />
                    <div className="h-3 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 w-20 bg-gray-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

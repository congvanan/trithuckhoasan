export default function BlogPostLoading() {
  return (
    <div className="container max-w-6xl mx-auto px-4 py-6 animate-pulse">
      {/* Breadcrumb skeleton */}
      <div className="flex items-center gap-2 mb-6">
        <div className="h-4 w-20 bg-gray-200 rounded" />
        <div className="h-4 w-4 bg-gray-200 rounded" />
        <div className="h-4 w-28 bg-gray-200 rounded" />
        <div className="h-4 w-4 bg-gray-200 rounded" />
        <div className="h-4 w-48 bg-gray-200 rounded" />
      </div>

      <div className="flex gap-8 items-start">
        <article className="flex-1 min-w-0">
          {/* Cover image skeleton */}
          <div className="mb-6 rounded-xl overflow-hidden h-72 bg-gray-200" />

          {/* Title skeleton */}
          <div className="space-y-3 mb-4">
            <div className="h-8 bg-gray-200 rounded w-full" />
            <div className="h-8 bg-gray-200 rounded w-4/5" />
          </div>

          {/* Meta skeleton */}
          <div className="flex items-center gap-3 mb-4 pb-4 border-b">
            <div className="h-4 w-32 bg-gray-200 rounded" />
            <div className="h-4 w-24 bg-gray-200 rounded" />
          </div>

          {/* Description skeleton */}
          <div className="h-16 bg-blue-50 rounded-r border-l-4 border-blue-200 mb-6" />

          {/* Content skeleton */}
          <div className="space-y-3">
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} className={`h-4 bg-gray-200 rounded ${i % 3 === 0 ? 'w-3/4' : 'w-full'}`} />
            ))}
            <div className="h-4 w-full bg-gray-200 rounded" />
            <div className="h-4 w-5/6 bg-gray-200 rounded" />
            <div className="h-48 bg-gray-100 rounded my-4" />
            {[1,2,3,4,5].map(i => (
              <div key={i+10} className={`h-4 bg-gray-200 rounded ${i % 2 === 0 ? 'w-4/5' : 'w-full'}`} />
            ))}
          </div>
        </article>

        {/* Sidebar skeleton */}
        <aside className="w-64 shrink-0 hidden lg:block">
          <div className="bg-white rounded-xl shadow-md border p-5 text-center space-y-3">
            <div className="w-24 h-24 rounded-full bg-gray-200 mx-auto" />
            <div className="h-3 w-32 bg-gray-200 rounded mx-auto" />
            <div className="h-4 w-36 bg-gray-200 rounded mx-auto" />
            <div className="h-3 w-40 bg-gray-200 rounded mx-auto" />
            <div className="h-8 w-28 bg-gray-100 rounded mx-auto" />
          </div>
        </aside>
      </div>
    </div>
  )
}

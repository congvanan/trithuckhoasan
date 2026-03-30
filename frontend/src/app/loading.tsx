export default function HomeLoading() {
  return (
    <div className="w-full bg-gradient-to-br from-blue-50 via-white to-slate-50 border-b animate-pulse">
      <div className="container px-4 md:px-6 py-10 md:py-16">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Text side */}
          <div className="flex flex-col gap-5 order-2 lg:order-1">
            <div className="h-6 w-28 bg-blue-100 rounded-full" />
            <div className="space-y-3">
              <div className="h-9 bg-gray-200 rounded w-full" />
              <div className="h-9 bg-gray-200 rounded w-5/6" />
              <div className="h-9 bg-gray-200 rounded w-4/6" />
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-5/6" />
              <div className="h-4 bg-gray-200 rounded w-4/5" />
            </div>
            <div className="h-11 w-36 bg-blue-200 rounded-full" />
          </div>
          {/* Image side */}
          <div className="order-1 lg:order-2">
            <div className="aspect-[4/3] rounded-2xl bg-gray-200" />
          </div>
        </div>
      </div>
    </div>
  )
}

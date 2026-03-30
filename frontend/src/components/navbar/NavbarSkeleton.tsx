export function NavbarSkeleton() {
  return (
    <header className="sticky inset-x-0 top-0 z-50 bg-background border-b h-16">
      <div className="container mx-auto px-4 md:px-6 h-full flex items-center justify-between">
        <div className="w-40 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
        <div className="hidden md:flex items-center gap-3">
          {[80, 72, 88, 72, 80].map((w, i) => (
            <div key={i} className="h-7 rounded-md bg-gray-100 dark:bg-gray-800 animate-pulse" style={{ width: w }} />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-gray-100 dark:bg-gray-800 animate-pulse" />
          <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 animate-pulse" />
        </div>
      </div>
    </header>
  )
}

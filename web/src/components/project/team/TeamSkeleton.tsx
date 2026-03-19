export function TeamSkeleton() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-5 w-full animate-pulse space-y-6">
        {/* header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-6 w-36 rounded bg-gray-200" />
            <div className="h-4 w-24 rounded bg-gray-200" />
          </div>
          <div className="h-8 w-36 rounded-xl bg-gray-200" />
        </div>
        {/* principals */}
        <div>
          <div className="h-3 w-28 rounded bg-gray-200 mb-3.5" />
          <div className="flex gap-4">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="flex flex-col border border-gray-100 rounded-lg w-40"
              >
                <div className="w-full pb-[55%] bg-gray-200" />
                <div className="p-2.5 space-y-1.5 bg-white">
                  <div className="h-3 w-20 rounded bg-gray-200" />
                  <div className="h-2 w-14 rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* member cards */}
        <div>
          <div className="h-3 w-28 rounded bg-gray-200 mb-3.5" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="rounded-lg overflow-hidden border border-gray-100"
              >
                <div className="w-full pb-[55%] bg-gray-200" />
                <div className="p-2.5 space-y-1.5 bg-white">
                  <div className="h-3 w-20 rounded bg-gray-200" />
                  <div className="h-2 w-14 rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

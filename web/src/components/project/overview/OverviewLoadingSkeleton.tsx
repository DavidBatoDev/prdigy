export function OverviewLoadingSkeleton() {
  return (
    <div className="h-full overflow-y-auto px-8 py-8 w-full animate-pulse">
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-10">
        <div className="space-y-8">
          <header className="pb-1 space-y-3">
            <div className="h-10 w-80 max-w-full rounded bg-gray-200" />
            <div className="h-4 w-72 max-w-full rounded bg-gray-200" />
          </header>

          <section className="pb-7 border-b border-gray-200 space-y-4">
            <div className="h-6 w-44 rounded bg-gray-200" />
            <div className="space-y-2">
              <div className="h-4 w-full rounded bg-gray-200" />
              <div className="h-4 w-[92%] rounded bg-gray-200" />
              <div className="h-4 w-[84%] rounded bg-gray-200" />
            </div>
          </section>

          <section className="pb-7 border-b border-gray-200 space-y-4">
            <div className="h-6 w-52 rounded bg-gray-200" />
            <div className="space-y-2">
              <div className="h-4 w-full rounded bg-gray-200" />
              <div className="h-4 w-[88%] rounded bg-gray-200" />
              <div className="h-4 w-[76%] rounded bg-gray-200" />
            </div>
          </section>

          <section className="pb-7 border-b border-gray-200 space-y-4">
            <div className="h-6 w-44 rounded bg-gray-200" />
            <div className="space-y-2">
              <div className="h-4 w-full rounded bg-gray-200" />
              <div className="h-4 w-[90%] rounded bg-gray-200" />
            </div>
          </section>

          <section className="pb-7 border-b border-gray-200 space-y-4">
            <div className="h-6 w-40 rounded bg-gray-200" />
            <div className="space-y-2">
              <div className="h-4 w-full rounded bg-gray-200" />
              <div className="h-4 w-[85%] rounded bg-gray-200" />
            </div>
          </section>
        </div>

        <aside className="border-l border-gray-300 pl-8 space-y-8 sticky top-6 self-start">
          <div>
            <div className="h-6 w-28 rounded bg-gray-200 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />
                  <div className="space-y-2 w-full">
                    <div className="h-4 w-[85%] rounded bg-gray-200" />
                    <div className="h-3 w-24 rounded bg-gray-200" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="h-6 w-28 rounded bg-gray-200 mb-3" />
            <div className="flex items-center gap-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className={`w-9 h-9 rounded-full bg-gray-200 ${index > 0 ? "-ml-2" : ""}`}
                />
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

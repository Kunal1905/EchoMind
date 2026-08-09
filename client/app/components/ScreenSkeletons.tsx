function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse bg-white/[0.07] ${className}`} />;
}

export function HistoryScreenSkeleton() {
  return (
    <main
      className="void-page min-h-screen pb-24 pt-24"
      aria-busy="true"
      aria-label="Loading session history"
    >
      <div className="void-section">
        <div className="mb-16 grid gap-8 md:grid-cols-[1.05fr_0.95fr] md:items-end">
          <div>
            <SkeletonBlock className="mb-5 h-3 w-24 rounded" />
            <SkeletonBlock className="h-14 w-full max-w-xl rounded sm:h-20" />
          </div>
          <div className="space-y-3">
            <SkeletonBlock className="h-4 w-full rounded" />
            <SkeletonBlock className="h-4 w-4/5 rounded" />
          </div>
        </div>

        <section className="mb-14 border-t void-hairline pt-8">
          <SkeletonBlock className="mb-7 h-8 w-48 rounded" />
          <SkeletonBlock className="h-44 w-full rounded-md" />
        </section>

        <section className="border-t void-hairline">
          {[0, 1, 2].map((row) => (
            <div key={row} className="flex items-center justify-between border-b void-hairline py-6">
              <div className="space-y-3">
                <SkeletonBlock className="h-4 w-36 rounded" />
                <SkeletonBlock className="h-3 w-20 rounded" />
              </div>
              <SkeletonBlock className="h-8 w-8 rounded-full" />
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}

export function PlansScreenSkeleton() {
  return (
    <main
      className="void-page min-h-screen pb-24 pt-24 text-white"
      aria-busy="true"
      aria-label="Loading plans"
    >
      <section className="void-section mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 grid gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-end">
          <div>
            <SkeletonBlock className="mb-5 h-3 w-56 rounded" />
            <SkeletonBlock className="h-14 w-full max-w-2xl rounded sm:h-20" />
          </div>
          <div className="space-y-3">
            <SkeletonBlock className="h-4 w-full rounded" />
            <SkeletonBlock className="h-4 w-4/5 rounded" />
          </div>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-8 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((card) => (
            <div key={card} className="min-h-[430px] border border-white/10 p-7">
              <SkeletonBlock className="mb-8 h-10 w-10 rounded-full" />
              <SkeletonBlock className="mb-4 h-8 w-32 rounded" />
              <SkeletonBlock className="mb-10 h-12 w-40 rounded" />
              <div className="space-y-4">
                {[0, 1, 2, 3].map((feature) => (
                  <SkeletonBlock key={feature} className="h-4 w-full rounded" />
                ))}
              </div>
              <SkeletonBlock className="mt-12 h-12 w-full rounded-full" />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

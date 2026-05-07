export default function VisitsLoading() {
  return (
    <main className="space-y-6 p-6">
      <div className="h-5 w-32 animate-pulse rounded bg-gray-200" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <section className="space-y-6 lg:col-span-3">
          <div className="h-28 animate-pulse rounded-2xl bg-gray-100" />

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
              <div className="h-8 w-32 animate-pulse rounded-full bg-gray-100" />
            </div>
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-gray-50 p-3">
                  <div className="size-8 animate-pulse rounded-full bg-gray-100" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-32 animate-pulse rounded bg-gray-100" />
                    <div className="h-2.5 w-20 animate-pulse rounded bg-gray-50" />
                  </div>
                  <div className="h-4 w-16 animate-pulse rounded-full bg-gray-100" />
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="hidden lg:block">
          <div className="h-72 animate-pulse rounded-2xl bg-gray-100" />
        </aside>
      </div>
    </main>
  );
}

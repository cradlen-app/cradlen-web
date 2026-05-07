export default function NotificationsLoading() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div className="space-y-1.5">
          <div className="h-5 w-36 animate-pulse rounded bg-gray-200" />
          <div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
        </div>
        <div className="h-9 w-28 animate-pulse rounded-lg bg-gray-100" />
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-7 w-20 animate-pulse rounded-full bg-gray-100" />
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-50">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3.5 px-6 py-3.5">
              <div className="size-10 rounded-xl bg-gray-100 animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-3/4 animate-pulse rounded bg-gray-100" />
                <div className="h-2.5 w-1/2 animate-pulse rounded bg-gray-100" />
                <div className="h-2 w-1/3 animate-pulse rounded bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

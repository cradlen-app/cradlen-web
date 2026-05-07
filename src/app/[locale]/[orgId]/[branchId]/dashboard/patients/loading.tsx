export default function PatientsLoading() {
  return (
    <div className="flex h-full flex-col gap-4 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div className="h-5 w-32 animate-pulse rounded bg-gray-200" />
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white/50">
        <div className="flex items-center gap-3 border-b border-gray-100 p-4">
          <div className="h-8 w-48 animate-pulse rounded-full bg-gray-100" />
          <div className="ms-auto h-8 w-32 animate-pulse rounded-full bg-gray-100" />
        </div>
        <div className="overflow-x-auto px-4">
          <div className="h-10 border-b border-gray-100" />
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 border-b border-gray-50 py-3 last:border-0">
              <div className="size-8 shrink-0 animate-pulse rounded-full bg-gray-100" />
              <div className="flex flex-1 flex-col gap-1.5">
                <div className="h-3 w-36 animate-pulse rounded bg-gray-100" />
              </div>
              <div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
              <div className="h-3 w-32 animate-pulse rounded bg-gray-100" />
              <div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
              <div className="h-4 w-16 animate-pulse rounded-full bg-gray-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

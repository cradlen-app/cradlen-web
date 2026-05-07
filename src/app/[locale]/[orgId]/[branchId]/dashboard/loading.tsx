export default function DashboardLoading() {
  return (
    <main className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1.5">
          <div className="h-5 w-48 animate-pulse rounded bg-gray-200" />
          <div className="h-3 w-32 animate-pulse rounded bg-gray-100" />
        </div>
        <div className="h-6 w-28 animate-pulse rounded-full bg-gray-100" />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-100" />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="h-64 animate-pulse rounded-2xl bg-gray-100 lg:col-span-2" />
        <div className="h-64 animate-pulse rounded-2xl bg-gray-100" />
      </div>
    </main>
  );
}

export default function SettingsLoading() {
  return (
    <div className="flex h-full flex-col gap-6 p-4 lg:p-6">
      <div className="h-5 w-24 animate-pulse rounded bg-gray-200" />

      <div className="rounded-2xl border border-gray-100 bg-white p-6 space-y-5">
        <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
            <div className="h-9 w-full animate-pulse rounded-lg bg-gray-100" />
          </div>
        ))}
        <div className="pt-2">
          <div className="h-9 w-24 animate-pulse rounded-lg bg-gray-200" />
        </div>
      </div>
    </div>
  );
}

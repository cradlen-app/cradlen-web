export default function CreateOrganizationLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="h-7 w-28 animate-pulse rounded bg-gray-100" />
        <div className="h-9 w-32 animate-pulse rounded-full bg-gray-100" />
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-xl flex flex-col items-center gap-6">
          <div className="size-18 animate-pulse rounded-2xl bg-gray-100" />

          <div className="w-full space-y-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="h-5 w-48 animate-pulse rounded bg-gray-200" />
            <div className="h-3 w-64 animate-pulse rounded bg-gray-100" />

            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
                <div className="h-10 w-full animate-pulse rounded-lg bg-gray-100" />
              </div>
            ))}

            <div className="h-10 w-full animate-pulse rounded-lg bg-gray-200" />
          </div>
        </div>
      </main>
    </div>
  );
}

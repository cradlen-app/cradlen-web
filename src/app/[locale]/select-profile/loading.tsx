export default function SelectProfileLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="h-7 w-28 animate-pulse rounded bg-gray-100" />
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-2xl flex flex-col items-center gap-6">
          <div className="size-20 animate-pulse rounded-2xl bg-gray-100" />

          <div className="w-full space-y-4">
            <div className="h-5 w-48 animate-pulse rounded bg-gray-200 mx-auto" />
            <div className="h-3 w-64 animate-pulse rounded bg-gray-100 mx-auto" />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mt-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
                >
                  <div className="size-12 animate-pulse rounded-full bg-gray-100 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-32 animate-pulse rounded bg-gray-200" />
                    <div className="h-2.5 w-20 animate-pulse rounded bg-gray-100" />
                    <div className="h-2.5 w-24 animate-pulse rounded bg-gray-100" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

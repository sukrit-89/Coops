export default function Loading() {
  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center p-6">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-[#ef4d23]" />
        <p className="text-xs font-medium text-neutral-500">Loading Coops platform data...</p>
      </div>
    </div>
  );
}

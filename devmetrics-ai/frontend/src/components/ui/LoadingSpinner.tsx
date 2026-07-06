export function LoadingSpinner({ size = 24 }: { size?: number }) {
  return (
    <div className="flex items-center justify-center p-8">
      <div
        className="rounded-full border-2 border-zinc-700 border-t-indigo-500 animate-spin"
        style={{ width: size, height: size }}
      />
    </div>
  );
}

export default function Loading() {
  return (
    <div className="container-1600 py-10">
      <div className="skeleton mb-6 h-12 w-1/2 rounded-[8px]" />
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="skeleton aspect-[3/4] rounded-[8px]" />
            <div className="skeleton h-4 rounded-[8px]" />
            <div className="skeleton h-4 w-2/3 rounded-[8px]" />
          </div>
        ))}
      </div>
    </div>
  );
}

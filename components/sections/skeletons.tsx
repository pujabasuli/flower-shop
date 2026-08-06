export function BouquetCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/40 bg-card">
      <div className="aspect-[4/5] shimmer" />
      <div className="space-y-3 p-4">
        <div className="h-5 w-3/4 rounded shimmer" />
        <div className="h-3 w-full rounded shimmer" />
        <div className="h-3 w-2/3 rounded shimmer" />
        <div className="flex items-center justify-between pt-2">
          <div className="h-6 w-20 rounded shimmer" />
          <div className="h-8 w-24 rounded shimmer" />
        </div>
      </div>
    </div>
  );
}

export function ShopSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 9 }).map((_, i) => (
        <BouquetCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="aspect-square skeleton-pulse bg-gray-200" />
      <div className="p-3 space-y-2">
        <div className="h-3 skeleton-pulse bg-gray-200 rounded w-1/3" />
        <div className="h-4 skeleton-pulse bg-gray-200 rounded w-full" />
        <div className="h-4 skeleton-pulse bg-gray-200 rounded w-3/4" />
        <div className="h-5 skeleton-pulse bg-gray-200 rounded w-1/2 mt-3" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => <ProductCardSkeleton key={i} />)}
    </div>
  );
}

export function OrderCardSkeleton() {
  return (
    <div className="card p-4 space-y-3">
      <div className="flex justify-between">
        <div className="h-4 skeleton-pulse bg-gray-200 rounded w-1/3" />
        <div className="h-4 skeleton-pulse bg-gray-200 rounded w-1/4" />
      </div>
      <div className="h-16 skeleton-pulse bg-gray-200 rounded" />
      <div className="h-4 skeleton-pulse bg-gray-200 rounded w-1/2" />
    </div>
  );
}

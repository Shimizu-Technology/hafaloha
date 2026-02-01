/**
 * Reusable skeleton primitives for loading states across admin pages.
 * Compose these to build page-specific skeleton layouts.
 */

interface SkeletonProps {
  className?: string;
}

/** Basic animated bar */
export function SkeletonBar({ className = 'h-4 w-full' }: SkeletonProps) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />;
}

/** Rounded circle (avatars, icons) */
export function SkeletonCircle({ className = 'h-10 w-10' }: SkeletonProps) {
  return <div className={`animate-pulse bg-gray-200 rounded-full ${className}`} />;
}

/** Stat card skeleton */
export function SkeletonStatCard() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-3 flex-1">
          <SkeletonBar className="h-3 w-20" />
          <SkeletonBar className="h-8 w-16" />
        </div>
        <SkeletonCircle className="h-12 w-12" />
      </div>
    </div>
  );
}

/** Table row skeleton */
export function SkeletonTableRow({ cols = 6 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <SkeletonBar className={`h-4 ${i === 0 ? 'w-32' : i === cols - 1 ? 'w-20' : 'w-24'}`} />
        </td>
      ))}
    </tr>
  );
}

/** Full table skeleton with header */
export function SkeletonTable({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-gray-50/80 px-6 py-3 flex gap-8">
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonBar key={i} className="h-3 w-16" />
        ))}
      </div>
      <div className="divide-y divide-gray-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-6 py-4 flex gap-8 items-center">
            {Array.from({ length: cols }).map((_, j) => (
              <SkeletonBar key={j} className={`h-4 ${j === 0 ? 'w-32' : 'w-20'}`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Dashboard skeleton */
export function SkeletonDashboard() {
  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Welcome banner */}
      <SkeletonBar className="h-28 w-full rounded-2xl" />
      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
      </div>
      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonBar key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      {/* Recent orders */}
      <SkeletonTable rows={5} cols={4} />
    </div>
  );
}

/** Orders / Products list skeleton */
export function SkeletonListPage() {
  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <SkeletonBar className="h-7 w-32" />
          <SkeletonBar className="h-4 w-24" />
        </div>
      </div>
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SkeletonBar className="h-10 rounded-lg" />
          <SkeletonBar className="h-10 rounded-lg" />
          <SkeletonBar className="h-10 rounded-lg" />
        </div>
      </div>
      {/* Table */}
      <SkeletonTable rows={8} cols={6} />
    </div>
  );
}

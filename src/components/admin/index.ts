// Admin shared component library
// Import from '@/components/admin' or '../components/admin'

export { default as AdminIcon, ADMIN_ICONS } from './AdminIconMap';
export { default as AdminPageHeader } from './AdminPageHeader';
export type { BreadcrumbItem } from './AdminPageHeader';
export { default as StatCard } from './StatCard';
export { default as AdminModal } from './AdminModal';
export { default as AdminTable, AdminPagination } from './AdminTable';
export type { AdminColumn } from './AdminTable';
export { default as AdminFilterBar, FilterSelect, FilterSearch, FilterDate } from './AdminFilterBar';
export { default as AdminPageTransition } from './AdminPageTransition';
export {
  SkeletonBar,
  SkeletonCircle,
  SkeletonStatCard,
  SkeletonTableRow,
  SkeletonTable,
  SkeletonDashboard,
  SkeletonListPage,
} from './Skeleton';

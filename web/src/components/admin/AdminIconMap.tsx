import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  FolderOpen,
  Warehouse,
  Heart,
  IceCreamCone,
  Users,
  Upload,
  Settings,
  Sliders,
  Plus,
  ClipboardList,
  DollarSign,
  Clock,
  ShoppingBag,
  TrendingUp,
  BarChart3,
  MapPin,
  Monitor,
};

interface AdminIconProps {
  name: string;
  className?: string;
  size?: number;
}

/**
 * Render a Lucide icon by its registry name.
 * Falls back to a neutral dot if the name isn't mapped.
 */
export default function AdminIcon({ name, className = 'w-5 h-5', size }: AdminIconProps) {
  const Icon = ADMIN_ICONS[name];
  if (!Icon) {
    return <span className={className} />;
  }
  return <Icon className={className} size={size} />;
}

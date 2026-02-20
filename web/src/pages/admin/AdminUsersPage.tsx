import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import toast from 'react-hot-toast';
import { authGet, authPatch } from '../../services/authApi';

const ROLES = ['customer', 'staff', 'manager', 'admin'] as const;
type Role = (typeof ROLES)[number];

const ROLE_LABELS: Record<Role, string> = {
  customer: 'Customer',
  staff: 'Staff',
  manager: 'Manager',
  admin: 'Admin',
};

const ROLE_COLORS: Record<Role, string> = {
  customer: 'bg-gray-100 text-gray-800',
  staff: 'bg-blue-100 text-blue-800',
  manager: 'bg-purple-100 text-purple-800',
  admin: 'bg-indigo-100 text-indigo-800',
};

interface User {
  id: number;
  email: string;
  name: string | null;
  phone: string | null;
  role: Role;
  role_level: number;
  is_admin: boolean;
  assigned_location_id: number | null;
  clerk_id: string;
  created_at: string;
  updated_at: string;
}

interface Stats {
  total: number;
  admins: number;
  managers: number;
  staff: number;
  customers: number;
}

interface UsersIndexResponse {
  users: User[];
  stats: Stats;
}

interface AdminUserResponse {
  user: User;
  message: string;
}

export default function AdminUsersPage() {
  const { getToken } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, admins: 0, managers: 0, staff: 0, customers: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (searchQuery) params.search = searchQuery;
      if (roleFilter !== 'all') params.role = roleFilter;
      const response = await authGet<UsersIndexResponse>('/admin/users', getToken, { params });
      setUsers(response.data.users);
      setStats(response.data.stats);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const handleSearch = () => {
    fetchUsers();
  };

  const updateUserRole = async (user: User, newRole: Role) => {
    if (newRole === user.role) return;

    const action = `change ${user.email} from ${ROLE_LABELS[user.role]} to ${ROLE_LABELS[newRole]}`;
    if (!confirm(`Are you sure you want to ${action}?`)) return;

    try {
      setUpdatingUserId(user.id);
      const response = await authPatch<AdminUserResponse>(
        `/admin/users/${user.id}`,
        { user: { role: newRole } },
        getToken
      );
      setUsers(users.map((u) => (u.id === user.id ? response.data.user : u)));
      toast.success(response.data.message);
      // Refresh stats
      fetchUsers();
    } catch (err: any) {
      console.error('Failed to update user:', err);
      toast.error(err.response?.data?.error || 'Failed to update user');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600 mt-1">Manage user accounts and roles</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-sm text-gray-500">Total</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-3xl font-bold text-indigo-600">{stats.admins}</p>
          <p className="text-sm text-gray-500">Admins</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-3xl font-bold text-purple-600">{stats.managers}</p>
          <p className="text-sm text-gray-500">Managers</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-3xl font-bold text-blue-600">{stats.staff}</p>
          <p className="text-sm text-gray-500">Staff</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-3xl font-bold text-gray-600">{stats.customers}</p>
          <p className="text-sm text-gray-500">Customers</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search by email or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent"
              />
              <button
                onClick={handleSearch}
                className="px-6 py-2 bg-hafalohaRed text-white rounded-lg hover:bg-red-700 transition font-medium"
              >
                Search
              </button>
            </div>
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent"
          >
            <option value="all">All Roles</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]} Only
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Users List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-hafalohaRed"></div>
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="mb-4">
            <svg
              className="w-16 h-16 mx-auto text-gray-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No users found</h3>
          <p className="text-gray-600">
            {searchQuery || roleFilter !== 'all'
              ? 'Try adjusting your search or filters.'
              : 'Users will appear here once they sign in.'}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[180px]">
                    Change Role
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="shrink-0 h-10 w-10">
                          <div
                            className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold ${
                              user.role === 'admin'
                                ? 'bg-indigo-500'
                                : user.role === 'manager'
                                  ? 'bg-purple-500'
                                  : user.role === 'staff'
                                    ? 'bg-blue-500'
                                    : 'bg-gray-400'
                            }`}
                          >
                            {(user.name || user.email).charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name || 'No name'}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[user.role]}`}
                      >
                        {ROLE_LABELS[user.role]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={user.role}
                        disabled={updatingUserId === user.id}
                        onChange={(e) => updateUserRole(user, e.target.value as Role)}
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-hafalohaRed focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {ROLE_LABELS[r]}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {users.map((user) => (
              <div key={user.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <div
                      className={`h-12 w-12 rounded-full flex items-center justify-center text-white font-semibold text-lg ${
                        user.role === 'admin'
                          ? 'bg-indigo-500'
                          : user.role === 'manager'
                            ? 'bg-purple-500'
                            : user.role === 'staff'
                              ? 'bg-blue-500'
                              : 'bg-gray-400'
                      }`}
                    >
                      {(user.name || user.email).charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-3">
                      <p className="font-semibold text-gray-900">{user.name || 'No name'}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[user.role]}`}
                  >
                    {ROLE_LABELS[user.role]}
                  </span>
                </div>

                <div className="text-sm text-gray-500 mb-4">Joined {formatDate(user.created_at)}</div>

                <select
                  value={user.role}
                  disabled={updatingUserId === user.id}
                  onChange={(e) => updateUserRole(user, e.target.value as Role)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Help Text */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Role Hierarchy</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li><strong>Admin</strong> — Full access to all settings, users, and store management</li>
          <li><strong>Manager</strong> — Orders, products, collections, imports, and inventory</li>
          <li><strong>Staff</strong> — Order status updates and fulfillment (requires assigned location)</li>
          <li><strong>Customer</strong> — Regular storefront user</li>
        </ul>
      </div>
    </div>
  );
}

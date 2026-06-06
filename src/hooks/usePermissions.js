import { useAuth } from '../context/AuthContext';

export function usePermissions() {
  const { user } = useAuth();
  const role = user?.role ?? '';

  const isAdmin      = role === 'Admin' || role === 'SuperAdmin';
  const isSuperAdmin = role === 'SuperAdmin';
  const isClient     = role === 'Client';
  const isViewer     = role === 'Viewer';

  // SuperAdmin يحتاج يختار شركة أولاً قبل ما يضيف — الـ page بتتحكم في ده
  const canCreate = role === 'Admin' || role === 'SuperAdmin';

  return {
    role,
    isAdmin,
    isSuperAdmin,
    canCreate,
    isClient,
    isViewer,
  };
}

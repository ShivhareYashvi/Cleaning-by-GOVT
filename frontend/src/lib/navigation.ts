import type { UserRole } from './types';

export function dashboardPathForRole(role: UserRole): string {
  switch (role) {
    case 'driver':
      return '/dashboard/driver';
    case 'admin':
      return '/dashboard/admin';
    default:
      return '/dashboard/user';
  }
}

export const ROLES = {
  ADMIN: 'admin',
  SUPERVISOR: 'supervisor',
  TECHNICIAN: 'technician',
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES];

export const ROLE_LABELS_AR = {
  [ROLES.ADMIN]: 'مدير النظام',
  [ROLES.SUPERVISOR]: 'مشرف',
  [ROLES.TECHNICIAN]: 'مندوب',
} as const;

export const ROLE_ORDER = {
  [ROLES.ADMIN]: 3,
  [ROLES.SUPERVISOR]: 2,
  [ROLES.TECHNICIAN]: 1,
} as const;

export function hasRoleOrAbove(userRole: string, requiredRole: string): boolean {
  const userLevel = ROLE_ORDER[userRole as UserRole] || 0;
  const requiredLevel = ROLE_ORDER[requiredRole as UserRole] || 0;
  return userLevel >= requiredLevel;
}

export function canManageUsers(userRole: string): boolean {
  return userRole === ROLES.ADMIN;
}

export function canViewReports(userRole: string): boolean {
  return hasRoleOrAbove(userRole, ROLES.SUPERVISOR);
}

export function canManageWarehouses(userRole: string): boolean {
  return hasRoleOrAbove(userRole, ROLES.SUPERVISOR);
}

export function isSupervisor(userRole: string): boolean {
  return userRole === ROLES.SUPERVISOR;
}

export function isAdmin(userRole: string): boolean {
  return userRole === ROLES.ADMIN;
}

export function isTechnician(userRole: string): boolean {
  return userRole === ROLES.TECHNICIAN;
}

export function getRoleLabel(role: UserRole | string): string {
  return ROLE_LABELS_AR[role as UserRole] || 'غير معروف';
}

export const ROLE_BADGE_VARIANTS = {
  [ROLES.ADMIN]: 'bg-purple-100 text-purple-700 border-purple-200',
  [ROLES.SUPERVISOR]: 'bg-teal-100 text-teal-700 border-teal-200',
  [ROLES.TECHNICIAN]: 'bg-blue-100 text-blue-700 border-blue-200',
} as const;


import { UserRole } from "@/lib/enums"

/**
 * Role hierarchy from highest to lowest privilege
 */
export const ROLE_HIERARCHY = {

  [UserRole.ADMIN]: 5,
  [UserRole.EDITOR]: 4,
  [UserRole.CONTENT_MODERATOR]: 3,
  [UserRole.TEACHER]: 2,
  [UserRole.STUDENT]: 1,
} as const

/**
 * French labels for roles
 */
export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ADMIN]: "Administrateur",
  [UserRole.EDITOR]: "Éditeur",
  [UserRole.CONTENT_MODERATOR]: "Modérateur",
  [UserRole.TEACHER]: "Enseignant",
  [UserRole.STUDENT]: "Étudiant",
}

/**
 * Check if a user can access the admin panel
 */
export function canAccessAdmin(role: UserRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[UserRole.EDITOR]
}

/**
 * Check if a user can manage content (lessons, exercises)
 */
export function canManageContent(role: UserRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[UserRole.EDITOR]
}

/**
 * Check if a user can manage other users
 */
export function canManageUsers(role: UserRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[UserRole.ADMIN]
}

/**
 * Check if a user can modify another user's role
 * - ADMIN can modify anyone
 * - Others cannot modify roles
 */
export function canModifyUserRole(
  currentUserRole: UserRole,
  targetUserRole: UserRole
): boolean {
  // ADMIN can modify anyone
  if (currentUserRole === UserRole.ADMIN) return true

  // Others cannot modify roles
  return false
}

/**
 * Get roles that a user can assign to others
 */
export function getAssignableRoles(currentUserRole: UserRole): UserRole[] {
  if (currentUserRole === UserRole.ADMIN) {
    return [
      UserRole.ADMIN,
      UserRole.EDITOR,
      UserRole.CONTENT_MODERATOR,
      UserRole.TEACHER,
      UserRole.STUDENT
    ]
  }

  // Others cannot assign roles
  return []
}

/**
 * Get role badge color for UI
 */
export function getRoleBadgeColor(role: UserRole): string {
  switch (role) {
    case UserRole.ADMIN:
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
    case UserRole.EDITOR:
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
    case UserRole.CONTENT_MODERATOR:
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
    case UserRole.TEACHER:
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
    case UserRole.STUDENT:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
  }
}

/**
 * Check if a user can delete content
 * Only ADMIN can delete
 */
export function canDeleteContent(role: UserRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[UserRole.ADMIN]
}

/**
 * Check if a user can publish content
 * ADMIN, and EDITOR can publish
 */
export function canPublishContent(role: UserRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[UserRole.EDITOR]
}

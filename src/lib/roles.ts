import { UserRole } from "@prisma/client"

/**
 * Role hierarchy from highest to lowest privilege
 */
export const ROLE_HIERARCHY = {

  ADMIN: 5,
  EDITOR: 4,
  CONTENT_MODERATOR: 3,
  TEACHER: 2,
  STUDENT: 1,
} as const

/**
 * French labels for roles
 */
export const ROLE_LABELS: Record<UserRole, string> = {

  ADMIN: "Administrateur",
  EDITOR: "Éditeur",
  CONTENT_MODERATOR: "Modérateur",
  TEACHER: "Enseignant",
  STUDENT: "Étudiant",
}

/**
 * Check if a user can access the admin panel
 */
export function canAccessAdmin(role: UserRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.EDITOR
}

/**
 * Check if a user can manage content (lessons, exercises)
 */
export function canManageContent(role: UserRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.EDITOR
}

/**
 * Check if a user can manage other users
 */
export function canManageUsers(role: UserRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.ADMIN
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
  if (currentUserRole === "ADMIN") return true

  // Others cannot modify roles
  return false
}

/**
 * Get roles that a user can assign to others
 */
export function getAssignableRoles(currentUserRole: UserRole): UserRole[] {


  if (currentUserRole === "ADMIN") {
    return ["ADMIN", "EDITOR", "CONTENT_MODERATOR", "TEACHER", "STUDENT"]
  }

  // Others cannot assign roles
  return []
}

/**
 * Get role badge color for UI
 */
export function getRoleBadgeColor(role: UserRole): string {
  switch (role) {

    case "ADMIN":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
    case "EDITOR":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
    case "CONTENT_MODERATOR":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
    case "TEACHER":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
    case "STUDENT":
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
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.ADMIN
}

/**
 * Check if a user can publish content
 * ADMIN, and EDITOR can publish
 */
export function canPublishContent(role: UserRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.EDITOR
}

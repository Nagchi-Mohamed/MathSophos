"use client"

import { useState } from "react"
import { MoreHorizontal, Trash, Shield, ShieldAlert, Loader2, Crown, Edit, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu"
import { deleteUser, updateUserRole } from "@/actions/admin"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { UserRole } from "@/lib/enums"
import { getAssignableRoles, ROLE_LABELS, canModifyUserRole } from "@/lib/roles"

interface UserActionsProps {
  user: {
    id: string
    role: UserRole
    name: string | null
  }
}

export function UserActions({ user }: UserActionsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { data: session, status } = useSession()
  const currentUserRole = session?.user?.role as UserRole

  // Show loading state while session is loading
  if (status === "loading") {
    return (
      <Button variant="ghost" className="h-8 w-8 p-0" disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    )
  }

  // If not authenticated or no role, show disabled button
  if (!session || !currentUserRole) {
    return (
      <Button variant="ghost" className="h-8 w-8 p-0" disabled title="Non connecté">
        <MoreHorizontal className="h-4 w-4 opacity-50" />
      </Button>
    )
  }

  // Get roles that current user can assign
  const assignableRoles = getAssignableRoles(currentUserRole)

  // Check if current user can modify this user
  const canModify = canModifyUserRole(currentUserRole, user.role)

  // If user cannot modify, show disabled button
  if (!canModify) {
    return (
      <Button variant="ghost" className="h-8 w-8 p-0" disabled title="Permissions insuffisantes">
        <MoreHorizontal className="h-4 w-4 opacity-50" />
      </Button>
    )
  }

  const handleRoleChange = async (newRole: UserRole) => {
    setIsLoading(true)
    try {
      const result = await updateUserRole(user.id, newRole)
      if (result.success) {
        toast.success(`Rôle mis à jour vers ${ROLE_LABELS[newRole]}`)
        router.refresh()
      } else {
        toast.error("Erreur: " + result.message)
      }
    } catch (error) {
      toast.error("Une erreur est survenue")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${user.name || "sans nom"} ?`)) return

    setIsLoading(true)
    try {
      const result = await deleteUser(user.id)
      if (result.success) {
        toast.success("Utilisateur supprimé avec succès")
        router.refresh()
      } else {
        toast.error("Erreur: " + result.message)
      }
    } catch (error) {
      toast.error("Une erreur est survenue")
    } finally {
      setIsLoading(false)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "OWNER":
        return <Crown className="mr-2 h-4 w-4 text-yellow-600" />
      case "ADMIN":
        return <ShieldAlert className="mr-2 h-4 w-4 text-red-600" />
      case "EDITOR":
        return <Edit className="mr-2 h-4 w-4 text-blue-600" />
      default:
        return <User className="mr-2 h-4 w-4" />
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0" disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {assignableRoles.length > 0 && (
          <>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Shield className="mr-2 h-4 w-4" />
                Changer le rôle
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {assignableRoles.map((role) => (
                  <DropdownMenuItem
                    key={role}
                    onClick={() => handleRoleChange(role)}
                    disabled={isLoading || role === user.role}
                  >
                    {getRoleIcon(role)}
                    {ROLE_LABELS[role]}
                    {role === user.role && " (actuel)"}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem
          className="text-red-600 focus:text-red-600 cursor-pointer"
          onClick={handleDelete}
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash className="mr-2 h-4 w-4" />}
          Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

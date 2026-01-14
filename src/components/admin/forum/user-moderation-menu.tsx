"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { MoreVertical, ShieldAlert, Ban, Timer, Trash2, Loader2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { suspendUserComments, blockUserComments, deleteUser } from "@/actions/forum"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface UserModerationMenuProps {
  userId: string
  userName: string
}

export function UserModerationMenu({ userId, userName }: UserModerationMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [actionType, setActionType] = useState<"suspend" | "block" | "delete" | null>(null)
  const [suspensionDuration, setSuspensionDuration] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleAction = async () => {
    setIsLoading(true)
    try {
      let result;
      if (actionType === "suspend") {
        result = await suspendUserComments(userId, suspensionDuration)
      } else if (actionType === "block") {
        result = await blockUserComments(userId)
      } else if (actionType === "delete") {
        result = await deleteUser(userId)
      }

      if (result?.success) {
        toast.success("Action effectuée avec succès")
        router.refresh()
        setIsOpen(false)
      } else {
        toast.error(result?.error || "Une erreur est survenue")
      }
    } catch (error) {
      toast.error("Erreur inattendue")
    } finally {
      setIsLoading(false)
      // Reset state if successful or handled
      if (actionType !== "delete") { // Keep dialog open on delete error? No, close it.
        setActionType(null)
      }
    }
  }

  const openSuspendDialog = (hours: number) => {
    setSuspensionDuration(hours)
    setActionType("suspend")
    setIsOpen(true)
  }

  const openBlockDialog = () => {
    setActionType("block")
    setIsOpen(true)
  }

  const openDeleteDialog = () => {
    setActionType("delete")
    setIsOpen(true)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 ml-2">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions sur {userName}</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Timer className="mr-2 h-4 w-4" />
              Suspendre
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => openSuspendDialog(12)}>
                12 Heures
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openSuspendDialog(24)}>
                24 Heures
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openSuspendDialog(168)}>
                1 Semaine
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuItem onClick={openBlockDialog} className="text-orange-600 focus:text-orange-600 focus:bg-orange-50">
            <Ban className="mr-2 h-4 w-4" />
            Bloquer commentaires
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={openDeleteDialog} className="text-red-600 focus:text-red-600 focus:bg-red-50">
            <Trash2 className="mr-2 h-4 w-4" />
            Supprimer l'utilisateur
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === "suspend" && "Confirmer la suspension"}
              {actionType === "block" && "Confirmer le blocage"}
              {actionType === "delete" && "Supprimer l'utilisateur ?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === "suspend" && `Voulez-vous suspendre les commentaires de ${userName} pour ${suspensionDuration} heures ?`}
              {actionType === "block" && `Voulez-vous bloquer définitivement les commentaires de ${userName} ?`}
              {actionType === "delete" && (
                <span className="text-red-600 font-bold block bg-red-50 p-2 rounded border border-red-200">
                  ATTENTION : Cette action supprimera définitivement le compte de {userName} et toutes ses données. Cette action est irréversible.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading} onClick={() => setActionType(null)}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleAction(); }}
              className={`
                ${actionType === 'delete' ? 'bg-red-600 hover:bg-red-700' : ''}
                ${actionType === 'block' ? 'bg-orange-600 hover:bg-orange-700' : ''}
              `}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

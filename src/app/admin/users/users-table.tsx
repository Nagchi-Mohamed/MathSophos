"use client"

import { useState } from "react"
import { Search, Users as UsersIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { UserActions } from "./user-actions"
import { ROLE_LABELS, getRoleBadgeColor } from "@/lib/roles"
import { UserRole } from "@/lib/enums"

interface User {
  id: string
  name: string | null
  email: string | null
  image: string | null
  role: UserRole
  createdAt: Date
  _count: {
    createdLessons: number
    forumPosts: number
  }
}

interface UsersTableProps {
  users: User[]
  total: number
}

export function UsersTable({ users, total }: UsersTableProps) {
  const [searchQuery, setSearchQuery] = useState("")

  // Filter users based on search query
  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase()
    return (
      user.name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.id.toLowerCase().includes(query)
    )
  })

  return (
    <div className="space-y-6">
      {/* Header with Search */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <UsersIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h1 className="text-3xl font-bold">Gestion des Utilisateurs</h1>
          </div>
          <p className="text-muted-foreground">
            Gérez les rôles et les permissions • {filteredUsers.length} sur {total} utilisateurs
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Rechercher par nom, email ou ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 max-w-md"
        />
      </div>

      {/* Table */}
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Utilisateur</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Activités</TableHead>
              <TableHead>Date d'inscription</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={user.image || ""} />
                      <AvatarFallback>{user.name?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{user.name || "Sans nom"}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                      <div className="text-xs text-muted-foreground/70 font-mono">ID: {user.id.slice(0, 8)}...</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getRoleBadgeColor(user.role)}>
                      {ROLE_LABELS[user.role] || user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{user._count.createdLessons} leçons créées</div>
                      <div className="text-muted-foreground">{user._count.forumPosts} messages forum</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <UserActions user={user} />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24">
                  {searchQuery ? (
                    <div>
                      <p className="text-muted-foreground">Aucun utilisateur trouvé pour "{searchQuery}"</p>
                      <button
                        onClick={() => setSearchQuery("")}
                        className="text-sm text-primary hover:underline mt-2"
                      >
                        Effacer la recherche
                      </button>
                    </div>
                  ) : (
                    "Aucun utilisateur trouvé."
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

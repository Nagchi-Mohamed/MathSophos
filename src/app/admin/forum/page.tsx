import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { MessageSquare, Eye } from "lucide-react"
import { getRecentForumPosts } from "@/actions/admin"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DeletePostButton } from "@/components/admin/forum/forum-actions"
import { UserModerationMenu } from "@/components/admin/forum/user-moderation-menu"
import { CleanupForumButton } from "@/components/admin/forum/cleanup-forum-button"

export default async function AdminForumPage() {
  const { data: posts } = await getRecentForumPosts(50) // Increased limit for admin view

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Modération Forum</h1>
        <CleanupForumButton />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[400px]">Sujet</TableHead>
                <TableHead>Auteur</TableHead>
                <TableHead>Réponses</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts && posts.length > 0 ? (
                posts.map((post: any) => (
                  <TableRow key={post.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{post.title}</span>
                        <span className="text-xs text-muted-foreground line-clamp-1">{post.content.substring(0, 50)}...</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span>{post.user?.name || "Anonyme"}</span>
                          <span className="text-xs text-muted-foreground">{post.user?.email}</span>
                        </div>
                        {post.user && (
                          <UserModerationMenu userId={post.user.id} userName={post.user.name || "Utilisateur"} />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        <span>{post._count.replies}</span>
                        {post._count.replies === 0 && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                            Nouveau
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(post.createdAt).toLocaleDateString("fr-FR", {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/admin/forum/${post.id}`}>
                          <Button variant="outline" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <DeletePostButton id={post.id} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Aucun sujet de discussion trouvé.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

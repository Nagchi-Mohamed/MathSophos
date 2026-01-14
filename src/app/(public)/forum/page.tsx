import { Card } from "@/components/ui/card"
import { getForumPosts } from "@/actions/forum"
import { NewTopicDialog } from "@/components/forum/new-topic-dialog"
import { ForumPostCard } from "@/components/forum/forum-post-card"

export const dynamic = 'force-dynamic'

export default async function ForumPage() {
  const result = await getForumPosts(20, 0)
  const posts = result.success ? result.data?.posts || [] : []

  return (
    <div className="container py-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Forum d'Entraide</h1>
          <p className="text-muted-foreground">
            Posez vos questions et échangez avec la communauté MathSophos.
          </p>
        </div>
        <div className="w-full sm:w-auto">
          <NewTopicDialog />
        </div>
      </div>

      <div className="grid gap-4">
        {posts.length > 0 ? (
          posts.map((post: any) => (
            <ForumPostCard key={post.id} post={post} />
          ))
        ) : (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground mb-4">Aucun sujet pour le moment</p>
            <p className="text-sm text-muted-foreground">Soyez le premier à poser une question !</p>
          </Card>
        )}
      </div>
    </div>
  )
}

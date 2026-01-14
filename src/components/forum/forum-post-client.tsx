"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"
import { ReplyForm } from "@/components/forum/reply-form"
import { ReportCommentButton } from "@/components/forum/report-comment-button"
import { ReactionButton } from "@/components/forum/reaction-button"
import { EditPostDialog } from "@/components/forum/edit-post-dialog"
import { EditReplyDialog } from "@/components/forum/edit-reply-dialog"
import { DeleteButton } from "@/components/forum/delete-button"
import Image from "next/image"
import MarkdownRenderer from "@/components/markdown-renderer"
import { getForumPost } from "@/actions/forum"
import { useSession } from "next-auth/react"

interface ForumPostClientProps {
  postId: string
}

export function ForumPostClient({ postId }: ForumPostClientProps) {
  const [post, setPost] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { data: session } = useSession()

  useEffect(() => {
    async function fetchPost() {
      try {
        const result = await getForumPost(postId)
        if (result.success && result.data) {
          setPost(result.data)
        } else {
          setError("Post not found")
        }
      } catch (err) {
        setError("Failed to load post")
      } finally {
        setLoading(false)
      }
    }

    fetchPost()
  }, [postId])

  if (loading) {
    return (
      <div className="container py-10 max-w-4xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="container py-10 max-w-4xl">
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">{error || "Post not found"}</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-10 max-w-4xl">
      <Link href="/forum">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour au forum
        </Button>
      </Link>

      {/* Original Post */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12">
              <AvatarFallback>{post.user?.name?.[0] || "U"}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-2xl mb-2">{post.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Par <span className="font-medium text-foreground">{post.user?.name || "Anonyme"}</span> • {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: fr })}
                    {post.updatedAt && new Date(post.updatedAt).getTime() !== new Date(post.createdAt).getTime() && (
                      <span className="ml-2 text-xs">(modifié)</span>
                    )}
                  </p>
                </div>
                {session?.user?.id === post.userId && (
                  <div className="flex gap-2">
                    <EditPostDialog
                      postId={post.id}
                      currentTitle={post.title}
                      currentContent={post.content}
                    />
                    <DeleteButton type="post" id={post.id} redirectTo="/forum" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose dark:prose-invert max-w-none">
            <MarkdownRenderer content={post.content} />
          </div>
          {post.imageUrl && (
            <div className="mt-4 relative w-full max-w-2xl">
              <Image
                src={post.imageUrl}
                alt="Post image"
                width={800}
                height={600}
                className="rounded-lg object-cover w-full h-auto"
                unoptimized
              />
            </div>
          )}
          <div className="mt-4 pt-4 border-t">
            <ReactionButton
              postId={post.id}
              reactions={post.reactions || []}
              currentUserId={session?.user?.id}
            />
          </div>
        </CardContent>
      </Card>

      {/* Replies */}
      <div className="space-y-4 mb-8">
        <h2 className="text-xl font-semibold">
          {post.replies?.length || 0} {(post.replies?.length || 0) > 1 ? "Réponses" : "Réponse"}
        </h2>
        {post.replies?.map((reply: any) => (
          <Card key={reply.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <Avatar>
                    <AvatarFallback>{reply.user?.name?.[0] || "U"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{reply.user?.name || "Anonyme"}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true, locale: fr })}
                      {reply.updatedAt && new Date(reply.updatedAt).getTime() !== new Date(reply.createdAt).getTime() && (
                        <span className="ml-2 text-xs">(modifié)</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {session?.user?.id === reply.userId && (
                    <>
                      <EditReplyDialog
                        replyId={reply.id}
                        currentContent={reply.content}
                      />
                      <DeleteButton type="reply" id={reply.id} />
                    </>
                  )}
                  <ReportCommentButton
                    replyId={reply.id}
                    replyContent={reply.content}
                    replyAuthorId={reply.userId}
                    replyAuthorName={reply.user?.name || "Anonyme"}
                    postId={postId}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose dark:prose-invert max-w-none">
                <MarkdownRenderer content={reply.content} />
              </div>
              {reply.imageUrl && (
                <div className="mt-4 relative w-full max-w-2xl">
                  <Image
                    src={reply.imageUrl}
                    alt="Reply image"
                    width={800}
                    height={600}
                    className="rounded-lg object-cover w-full h-auto"
                    unoptimized
                  />
                </div>
              )}
              <div className="mt-4 pt-4 border-t">
                <ReactionButton
                  replyId={reply.id}
                  reactions={reply.reactions || []}
                  currentUserId={session?.user?.id}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Reply Form */}
      <Card>
        <CardHeader>
          <CardTitle>Votre réponse</CardTitle>
        </CardHeader>
        <CardContent>
          <ReplyForm postId={postId} />
        </CardContent>
      </Card>
    </div>
  )
}

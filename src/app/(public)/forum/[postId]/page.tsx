import { ForumPostClient } from "@/components/forum/forum-post-client"

interface PageProps {
  params: Promise<{ postId: string }>
}

export default async function ForumPostPage({ params }: PageProps) {
  const { postId } = await params

  return <ForumPostClient postId={postId} />
}

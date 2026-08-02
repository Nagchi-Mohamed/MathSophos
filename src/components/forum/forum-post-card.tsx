"use client"
import MarkdownRenderer from "@/components/markdown-renderer"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Image as ImageIcon, ArrowRight, Bot } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"
import Link from "next/link"
import Image from "next/image"

interface ForumPostCardProps {
  post: any
}

export function ForumPostCard({ post }: ForumPostCardProps) {
  const replyCount = post.replies?.length || 0;
  const hasAiReply = post.replies?.some((r: any) => r.isAI || r.isAiGenerated);

  return (
    <Link href={`/forum/${post.id}`} className="block group">
      <Card className="hover:bg-muted/50 transition-all hover:shadow-md hover:border-primary/30 group-hover:border-primary/40">
        <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-2">
          <Avatar className="ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
            <AvatarFallback className="font-semibold bg-gradient-to-br from-blue-500 to-purple-500 text-white">
              {post.user?.name?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base text-primary group-hover:text-primary/80 transition-colors line-clamp-2 leading-snug">
              {post.title}
            </CardTitle>
            <CardDescription className="mt-1 text-xs flex items-center gap-1 flex-wrap">
              <span className="font-medium text-foreground/70">{post.user?.name || "Anonyme"}</span>
              <span className="opacity-50">•</span>
              <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: fr })}</span>
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <div className="flex items-center gap-2 text-muted-foreground">
              {post.imageUrl && (
                <span title="Contient une image">
                  <ImageIcon className="h-3.5 w-3.5 opacity-60" />
                </span>
              )}
              {hasAiReply && (
                <Badge variant="outline" className="text-xs px-1.5 py-0 h-5 border-purple-300 text-purple-600 dark:border-purple-700 dark:text-purple-400">
                  <Bot className="h-2.5 w-2.5 mr-1" />
                  AI
                </Badge>
              )}
              <div className="flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">{replyCount}</span>
              </div>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex gap-4">
            <div className="flex-1 min-w-0">
              <div className="text-muted-foreground text-sm line-clamp-2 overflow-hidden leading-relaxed">
                <MarkdownRenderer content={post.content} />
              </div>
            </div>
            {post.imageUrl && (
              <div className="flex-shrink-0">
                <Image
                  src={post.imageUrl}
                  alt="Post preview"
                  width={72}
                  height={72}
                  className="rounded-lg object-cover border border-border"
                  unoptimized
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

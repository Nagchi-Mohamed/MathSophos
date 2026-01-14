"use client"
import MarkdownRenderer from "@/components/markdown-renderer"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MessageSquare, Image as ImageIcon } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"
import Link from "next/link"
import Image from "next/image"
import { useEffect, useRef } from "react"

interface ForumPostCardProps {
  post: any
}

export function ForumPostCard({ post }: ForumPostCardProps) {
  const contentRef = useRef<HTMLDivElement>(null)

  // Removed manual MathJax effect

  // Removed getPreviewText

  return (
    <div
      className="cursor-pointer"
      onClick={() => window.location.href = `/forum/${post.id}`}
    >
      <Card className="hover:bg-muted/50 transition-colors">
        <CardHeader className="flex flex-row items-start gap-4 space-y-0">
          <Avatar>
            <AvatarFallback>{post.user?.name?.[0] || "U"}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-lg text-primary">{post.title}</CardTitle>
            <CardDescription className="mt-1">
              Par <span className="font-medium text-foreground">{post.user?.name || "Anonyme"}</span> • {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: fr })}
            </CardDescription>
          </div>
          <div className="flex items-center gap-3 text-muted-foreground">
            {post.imageUrl && (
              <div className="flex items-center gap-1">
                <ImageIcon className="h-4 w-4" />
              </div>
            )}
            <div className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              <span className="text-sm">{post.replies?.length || 0}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div
                className="text-muted-foreground line-clamp-3 h-[4.5em] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <MarkdownRenderer content={post.content} />
              </div>
            </div>
            {post.imageUrl && (
              <div className="flex-shrink-0">
                <Image
                  src={post.imageUrl}
                  alt="Post preview"
                  width={80}
                  height={80}
                  className="rounded object-cover"
                  unoptimized
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

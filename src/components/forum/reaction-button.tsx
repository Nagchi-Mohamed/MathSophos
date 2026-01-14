"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toggleReaction } from "@/actions/forum"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface ReactionButtonProps {
  postId?: string
  replyId?: string
  reactions?: Array<{ emoji: string; userId: string; id: string }>
  currentUserId?: string
}

const EMOJIS = ["👍", "❤️", "😊", "🎉", "🤔", "👏"]

export function ReactionButton({ postId, replyId, reactions = [], currentUserId }: ReactionButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const handleReaction = async (emoji: string) => {
    try {
      const result = await toggleReaction({ postId, replyId, emoji })
      if (result.success) {
        router.refresh()
      } else {
        toast.error(result.error || "Erreur lors de la réaction")
      }
    } catch (error) {
      toast.error("Erreur inattendue")
    }
  }

  // Group reactions by emoji
  const groupedReactions = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = []
    }
    acc[reaction.emoji].push(reaction)
    return acc
  }, {} as Record<string, typeof reactions>)

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Display existing reactions */}
      {Object.entries(groupedReactions).map(([emoji, reactionList]) => {
        const hasReacted = currentUserId && reactionList.some(r => r.userId === currentUserId)
        return (
          <Button
            key={emoji}
            variant={hasReacted ? "default" : "outline"}
            size="sm"
            className="h-8 px-2 gap-1"
            onClick={() => handleReaction(emoji)}
          >
            <span className="text-base">{emoji}</span>
            <span className="text-xs">{reactionList.length}</span>
          </Button>
        )
      })}

      {/* Add reaction button */}
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="text-base">😊+</span>
        </Button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute bottom-full left-0 mb-2 p-2 bg-white dark:bg-gray-800 border rounded-lg shadow-lg z-20 flex gap-1">
              {EMOJIS.map(emoji => (
                <Button
                  key={emoji}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-xl hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => {
                    handleReaction(emoji)
                    setIsOpen(false)
                  }}
                >
                  {emoji}
                </Button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

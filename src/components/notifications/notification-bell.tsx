"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Bell, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { getPublicAnnouncements } from "@/actions/announcement-actions"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { MarkdownRenderer } from "@/components/markdown-renderer"

interface Announcement {
  id: string
  title: string
  content: string
  createdAt: Date
}

export function NotificationBell() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  const loadAnnouncements = async () => {
    const result = await getPublicAnnouncements()
    if (result.data) {
      // Logic: 
      // 1. Get read IDs from local storage
      // 2. Filter out read IDs
      // 3. BUT keep the latest one even if read IF we want 'last one stay', 
      //    Wait, user said "only the last one stay untill an other anonce came"
      //    This implies: Show all unread. If all are read, show ONLY the absolute latest.

      const readIds = JSON.parse(localStorage.getItem("mathsophos-read-announcements") || "[]")

      const unread = result.data.filter((a: any) => !readIds.includes(a.id))
      setUnreadCount(unread.length)

      // For display: Show all unread + the latest one (even if read) to ensure list isn't empty
      // actually, "only the last one stay" implies cleaning up the view.

      if (unread.length > 0) {
        setAnnouncements(result.data as any)
      } else if (result.data.length > 0) {
        // Show only the latest one
        setAnnouncements([result.data[0]] as any)
      } else {
        setAnnouncements([])
      }
    }
  }

  const pathname = usePathname()

  useEffect(() => {
    loadAnnouncements()
    // Poll every 60s
    const interval = setInterval(loadAnnouncements, 60000)
    return () => clearInterval(interval)
  }, [pathname])

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      // When closing, mark currently displayed as read
      const readIds = JSON.parse(localStorage.getItem("mathsophos-read-announcements") || "[]")
      const newReadIds = [...readIds]

      announcements.forEach(a => {
        if (!newReadIds.includes(a.id)) {
          newReadIds.push(a.id)
        }
      })

      localStorage.setItem("mathsophos-read-announcements", JSON.stringify(newReadIds))
      setUnreadCount(0)

      // Update display list for next open (only keep latest)
      if (announcements.length > 0) {
        // Find absolute latest from current list
        // Assuming list is ordered desc
        const latest = announcements[0]
        setAnnouncements([latest])
      }
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-lg hover:bg-primary/10">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 hover:bg-red-600 rounded-full text-[10px]"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="p-4 border-b">
          <h4 className="font-semibold leading-none">Annonces</h4>
        </div>
        <ScrollArea className="h-[300px]">
          {announcements.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Aucune annonce pour le moment
            </div>
          ) : (
            <div className="divide-y">
              {announcements.map((announcement) => (
                <div key={announcement.id} className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <h5 className="font-medium text-sm">{announcement.title}</h5>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {new Date(announcement.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground leading-snug">
                    <MarkdownRenderer
                      content={announcement.content}
                      className="text-sm prose dark:prose-invert prose-p:my-0 prose-p:leading-snug max-w-none [&_p]:mb-1 [&_.video-trigger]:scale-90 [&_.video-trigger]:origin-left [&_.video-trigger]:my-2"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}

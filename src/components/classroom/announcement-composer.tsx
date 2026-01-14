"use client";

import { useTransition, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { createAnnouncement } from "@/actions/classroom";
import { Send, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

interface AnnouncementComposerProps {
  classroomId: string;
}

export function AnnouncementComposer({ classroomId }: AnnouncementComposerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const { data: session } = useSession();

  const handlePost = () => {
    if (!content.trim()) return;

    startTransition(async () => {
      try {
        await createAnnouncement(classroomId, content);
        setContent("");
        setIsExpanded(false);
        toast.success("Publié avec succès");
      } catch (error) {
        toast.error("Échec de la publication");
        console.error(error);
      }
    });
  };

  return (
    <Card className={`mb-6 transition-all duration-200 ${isExpanded ? "shadow-md ring-1 ring-blue-100 dark:ring-blue-900" : "shadow-sm"}`}>
      <CardContent className="p-4">
        {isExpanded ? (
          <div className="space-y-4">
            <Textarea
              placeholder="Annoncer quelque chose à votre classe"
              className="resize-none min-h-[120px] bg-transparent border-none focus-visible:ring-0 p-0 text-base"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              autoFocus
            />
            <div className="flex justify-between items-center pt-2 border-t dark:border-zinc-800">
              <div className="flex gap-2 text-muted-foreground text-sm">
                {/* Attachments placeholder */}
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setIsExpanded(false)} disabled={isPending}>
                  Annuler
                </Button>
                <Button onClick={handlePost} disabled={isPending || !content.trim()}>
                  {isPending ? "Publication..." : <><Send className="w-4 h-4 mr-2" /> Publier</>}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="flex items-center gap-4 cursor-text"
            onClick={() => setIsExpanded(true)}
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={session?.user?.image || ""} />
              <AvatarFallback><UserIcon className="w-5 h-5" /></AvatarFallback>
            </Avatar>
            <div className="flex-1 text-muted-foreground hover:bg-zinc-50 dark:hover:bg-zinc-800/50 p-3 rounded-md transition-colors text-sm">
              Annoncer quelque chose à votre classe...
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

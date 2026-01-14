import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Announcement {
  id: string;
  content: string;
  createdAt: Date;
  author: {
    name: string | null;
    image: string | null;
  };
}

interface StreamFeedProps {
  announcements: Announcement[];
  currentUserId: string;
}

export function StreamFeed({ announcements }: StreamFeedProps) {
  if (announcements.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
        <p>Aucune annonce pour le moment.</p>
        <p className="text-sm">Communiquez avec votre classe ici</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {announcements.map((post) => (
        <Card key={post.id}>
          <CardHeader className="flex flex-row items-start space-y-0 pb-2">
            <div className="flex items-center gap-3 flex-1">
              <Avatar>
                <AvatarImage src={post.author.image || ""} />
                <AvatarFallback>{post.author.name?.[0] || "?"}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold text-sm">{post.author.name}</div>
                <div className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: fr })}
                </div>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="-mr-2 h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Copier le lien</DropdownMenuItem>
                {/* Add Edit/Delete based on permissions */}
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="whitespace-pre-wrap text-sm">{post.content}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}


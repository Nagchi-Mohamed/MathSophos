import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";
import { Calendar, FileText } from "lucide-react";

interface AssignmentCardProps {
  id: string;
  title: string;
  dueDate: Date | null;
  classroomId: string; // Add classroomId prop
}

export function AssignmentCard({ id, title, dueDate, classroomId }: AssignmentCardProps) {
  return (
    <Card className="hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
      <CardHeader className="py-4">
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base">
                <Link href={`/classrooms/assignments/${id}`} className="hover:underline focus:outline-none">
                  {title}
                  {/* Make the whole card clickable or just the title? Better UX to link title */}
                  <span className="absolute inset-0" aria-hidden="true" />
                </Link>
              </CardTitle>
              <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                {dueDate ? (
                  <>
                    <Calendar className="w-3 h-3" /> Due {format(new Date(dueDate), "MMM d, yyyy")}
                  </>
                ) : "No due date"}
              </div>
            </div>
          </div>
          {/* Status Badge can go here later */}
        </div>
      </CardHeader>
    </Card>
  );
}

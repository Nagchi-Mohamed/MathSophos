import { getClassroom } from "@/actions/classroom";
import { AnnouncementComposer } from "@/components/classroom/announcement-composer";
import { StreamFeed } from "@/components/classroom/stream-feed";
import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import { ClassroomNav } from "@/components/classroom/classroom-nav";
import { ClassroomHeader } from "@/components/classroom/classroom-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Info } from "lucide-react";
import Link from "next/link";

interface ClassroomPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ClassroomStreamPage(props: ClassroomPageProps) {
  const params = await props.params;
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  const classroom = await getClassroom(params.id);

  if (!classroom) {
    return notFound();
  }

  return (
    <div className="flex-1 space-y-6 pt-6 px-4 md:px-8 max-w-5xl mx-auto">
      <ClassroomHeader classroom={classroom} />

      <ClassroomNav classroomId={params.id} />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar Info */}
        <div className="hidden md:block space-y-4">
          {classroom.currentUserRole === "TEACHER" && (
            <Card className="border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-shadow animate-in slide-in-from-left-4 duration-500 delay-100">
              <CardContent className="p-5">
                <div className="text-sm font-semibold mb-2 text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  Class Code
                </div>
                <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800">
                  <div className="text-3xl font-mono font-bold text-blue-600 dark:text-blue-400 select-all tracking-wider">
                    {classroom.code}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                  Share this code with your students to allow them to join this class.
                </p>
              </CardContent>
            </Card>
          )}

          <Card className="shadow-md hover:shadow-lg transition-shadow animate-in slide-in-from-left-4 duration-500 delay-200">
            <CardContent className="p-5">
              <h3 className="font-semibold mb-3 flex items-center justify-between">
                <span>Upcoming</span>
                <span className="text-xs font-normal text-muted-foreground">View all</span>
              </h3>
              <div className="py-6 text-center">
                <p className="text-sm text-zinc-400 italic">No work due soon</p>
              </div>
              <Link href={`/classrooms/${params.id}/assignments`} className="block w-full text-center py-2 text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded transition-colors">
                View Function
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Main Feed */}
        <div className="md:col-span-3 pb-12">
          <AnnouncementComposer classroomId={classroom.id} />
          <StreamFeed
            announcements={classroom.announcements}
            currentUserId={session.user.id!}
          />
        </div>
      </div>
    </div >
  );
}

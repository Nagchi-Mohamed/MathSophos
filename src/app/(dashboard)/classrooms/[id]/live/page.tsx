import { getClassroom } from "@/actions/classroom";
import { auth } from "@/auth";
import { ClassroomNav } from "@/components/classroom/classroom-nav";
import { LiveSession } from "@/components/classroom/live-session";
import { Badge } from "@/components/ui/badge";
import { notFound, redirect } from "next/navigation";
import { Info, Video } from "lucide-react";
import { MathSophosIcon } from "@/components/ui/math-sophos-logo";

interface LivePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function LiveClassPage(props: LivePageProps) {
  const params = await props.params;
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  const classroom = await getClassroom(params.id);

  if (!classroom) {
    notFound();
  }

  const roomName = classroom.id;

  return (
    <div className="max-w-[1600px] mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-6 space-y-3 sm:space-y-4">

      {/* Navigation Header */}
      <ClassroomNav classroomId={params.id} />

      {/* Live Session Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 bg-white dark:bg-zinc-900 p-3 sm:p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 sm:p-2.5 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border border-red-200/50 dark:border-red-900/40 flex items-center justify-center shrink-0">
            <Video className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-xl font-bold text-foreground tracking-tight">
                Session Visioconférence HD
              </h1>
              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-extrabold uppercase px-2 py-0.5 shrink-0">
                En Direct
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              <span className="font-semibold text-foreground">{classroom.name}</span>
              {classroom.subject && <span className="hidden sm:inline"> • {classroom.subject}</span>}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-zinc-100 dark:bg-zinc-800/60 px-2.5 sm:px-3.5 py-2 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 shrink-0">
          <MathSophosIcon size={16} />
          <span className="truncate max-w-[180px] sm:max-w-none">
            <strong className="text-foreground">{session.user.name}</strong>
            <span className="hidden sm:inline"> — {classroom.currentUserRole === "TEACHER" ? "Enseignant" : "Élève"}</span>
          </span>
        </div>
      </div>

      {/* Video Canvas */}
      <div className="rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-zinc-800 bg-black">
        <LiveSession
          roomName={roomName}
          userName={session.user.name || "Participant"}
          userEmail={session.user.email}
          isTeacher={classroom.currentUserRole === "TEACHER"}
        />
      </div>

      {/* Permissions Info */}
      <div className="flex items-start sm:items-center gap-2.5 bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 p-3 sm:p-4 rounded-xl sm:rounded-2xl text-xs text-blue-900 dark:text-blue-200">
        <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5 sm:mt-0" />
        <div>
          <strong>Conseil :</strong> Autorisez l'accès à la caméra et au microphone dans votre navigateur pour participer pleinement à la session.
        </div>
      </div>
    </div>
  );
}

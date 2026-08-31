import { getClassroom } from "@/actions/classroom";
import { auth } from "@/auth";
import { ClassroomNav } from "@/components/classroom/classroom-nav";
import { LiveSession } from "@/components/classroom/live-session";
import { Badge } from "@/components/ui/badge";
import { notFound, redirect } from "next/navigation";
import { ShieldCheck, Info, Sparkles, Video } from "lucide-react";
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

  // Sanitize ID for room name
  const roomName = classroom.id;

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-6 space-y-6">
      {/* Navigation Header */}
      <ClassroomNav classroomId={params.id} />

      {/* Main Video Room Container */}
      <div className="space-y-4">
        {/* Live Session Title Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border border-red-200/50 dark:border-red-900/40 flex items-center justify-center shrink-0">
              <Video className="w-5 h-5 animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-foreground tracking-tight">
                  Session Visioconférence HD
                </h1>
                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-extrabold uppercase px-2 py-0.5">
                  En Direct
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Classe: <span className="font-semibold text-foreground">{classroom.name}</span>
                {classroom.subject && <span> • {classroom.subject}</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground bg-zinc-100 dark:bg-zinc-800/60 px-3.5 py-2 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60">
            <MathSophosIcon size={18} />
            <span>Connecté: <strong className="text-foreground">{session.user.name}</strong> ({classroom.currentUserRole === "TEACHER" ? "Enseignant" : "Élève"})</span>
          </div>
        </div>

        {/* Video Canvas Container */}
        <div className="rounded-3xl overflow-hidden shadow-2xl border border-zinc-800 bg-black min-h-[600px]">
          <LiveSession
            roomName={roomName}
            userName={session.user.name || "Participant"}
            userEmail={session.user.email}
            isTeacher={classroom.currentUserRole === "TEACHER"}
          />
        </div>

        {/* Camera/Mic Permissions Info Box */}
        <div className="flex items-center gap-3 bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 p-4 rounded-2xl text-xs text-blue-900 dark:text-blue-200 shadow-xs">
          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <div>
            <strong>Conseil Visioconférence :</strong> Assurez-vous d'avoir autorisé l'accès à la caméra et au microphone dans les paramètres de votre navigateur pour une expérience fluide.
          </div>
        </div>
      </div>
    </div>
  );
}

import { getClassroom } from "@/actions/classroom";
import { auth } from "@/auth";
import { ClassroomNav } from "@/components/classroom/classroom-nav";
import { LiveSession } from "@/components/classroom/live-session";
import { Badge } from "@/components/ui/badge";
import { notFound, redirect } from "next/navigation";

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
    <div className="max-w-[1600px] mx-auto p-4 md:p-6 pt-6">
      <ClassroomNav classroomId={params.id} />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              Session en direct
            </h1>
            <Badge variant="outline" className="text-xs font-normal py-1">
              {classroom.name}
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground hidden md:block">
            Connecté en tant que <span className="font-semibold text-foreground">{session.user.name}</span>
          </p>
        </div>

        <LiveSession
          roomName={roomName}
          userName={session.user.name || "Student"}
          userEmail={session.user.email}
          isTeacher={classroom.currentUserRole === "TEACHER"}
        />

        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 p-4 rounded-lg text-sm text-amber-800 dark:text-amber-200">
          <strong>Note :</strong> Assurez-vous que les autorisations de votre caméra et microphone sont activées dans votre navigateur.
        </div>
      </div>
    </div>
  );
}

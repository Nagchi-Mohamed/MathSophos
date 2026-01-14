import { getClassroom } from "@/actions/classroom";
import { ClassroomNav } from "@/components/classroom/classroom-nav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Mail } from "lucide-react";
import { notFound } from "next/navigation";

interface PeoplePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PeoplePage(props: PeoplePageProps) {
  const params = await props.params;
  const classroom = await getClassroom(params.id);

  if (!classroom) {
    notFound();
  }

  // Filter members by role
  // Note: owner is separate in the classroom object, members array contains joiners 
  // We need to verify if owner is also in members list or if we should reconstruct
  // Based on createClassroom action: members create userId: ownerId, role: TEACHER.
  // So owner IS in members list.

  const teachers = classroom.members.filter((m) => m.role === "TEACHER");
  const students = classroom.members.filter((m) => m.role === "STUDENT");

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 pt-6">
      <ClassroomNav classroomId={params.id} />

      <div className="space-y-10 max-w-3xl mx-auto">
        {/* Teachers Section */}
        <section>
          <div className="flex items-center justify-between mb-4 px-4">
            <h2 className="text-3xl font-medium text-blue-600 dark:text-blue-400">Teachers</h2>
          </div>
          <Separator className="bg-blue-600 dark:bg-blue-400 mb-4 h-0.5" />

          <div className="space-y-1">
            {teachers.map((teacher) => (
              <div key={teacher.id} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-zinc-900 rounded-lg transition-colors">
                <div className="flex items-center gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={teacher.user.image || ""} />
                    <AvatarFallback>{teacher.user.name?.[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{teacher.user.name}</span>
                </div>
                <a href={`mailto:${teacher.user.email}`} className="text-muted-foreground hover:text-foreground">
                  <Mail className="h-5 w-5" />
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* Students Section */}
        <section>
          <div className="flex items-center justify-between mb-4 px-4">
            <h2 className="text-3xl font-medium text-blue-600 dark:text-blue-400">Classmates</h2>
            <span className="text-sm text-muted-foreground font-medium">{students.length} students</span>
          </div>
          <Separator className="bg-blue-600 dark:bg-blue-400 mb-4 h-0.5" />

          <div className="space-y-1">
            {students.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground italic">
                No students yet. Share the class code <strong>{classroom.code}</strong> to invite them.
              </div>
            ) : (
              students.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-zinc-900 rounded-lg transition-colors border-b last:border-0 border-border/40">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={student.user.image || ""} />
                      <AvatarFallback>{student.user.name?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{student.user.name}</span>
                  </div>
                  <a href={`mailto:${student.user.email}`} className="text-muted-foreground hover:text-foreground">
                    <Mail className="h-5 w-5" />
                  </a>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

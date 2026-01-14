import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { AssignmentList } from "@/components/classroom/assignments/assignment-list";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { ClassroomNav } from "@/components/classroom/classroom-nav";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AssignmentsIndexPage(props: PageProps) {
  const params = await props.params;
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const classroom = await db.classroom.findUnique({
    where: { id: params.id },
    include: {
      members: {
        where: { userId: session.user.id }
      },
      assignments: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!classroom || !classroom.members.length) notFound();

  const isTeacher = classroom.members[0].role === "TEACHER";

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Classwork</h1>
          <p className="text-muted-foreground">Assignments and materials for {classroom.name}</p>
        </div>
        {isTeacher && (
          <Link href={`/classrooms/${params.id}/assignments/create`}>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Assignment
            </Button>
          </Link>
        )}
      </div>

      <ClassroomNav classroomId={params.id} />

      <AssignmentList
        assignments={classroom.assignments}
        classroomId={params.id}
      />
    </div>
  );
}

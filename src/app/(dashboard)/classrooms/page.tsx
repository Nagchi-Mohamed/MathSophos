import { Suspense } from "react";
import { getUserClassrooms } from "@/actions/classroom";
import { ClassroomCard } from "@/components/classroom/classroom-card";
import { CreateClassroomDialog } from "@/components/classroom/create-dialog";
import { JoinClassroomDialog } from "@/components/classroom/join-dialog";
import { Separator } from "@/components/ui/separator";
import { GraduationCap, BookOpen, Users, School, Plus } from "lucide-react";

export const metadata = {
  title: "Classroom | MathSophos",
  description: "Manage your classes and assignments",
};

export default async function ClassroomPage() {
  const classrooms = await getUserClassrooms();

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 min-h-[calc(100vh-4rem)] bg-[url('/patterns/grid.svg')] bg-fixed bg-center">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            Classes
          </h1>
          <p className="text-gray-400 mt-1">
            Gérez vos cours, devoirs et notes.
          </p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <JoinClassroomDialog />
          <CreateClassroomDialog />
        </div>
      </div>

      {classrooms.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 border border-dashed border-gray-800 rounded-3xl bg-gray-900/30">
          <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mb-6 relative group">
            <School className="w-10 h-10 text-gray-400 group-hover:text-blue-400 transition-colors" />
            <Plus className="w-4 h-4 text-gray-500 absolute bottom-2 right-2" />
          </div>
          <h3 className="text-xl font-semibold text-gray-200 mb-2">Aucune classe pour le moment</h3>
          <p className="text-gray-400 text-center max-w-md mb-8 leading-relaxed">
            Commencez par rejoindre une classe avec un code fourni par votre enseignant, ou créez la vôtre si vous êtes enseignant.
          </p>
          <div className="flex gap-4">
            <JoinClassroomDialog />
            <CreateClassroomDialog />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classrooms.map((classroom) => (
            <ClassroomCard
              key={classroom.id}
              id={classroom.id}
              name={classroom.name}
              section={classroom.section}
              subject={classroom.subject}
              owner={classroom.owner}
              memberCount={classroom._count.members}
              role={classroom.role}
              createdAt={classroom.createdAt}
            />
          ))}
        </div>
      )}
    </div>
  );
}

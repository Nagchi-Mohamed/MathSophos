import { getUserClassrooms } from "@/actions/classroom";
import { ClassroomDashboardClient } from "@/components/classroom/classroom-dashboard-client";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Espace Classes & Direct | MathSophos",
  description: "Gérez vos classes, participez aux visioconférences en direct et échangez des cours et devoirs sur MathSophos.",
};

export default async function ClassroomPage() {
  const classrooms = await getUserClassrooms();

  return (
    <div className="flex-1 min-h-[calc(100vh-4rem)] p-4 sm:p-6 md:p-8 bg-gray-50/50 dark:bg-zinc-950/80">
      <ClassroomDashboardClient classrooms={classrooms} />
    </div>
  );
}

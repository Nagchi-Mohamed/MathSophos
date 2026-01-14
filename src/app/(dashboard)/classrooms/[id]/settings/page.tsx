import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import { getClassroom } from "@/actions/classroom";
import { ClassroomNav } from "@/components/classroom/classroom-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface SettingsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ClassroomSettingsPage(props: SettingsPageProps) {
  const params = await props.params;
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  const classroom = await getClassroom(params.id);

  if (!classroom) {
    notFound();
  }

  // Only teachers can access settings
  if (classroom.currentUserRole !== "TEACHER") {
    redirect(`/classrooms/${params.id}`);
  }

  return (
    <div className="flex-1 space-y-6 pt-6 px-4 md:px-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/classrooms/${params.id}`}>
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Paramètres de la classe</h1>
          <p className="text-muted-foreground">Gérez les détails et les préférences de votre classe.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations générales</CardTitle>
          <CardDescription>Mettez à jour les informations de base de votre classe.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nom de la classe</Label>
            <Input id="name" defaultValue={classroom.name} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="section">Section</Label>
            <Input id="section" defaultValue={classroom.section || ""} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="subject">Matière</Label>
            <Input id="subject" defaultValue={classroom.subject || ""} />
          </div>
          <div className="flex justify-end mt-4">
            <Button>Enregistrer les modifications</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-red-200 dark:border-red-900">
        <CardHeader>
          <CardTitle className="text-red-600 dark:text-red-400">Zone de danger</CardTitle>
          <CardDescription>Actions irréversibles.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-red-100 dark:border-red-900/50 rounded-lg bg-red-50 dark:bg-red-900/10">
            <div>
              <h4 className="font-semibold text-red-700 dark:text-red-400">Archiver la classe</h4>
              <p className="text-sm text-red-600/80 dark:text-red-400/70">L'archivage masquera cette classe de votre liste active.</p>
            </div>
            <Button variant="destructive">Archiver</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

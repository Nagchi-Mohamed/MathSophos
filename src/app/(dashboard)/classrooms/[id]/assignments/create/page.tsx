"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createAssignment } from "@/actions/classroom";
import { toast } from "sonner";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function CreateAssignmentPage() {
  const params = useParams(); // Using client hook or can access from props in server component if we move logic up
  // Better to keep as Client Component for form handling convenience, params.id is classroomId
  const classroomId = params.id as string;

  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function onSubmit(formData: FormData) {
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const pointsStr = formData.get("points") as string;
    const dueDateStr = formData.get("dueDate") as string;

    const points = pointsStr ? parseInt(pointsStr) : 100;
    const dueDate = dueDateStr ? new Date(dueDateStr) : undefined;

    startTransition(async () => {
      try {
        await createAssignment(classroomId, {
          title,
          description,
          points,
          dueDate,
        });
        toast.success("Assignment created!");
        router.push(`/classrooms/${classroomId}`);
      } catch (error) {
        toast.error("Failed to create assignment");
      }
    });
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <Link href={`/classrooms/${classroomId}`} className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
        <ChevronLeft className="w-4 h-4 mr-1" /> Back to Class
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Create Assignment</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={onSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" required placeholder="Homework 1" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Instructions</Label>
              <Textarea id="description" name="description" placeholder="Explain the task..." className="min-h-[150px]" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="points">Points</Label>
                <Input id="points" name="points" type="number" defaultValue={100} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input id="dueDate" name="dueDate" type="datetime-local" />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Creating..." : "Assign"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

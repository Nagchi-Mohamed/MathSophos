import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import { getAssignment, getAssignmentSubmissions } from "@/actions/classroom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SubmissionForm } from "@/components/classroom/assignments/submission-form";
import { GradingDialog } from "@/components/classroom/assignments/grading-view";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { Calendar, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface PageProps {
  params: Promise<{
    id: string;
    assignmentId: string;
  }>;
}

export default async function AssignmentPage(props: PageProps) {
  const params = await props.params;
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const assignment = await getAssignment(params.assignmentId);
  if (!assignment) notFound();

  const isTeacher = assignment.currentUserRole === "TEACHER";

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Link href={`/classrooms/${params.id}`} className="text-sm hover:underline text-muted-foreground">
            &larr; Back to Stream
          </Link>
          {isTeacher && (
            <Badge variant="outline">Teacher View</Badge>
          )}
        </div>

        <div>
          <h1 className="text-3xl font-bold">{assignment.title}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
            {assignment.dueDate && (
              <span className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                Due {format(new Date(assignment.dueDate), "PPP p")}
              </span>
            )}
            <span className="flex items-center">
              <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-xs font-normal">
                {assignment.points} Points
              </Badge>
            </span>
          </div>
        </div>

        <Card className="bg-zinc-50 dark:bg-zinc-900 border-dashed">
          <CardContent className="pt-6">
            <div className="prose dark:prose-invert max-w-none whitespace-pre-line">
              {assignment.description || "No instructions provided."}
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {isTeacher ? (
        <TeacherView
          assignmentId={assignment.id}
          classroomId={params.id}
        />
      ) : (
        <StudentView
          assignmentId={assignment.id}
          submission={assignment.currentUserSubmission}
        />
      )}
    </div>
  );
}

// Sub-component for Teacher View (Submissions List)
async function TeacherView({ assignmentId, classroomId }: { assignmentId: string, classroomId: string }) {
  const submissions = await getAssignmentSubmissions(assignmentId);

  // Calculate stats
  const total = submissions.length;
  const graded = submissions.filter(s => s.status === "GRADED").length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Student Submissions</h2>
        <div className="text-sm text-muted-foreground">
          {graded} of {total} graded
        </div>
      </div>

      <div className="grid gap-4">
        {submissions.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">No submissions yet.</CardContent></Card>
        ) : (
          submissions.map(sub => (
            <div key={sub.id} className="flex items-center justify-between p-4 border rounded-lg bg-card">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={sub.student.image || ""} />
                  <AvatarFallback>{sub.student.name?.[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{sub.student.name}</div>
                  <div className="text-xs text-muted-foreground">
                    Submitted {format(new Date(sub.submittedAt), "MMM d, p")}
                  </div>
                  {sub.content && (
                    <div className="mt-1 text-sm bg-muted/50 p-2 rounded max-w-lg truncate">
                      {sub.content}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                {sub.status === "GRADED" && (
                  <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 dark:bg-green-900/20">
                    {sub.grade}/100
                  </Badge>
                )}
                <GradingDialog
                  submissionId={sub.id}
                  studentName={sub.student.name || "Student"}
                  currentGrade={sub.grade}
                  currentFeedback={sub.feedback}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Sub-component for Student View (Submission Form)
function StudentView({ assignmentId, submission }: { assignmentId: string, submission: any }) {
  return (
    <div className="max-w-xl">
      <SubmissionForm
        assignmentId={assignmentId}
        existingSubmission={submission}
      />
    </div>
  );
}

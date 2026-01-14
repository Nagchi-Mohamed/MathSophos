"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { submitAssignment } from "@/actions/classroom";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";

interface SubmissionFormProps {
  assignmentId: string;
  existingSubmission: {
    content: string | null;
    status: string;
    grade: number | null;
    feedback: string | null;
  } | null;
}

export function SubmissionForm({ assignmentId, existingSubmission }: SubmissionFormProps) {
  const [content, setContent] = useState(existingSubmission?.content || "");
  const [isPending, startTransition] = useTransition();

  const isGraded = existingSubmission?.status === "GRADED";
  const isSubmitted = existingSubmission?.status === "SUBMITTED" || isGraded;

  const handleSubmit = () => {
    startTransition(async () => {
      try {
        await submitAssignment(assignmentId, content);
        toast.success("Assignment submitted successfully!");
      } catch (error) {
        toast.error("Failed to submit assignment");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Your Work</CardTitle>
          {isSubmitted && (
            <Badge variant={isGraded ? "default" : "secondary"}>
              {isGraded ? `Graded: ${existingSubmission.grade}/100` : "Submitted"}
            </Badge>
          )}
        </div>
        {isGraded && existingSubmission.feedback && (
          <div className="mt-2 p-3 bg-muted rounded-md text-sm">
            <span className="font-semibold">Feedback:</span> {existingSubmission.feedback}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {isMainThread() ? (
          <p className="text-muted-foreground">You have already submitted this assignment.</p>
        ) : (
          <Textarea
            placeholder="Type your answer here or paste a link..."
            className="min-h-[150px]"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isPending || isGraded}
          />
        )}

        <div className="flex justify-end">
          {isSubmitted ? (
            isGraded ? (
              <Button disabled variant="outline" className="w-full sm:w-auto">
                <CheckCircle className="w-4 h-4 mr-2" />
                Graded
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isPending} variant="secondary" className="w-full sm:w-auto">
                {isPending ? "Updating..." : "Resubmit"}
              </Button>
            )
          ) : (
            <Button onClick={handleSubmit} disabled={isPending} className="w-full sm:w-auto">
              {isPending ? "Submitting..." : "Turn In"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  function isMainThread() {
    return false; // Helper placeholder
  }
}

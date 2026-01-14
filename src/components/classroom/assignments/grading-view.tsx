"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { gradeSubmission } from "@/actions/classroom";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface GradingDialogProps {
  submissionId: string;
  studentName: string;
  currentGrade?: number | null;
  currentFeedback?: string | null;
}

export function GradingDialog({ submissionId, studentName, currentGrade, currentFeedback }: GradingDialogProps) {
  const [open, setOpen] = useState(false);
  const [grade, setGrade] = useState(currentGrade?.toString() || "");
  const [feedback, setFeedback] = useState(currentFeedback || "");
  const [isPending, startTransition] = useTransition();

  const handleGrade = () => {
    startTransition(async () => {
      try {
        await gradeSubmission(submissionId, parseInt(grade), feedback);
        toast.success("Grade saved");
        setOpen(false);
      } catch (error) {
        toast.error("Failed to save grade");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant={currentGrade ? "outline" : "default"}>
          {currentGrade ? "Update Grade" : "Grade"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Grade Submission</DialogTitle>
          <DialogDescription>
            Grading work for {studentName}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-right text-sm font-medium">Score</label>
            <Input
              type="number"
              max={100}
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-right text-sm font-medium">Feedback</label>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="col-span-3"
              placeholder="Great job!"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleGrade} disabled={isPending}>
            {isPending ? "Saving..." : "Save Grade"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

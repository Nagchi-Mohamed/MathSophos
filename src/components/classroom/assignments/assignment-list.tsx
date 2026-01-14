"use client";

import { AssignmentCard } from "./assignment-card";

interface Assignment {
  id: string;
  title: string;
  dueDate: Date | null;
}

interface AssignmentListProps {
  assignments: Assignment[];
  classroomId: string; // Add classroomId prop
}

export function AssignmentList({ assignments, classroomId }: AssignmentListProps) {
  if (assignments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed bg-zinc-50 dark:bg-zinc-900/50">
        <p>No assignments yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {assignments.map((assignment) => (
        <AssignmentCard
          key={assignment.id}
          id={assignment.id}
          title={assignment.title}
          dueDate={assignment.dueDate}
          classroomId={classroomId}
        />
      ))}
    </div>
  );
}

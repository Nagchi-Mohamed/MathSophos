"use server";

import { revalidatePath } from "next/cache";

export async function uploadLessonFile(formData: FormData) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/upload/lesson`, {
    method: "POST",
    body: formData,
  });
  const data = await res.json();
  if (data.success) {
    revalidatePath("/admin/lessons");
  }
  return data;
}

export async function uploadExerciseCorrection(formData: FormData) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/upload/exercise-correction`,
    {
      method: "POST",
      body: formData,
    }
  );
  const data = await res.json();
  if (data.success) {
    revalidatePath("/admin/exercises");
  }
  return data;
}

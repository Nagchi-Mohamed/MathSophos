/**
 * Get the professor name from environment variable
 * Falls back to a default if not set
 */
export function getProfessorName(): string {
  return process.env.NEXT_PUBLIC_PROFESSOR_NAME || "Prof:Mohamed Nagchi";
}

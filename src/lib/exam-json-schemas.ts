/**
 * JSON Schema definitions and validators for Exams and Controls
 * Uses Zod for runtime validation and type inference
 */

import { z } from "zod"

// ============================================================================
// Base Schemas
// ============================================================================

/**
 * Duration format: "1h", "1h30min", "2h20min", "55min", etc.
 */
const DurationSchema = z.string().regex(
  /^\d+h(\d+min)?$|^\d+min$/,
  "Duration must be in format: 1h, 1h30min, 2h20min, or 55min"
)

/**
 * Educational metadata common to all content types
 */
const EducationalMetadataSchema = z.object({
  cycle: z.enum(["COLLEGE", "LYCEE", "SUPERIEUR"]).optional(),
  level: z.string().optional(),
  stream: z.string().optional(),
  semester: z.number().int().min(1).max(2).optional(),
})

// ============================================================================
// Exercise Schemas
// ============================================================================

/**
 * Sub-question within an exercise (optional, for detailed breakdown)
 */
const SubQuestionSchema = z.object({
  label: z.string().describe("Question label (e.g., 'a)', 'b)', '1.', '2.')"),
  question: z.string().describe("Question text with LaTeX support"),
  points: z.number().positive().describe("Points for this sub-question"),
})

/**
 * Exercise within an exam or control
 */
const ExamExerciseSchema = z.object({
  title: z.string().min(1, "Exercise title is required"),
  problem: z.string().min(1, "Exercise problem is required"),
  solution: z.string().min(1, "Exercise solution is required"),
  points: z.number().positive("Points must be greater than 0"),
  spaceLines: z.number().int().min(0).optional().describe("Number of lines for answer space"),
  subQuestions: z.array(SubQuestionSchema).optional().describe("Optional detailed breakdown of sub-questions"),
  lessonId: z.string().optional().describe("Associated lesson ID (for controls)"),
})

// ============================================================================
// Exam Schema
// ============================================================================

/**
 * Exam metadata specific to exams (not controls)
 */
const ExamMetadataSchema = EducationalMetadataSchema.extend({
  type: z.literal("EXAM"),
  examType: z.enum(["NATIONAL", "REGIONAL", "LOCAL"]).optional(),
  lessons: z.array(z.object({
    id: z.string(),
    title: z.string(),
    points: z.number().positive(),
  })).optional().describe("Lessons covered in the exam"),
})

/**
 * Complete Exam JSON structure
 */
export const ExamJsonSchema = z.object({
  title: z.string().min(1, "Exam title is required"),
  subtitle: z.string().optional(),
  duration: DurationSchema,
  instructions: z.string().optional().describe("General instructions for students (Moroccan format)"),
  totalPoints: z.number().positive("Total points must be greater than 0"),
  metadata: ExamMetadataSchema.optional(),
  exercises: z.array(ExamExerciseSchema).min(1, "At least one exercise is required"),
}).refine(
  (data) => {
    // Validate that sum of exercise points equals totalPoints
    const sum = data.exercises.reduce((acc, ex) => acc + ex.points, 0)
    return Math.abs(sum - data.totalPoints) < 0.01 // Allow small floating point differences
  },
  {
    message: "Sum of exercise points must equal totalPoints",
    path: ["exercises"],
  }
)

// ============================================================================
// Control Schema
// ============================================================================

/**
 * Control metadata specific to controls (not exams)
 */
const ControlMetadataSchema = EducationalMetadataSchema.extend({
  type: z.literal("CONTROL"),
  lessons: z.array(z.object({
    id: z.string(),
    title: z.string(),
    points: z.number().positive(),
  })).optional().describe("Lessons covered in the control"),
})

/**
 * Complete Control JSON structure
 */
export const ControlJsonSchema = z.object({
  semester: z.number().int().min(1).max(2),
  controlNumber: z.number().int().min(1).max(3),
  duration: DurationSchema,
  instructions: z.string().optional().describe("General instructions for students"),
  totalPoints: z.number().positive("Total points must be greater than 0"),
  metadata: ControlMetadataSchema.optional(),
  exercises: z.array(ExamExerciseSchema).min(1, "At least one exercise is required"),
}).refine(
  (data) => {
    // Validate that sum of exercise points equals totalPoints
    const sum = data.exercises.reduce((acc, ex) => acc + ex.points, 0)
    return Math.abs(sum - data.totalPoints) < 0.01
  },
  {
    message: "Sum of exercise points must equal totalPoints",
    path: ["exercises"],
  }
)

// ============================================================================
// Type Exports
// ============================================================================

export type ExamJson = z.infer<typeof ExamJsonSchema>
export type ControlJson = z.infer<typeof ControlJsonSchema>
export type ExamExercise = z.infer<typeof ExamExerciseSchema>
export type SubQuestion = z.infer<typeof SubQuestionSchema>

// ============================================================================
// Validation Functions
// ============================================================================

export interface ValidationResult {
  success: boolean
  data?: any
  errors?: Array<{
    path: string
    message: string
  }>
}

/**
 * Validate exam JSON
 */
export function validateExamJson(json: unknown): ValidationResult {
  const result = ExamJsonSchema.safeParse(json)

  if (result.success) {
    return {
      success: true,
      data: result.data,
    }
  }

  return {
    success: false,
    errors: result.error.issues.map((err: any) => ({
      path: err.path.join('.'),
      message: err.message,
    })),
  }
}

/**
 * Validate control JSON
 */
export function validateControlJson(json: unknown): ValidationResult {
  const result = ControlJsonSchema.safeParse(json)

  if (result.success) {
    return {
      success: true,
      data: result.data,
    }
  }

  return {
    success: false,
    errors: result.error.issues.map((err: any) => ({
      path: err.path.join('.'),
      message: err.message,
    })),
  }
}

/**
 * Validate either exam or control JSON (auto-detect type)
 */
export function validateExamOrControlJson(json: unknown): ValidationResult {
  // Try to determine type from the JSON structure
  if (typeof json === 'object' && json !== null) {
    const obj = json as any

    // Check if it's a control (has semester and controlNumber)
    if ('semester' in obj && 'controlNumber' in obj) {
      return validateControlJson(json)
    }

    // Otherwise treat as exam
    return validateExamJson(json)
  }

  return {
    success: false,
    errors: [{
      path: 'root',
      message: 'Invalid JSON: expected an object',
    }],
  }
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(errors: Array<{ path: string; message: string }>): string {
  if (errors.length === 0) return ""

  return errors.map(err => {
    const pathStr = err.path ? `[${err.path}] ` : ""
    return `${pathStr}${err.message}`
  }).join('\n')
}

/**
 * Check if JSON string is valid JSON syntax
 */
export function isValidJsonSyntax(jsonString: string): { valid: boolean; error?: string } {
  try {
    JSON.parse(jsonString)
    return { valid: true }
  } catch (error: any) {
    return {
      valid: false,
      error: error.message,
    }
  }
}

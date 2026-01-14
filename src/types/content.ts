import { z } from "zod"

// --- Shared Types ---

export type GradeLevel =
  | "primaire_1" | "primaire_2" | "primaire_3" | "primaire_4" | "primaire_5" | "primaire_6"
  | "college_1ac" | "college_2ac" | "college_3ac"
  | "lycee_tc" | "lycee_1bac" | "lycee_2bac"
  | "university"

export type Stream =
  | "none"
  | "tc_lettres" | "tc_sciences" | "tc_technologie"
  | "sc_math_a" | "sc_math_b" | "sc_experimental" | "sc_physique" | "sc_vie_terre" | "sc_economie" | "lettres_humaines"

// --- Lesson Structure ---

export interface LessonMetadata {
  id: string
  title: string
  subject: string
  topic: string
  subtopic: string
  grade_level: GradeLevel
  stream?: Stream
  estimated_duration: string
  keywords: string[]
  prerequisites: string[]
  learning_objectives: string[]
}

export interface Definition {
  term: string
  definition: string
  example: string
}

export interface Formula {
  formula: string
  explanation: string
  variables: Record<string, string>
}

export interface Theorem {
  name: string
  statement: string
  proof: string
  application: string
}

export interface TheorySection {
  key_concepts: string[]
  definitions: Definition[]
  formulas: Formula[]
  theorems: Theorem[]
}

export interface Example {
  title: string
  problem: string
  solution: Record<string, string>
  explanation: string
}

export interface VisualElement {
  type: string
  description: string
  alt_text: string
  data?: string // For graphs
  interpretation?: string
}

export interface LessonContent {
  introduction: {
    hook: string
    real_world_connection: string
  }
  theory: TheorySection
  examples: Example[]
  visual_elements: {
    diagrams: VisualElement[]
    graphs: VisualElement[]
  }
  summary: {
    key_points: string[]
    common_mistakes: string[]
  }
}

export interface QuickCheckQuestion {
  question: string
  options: string[]
  correct_answer: string
  explanation: string
}

export interface Lesson {
  metadata: LessonMetadata
  content: LessonContent
  assessment: {
    quick_check: QuickCheckQuestion[]
  }
  resources: {
    further_reading: string[]
    related_lessons: string[]
    video_links: string[]
  }
}

// --- Exercise Structure ---

export interface ExerciseMetadata {
  id: string
  title: string
  related_lesson: string
  points: number
  estimated_time: string
  tags: string[]
  skills_tested: string[]
}

export interface MultipleChoiceComponent {
  question: string
  options: {
    value: string
    text: string
    hint?: string
  }[]
  correct_option: string
  explanation: string
}

export interface FreeResponseComponent {
  prompt: string
  expected_format: string
  solution_steps: string[]
  scoring_rubric: {
    points: number
    criterion: string
  }[]
}

export interface StepByStepComponent {
  problem: string
  hints: {
    step: number
    hint: string
    reveal_condition: "after_attempt" | "immediate"
  }[]
  solution: {
    steps: {
      step_number: number
      action: string
      explanation: string
    }[]
    final_answer: string
  }
}

export interface Exercise {
  metadata: ExerciseMetadata
  problem: {
    statement: string
    format: "multiple_choice" | "free_response" | "step_by_step"
    context: string
  }
  components: {
    multiple_choice?: MultipleChoiceComponent
    free_response?: FreeResponseComponent
    step_by_step?: StepByStepComponent
  }
  scaffolding: {
    hints: {
      level: "gentle" | "moderate"
      text: string
    }[]
    worked_example: string
  }
  feedback: {
    correct_response: string
    incorrect_response: string
    common_mistakes: {
      mistake: string
      correction: string
    }[]
  }
}

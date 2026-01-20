import { z } from "zod";

// Question type enum matching Prisma schema
export const QuestionTypeEnum = z.enum(["MCQ", "TRUE_FALSE", "TEXT"]);
export type QuestionType = z.infer<typeof QuestionTypeEnum>;

// Option schema for MCQ and TRUE_FALSE questions
export const OptionSchema = z.object({
  text: z.string().min(1, "Option text is required"),
  isCorrect: z.boolean(),
});

// Question schema with validation based on type
export const QuestionSchema = z.object({
  text: z.string().min(1, "Question text is required"),
  type: QuestionTypeEnum,
  order: z.number().int().min(0),
  options: z.array(OptionSchema).optional(),
  correctAnswer: z.string().optional(),
}).refine(
  (data) => {
    // MCQ and TRUE_FALSE must have options with at least one correct
    if (data.type === "MCQ" || data.type === "TRUE_FALSE") {
      if (!data.options || data.options.length === 0) {
        return false;
      }
      return data.options.some((opt) => opt.isCorrect);
    }
    return true;
  },
  {
    message: "MCQ and TRUE_FALSE questions must have options with at least one correct answer",
  }
);

// Create quiz schema
export const CreateQuizSchema = z.object({
  title: z.string().min(1, "Quiz title is required").max(200),
  description: z.string().max(1000).optional(),
  isPublished: z.boolean().optional().default(false),
  questions: z.array(QuestionSchema).min(1, "At least one question is required"),
});

export type CreateQuizInput = z.infer<typeof CreateQuizSchema>;

// Update quiz schema (all fields optional)
export const UpdateQuizSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
  isPublished: z.boolean().optional(),
  questions: z.array(QuestionSchema).min(1).optional(),
});

export type UpdateQuizInput = z.infer<typeof UpdateQuizSchema>;

// Quiz submission schema - answers keyed by question ID
export const SubmitQuizSchema = z.object({
  participantName: z.string().min(1, "Name is required").max(100),
  answers: z.record(z.string(), z.string()), // { questionId: answer }
});

export type SubmitQuizInput = z.infer<typeof SubmitQuizSchema>;

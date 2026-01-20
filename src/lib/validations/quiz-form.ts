import { z } from "zod";

/**
 * Option schema for MCQ questions
 */
export const optionSchema = z.object({
  text: z.string().min(1, "Option text is required"),
  isCorrect: z.boolean(),
});

/**
 * Question schema - validates different question types
 */
export const questionSchema = z.object({
  id: z.string(),
  text: z.string().min(1, "Question text is required"),
  type: z.enum(["MCQ", "TRUE_FALSE", "TEXT"]),
  options: z.array(optionSchema),
  correctAnswer: z.string().optional(),
}).refine(
  (data) => {
    // MCQ must have at least 2 options
    if (data.type === "MCQ" && data.options.length < 2) {
      return false;
    }
    return true;
  },
  { message: "MCQ questions must have at least 2 options", path: ["options"] }
).refine(
  (data) => {
    // MCQ must have exactly one correct answer
    if (data.type === "MCQ" || data.type === "TRUE_FALSE") {
      const correctCount = data.options.filter(o => o.isCorrect).length;
      return correctCount === 1;
    }
    return true;
  },
  { message: "Please select exactly one correct answer", path: ["options"] }
).refine(
  (data) => {
    // MCQ options must all have text
    if (data.type === "MCQ") {
      return data.options.every(o => o.text.trim().length > 0);
    }
    return true;
  },
  { message: "All options must have text", path: ["options"] }
);

/**
 * Quiz form schema - for client-side validation
 */
export const quizFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  description: z.string().max(1000, "Description must be less than 1000 characters").optional(),
  isPublished: z.boolean(),
  questions: z.array(questionSchema).min(1, "Add at least one question"),
});

export type QuizFormData = z.infer<typeof quizFormSchema>;
export type QuestionFormData = z.infer<typeof questionSchema>;
export type OptionFormData = z.infer<typeof optionSchema>;

"use client";

import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { quizFormSchema, type QuizFormData } from "@/lib/validations/quiz-form";
import { useCreateQuiz } from "@/hooks/use-quiz";

type QuestionType = "MCQ" | "TRUE_FALSE" | "TEXT";

/**
 * Create new quiz page with React Query mutation
 */
export default function NewQuizPage() {
  const router = useRouter();
  const createQuiz = useCreateQuiz();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<QuizFormData>({
    resolver: zodResolver(quizFormSchema),
    defaultValues: {
      title: "",
      description: "",
      isPublished: false,
      questions: [],
    },
  });

  const { fields: questions, append, remove, update } = useFieldArray({
    control,
    name: "questions",
  });

  const watchedQuestions = watch("questions");

  const addQuestion = (type: QuestionType) => {
    append({
      id: crypto.randomUUID(),
      text: "",
      type,
      options: type === "MCQ"
        ? [{ text: "", isCorrect: true }, { text: "", isCorrect: false }]
        : type === "TRUE_FALSE"
          ? [{ text: "True", isCorrect: true }, { text: "False", isCorrect: false }]
          : [],
      correctAnswer: "",
    });
  };

  const setCorrectOption = (qIndex: number, oIndex: number) => {
    const question = watchedQuestions[qIndex];
    if (!question) return;
    const newOptions = question.options.map((o, i) => ({ ...o, isCorrect: i === oIndex }));
    update(qIndex, { ...question, options: newOptions });
  };

  const addOption = (qIndex: number) => {
    const question = watchedQuestions[qIndex];
    if (!question) return;
    update(qIndex, { ...question, options: [...question.options, { text: "", isCorrect: false }] });
  };

  const removeOption = (qIndex: number, oIndex: number) => {
    const question = watchedQuestions[qIndex];
    if (!question || question.options.length <= 2) return;
    const newOptions = question.options.filter((_, i) => i !== oIndex);
    if (question.options[oIndex]?.isCorrect && newOptions.length > 0) {
      newOptions[0].isCorrect = true;
    }
    update(qIndex, { ...question, options: newOptions });
  };

  const onSubmit = (data: QuizFormData) => {
    createQuiz.mutate(
      {
        title: data.title,
        description: data.description,
        isPublished: data.isPublished,
        questions: data.questions.map((q, index) => ({
          text: q.text,
          type: q.type,
          order: index,
          options: q.type !== "TEXT" ? q.options : undefined,
          correctAnswer: q.type === "TEXT" ? q.correctAnswer : undefined,
        })),
      },
      {
        onSuccess: () => {
          toast.success("Quiz created successfully!");
          router.push("/admin/quizzes");
        },
        onError: (error) => {
          toast.error(error.message || "Failed to create quiz");
        },
      }
    );
  };

  const getQuestionTypeLabel = (type: QuestionType) => {
    switch (type) {
      case "MCQ": return "Multiple Choice";
      case "TRUE_FALSE": return "True/False";
      case "TEXT": return "Text Answer";
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Create Quiz</h1>
        <p className="text-muted-foreground mt-1">
          Add questions and publish when you&apos;re ready
        </p>
      </div>

      {/* Quiz Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quiz Details</CardTitle>
          <CardDescription>Basic information about your quiz</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Enter quiz title"
              {...register("title")}
              className={`h-11 ${errors.title ? "border-destructive" : ""}`}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description <span className="text-muted-foreground">(optional)</span></Label>
            <Textarea
              id="description"
              placeholder="Add a brief description of your quiz"
              {...register("description")}
              rows={3}
              className={errors.description ? "border-destructive" : ""}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <Label htmlFor="publish">Publish immediately</Label>
              <p className="text-sm text-muted-foreground">
                Make the quiz available to everyone
              </p>
            </div>
            <Switch
              id="publish"
              checked={watch("isPublished")}
              onCheckedChange={(checked) => setValue("isPublished", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Questions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Questions *</h2>
          <span className="text-sm text-muted-foreground">{questions.length} added</span>
        </div>

        {errors.questions?.root && (
          <p className="text-sm text-destructive">{errors.questions.root.message}</p>
        )}
        {errors.questions?.message && (
          <p className="text-sm text-destructive">{errors.questions.message}</p>
        )}

        {questions.map((question, qIndex) => {
          const questionErrors = errors.questions?.[qIndex];

          return (
            <Card key={question.id} className={questionErrors ? "border-destructive" : ""}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium">
                    Question {qIndex + 1} · {getQuestionTypeLabel(question.type as QuestionType)}
                  </CardTitle>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(qIndex)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    Remove
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label>Question text *</Label>
                  <Textarea
                    placeholder="Enter your question"
                    {...register(`questions.${qIndex}.text`)}
                    rows={2}
                    className={questionErrors?.text ? "border-destructive" : ""}
                  />
                  {questionErrors?.text && (
                    <p className="text-sm text-destructive">{questionErrors.text.message}</p>
                  )}
                </div>

                {question.type === "MCQ" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Answer options * <span className="text-muted-foreground">({watchedQuestions[qIndex]?.options.length || 0} options)</span></Label>
                    </div>
                    {questionErrors?.options && (
                      <p className="text-sm text-destructive">
                        {typeof questionErrors.options === "object" && "message" in questionErrors.options
                          ? questionErrors.options.message
                          : "Please fill all options"}
                      </p>
                    )}
                    <RadioGroup
                      value={(watchedQuestions[qIndex]?.options.findIndex(o => o.isCorrect) ?? 0).toString()}
                      onValueChange={(v) => setCorrectOption(qIndex, parseInt(v))}
                      className="space-y-2"
                    >
                      {watchedQuestions[qIndex]?.options.map((option, oIndex) => (
                        <div key={oIndex} className="flex items-center gap-2">
                          <RadioGroupItem value={oIndex.toString()} id={`${question.id}-${oIndex}`} />
                          <Input
                            placeholder={`Option ${oIndex + 1}`}
                            {...register(`questions.${qIndex}.options.${oIndex}.text`)}
                            className={`flex-1 h-10 ${errors.questions?.[qIndex]?.options?.[oIndex]?.text ? "border-destructive" : ""}`}
                          />
                          {(watchedQuestions[qIndex]?.options.length || 0) > 2 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeOption(qIndex, oIndex)}
                              className="text-muted-foreground hover:text-destructive px-2"
                            >
                              ✕
                            </Button>
                          )}
                        </div>
                      ))}
                    </RadioGroup>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addOption(qIndex)}
                      className="w-full"
                    >
                      + Add Option
                    </Button>
                  </div>
                )}

                {question.type === "TRUE_FALSE" && (
                  <div className="space-y-3">
                    <Label>Correct answer *</Label>
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant={watchedQuestions[qIndex]?.options[0]?.isCorrect ? "default" : "outline"}
                        onClick={() => setCorrectOption(qIndex, 0)}
                        className="flex-1"
                      >
                        True
                      </Button>
                      <Button
                        type="button"
                        variant={watchedQuestions[qIndex]?.options[1]?.isCorrect ? "default" : "outline"}
                        onClick={() => setCorrectOption(qIndex, 1)}
                        className="flex-1"
                      >
                        False
                      </Button>
                    </div>
                  </div>
                )}

                {question.type === "TEXT" && (
                  <div className="space-y-2">
                    <Label>Expected answer <span className="text-muted-foreground">(optional, for reference)</span></Label>
                    <Input
                      placeholder="Enter the expected answer"
                      {...register(`questions.${qIndex}.correctAnswer`)}
                      className="h-10"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {/* Add Question Card */}
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground mb-4">Add a question to your quiz</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button type="button" variant="outline" onClick={() => addQuestion("MCQ")}>
                Multiple Choice
              </Button>
              <Button type="button" variant="outline" onClick={() => addQuestion("TRUE_FALSE")}>
                True/False
              </Button>
              <Button type="button" variant="outline" onClick={() => addQuestion("TEXT")}>
                Text Answer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 py-4 border-t">
        <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={createQuiz.isPending}>
          {createQuiz.isPending ? "Creating..." : "Create Quiz"}
        </Button>
      </div>
    </form>
  );
}

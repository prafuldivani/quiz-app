"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { quizFormSchema, type QuizFormData } from "@/lib/validations/quiz-form";
import { useQuiz, useUpdateQuiz, useDeleteQuiz } from "@/hooks/use-quiz";

type QuestionType = "MCQ" | "TRUE_FALSE" | "TEXT";

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Edit quiz page with React Query
 */
export default function EditQuizPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();

  const { data: quiz, isLoading, error } = useQuiz(id);
  const updateQuiz = useUpdateQuiz(id);
  const deleteQuiz = useDeleteQuiz();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
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

  // Load quiz data into form
  useEffect(() => {
    if (quiz) {
      reset({
        title: quiz.title,
        description: quiz.description || "",
        isPublished: quiz.isPublished,
        questions: quiz.questions.map((q) => ({
          id: q.id,
          text: q.text,
          type: q.type,
          options: q.options || [],
          correctAnswer: q.correctAnswer || "",
        })),
      });
    }
  }, [quiz, reset]);

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
    updateQuiz.mutate(
      {
        title: data.title,
        description: data.description,
        isPublished: data.isPublished,
        questions: data.questions.map((q, index) => ({
          text: q.text,
          type: q.type,
          order: index,
          options: q.type !== "TEXT" ? q.options.map(o => ({ text: o.text, isCorrect: o.isCorrect })) : undefined,
          correctAnswer: q.type === "TEXT" ? q.correctAnswer : undefined,
        })),
      },
      {
        onSuccess: () => {
          toast.success("Quiz saved!");
        },
        onError: (err) => {
          toast.error(err.message || "Failed to save quiz");
        },
      }
    );
  };

  const confirmDelete = () => {
    deleteQuiz.mutate(id, {
      onSuccess: () => {
        toast.success("Quiz deleted");
        router.push("/admin/quizzes");
      },
      onError: (err) => {
        toast.error(err.message || "Failed to delete quiz");
      },
    });
  };


  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/quiz/${id}`);
    toast.success("Link copied!");
  };

  if (isLoading) {
    return <div className="py-12 text-center text-muted-foreground">Loading...</div>;
  }

  if (error) {
    toast.error("Quiz not found");
    router.push("/admin/quizzes");
    return null;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Edit Quiz</h1>
          <p className="text-muted-foreground mt-1">Modify your quiz</p>
        </div>
        {watch("isPublished") && (
          <Button type="button" variant="outline" size="sm" onClick={copyLink}>Copy Link</Button>
        )}
      </div>

      {/* Quiz Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quiz Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              {...register("title")}
              className={errors.title ? "border-destructive" : ""}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              rows={2}
              className={errors.description ? "border-destructive" : ""}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="publish">Published</Label>
              <p className="text-sm text-muted-foreground">Make quiz available publicly</p>
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
        <h2 className="text-lg font-medium">Questions ({questions.length}) *</h2>

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
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    Q{qIndex + 1} • {question.type === "MCQ" ? "Multiple Choice" : question.type === "TRUE_FALSE" ? "True/False" : "Text"}
                  </CardTitle>
                  <Button type="button" variant="ghost" size="sm" onClick={() => remove(qIndex)}>Remove</Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Question *</Label>
                  <Textarea
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
                    <Label>Options ({watchedQuestions[qIndex]?.options.length || 0}) *</Label>
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
                            {...register(`questions.${qIndex}.options.${oIndex}.text`)}
                            className={`flex-1 ${errors.questions?.[qIndex]?.options?.[oIndex]?.text ? "border-destructive" : ""}`}
                            placeholder={`Option ${oIndex + 1}`}
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
                  <div className="space-y-2">
                    <Label>Correct answer *</Label>
                    <div className="flex gap-2">
                      <Button type="button" variant={watchedQuestions[qIndex]?.options[0]?.isCorrect ? "default" : "outline"} size="sm" onClick={() => setCorrectOption(qIndex, 0)}>True</Button>
                      <Button type="button" variant={watchedQuestions[qIndex]?.options[1]?.isCorrect ? "default" : "outline"} size="sm" onClick={() => setCorrectOption(qIndex, 1)}>False</Button>
                    </div>
                  </div>
                )}

                {question.type === "TEXT" && (
                  <div className="space-y-2">
                    <Label>Expected answer</Label>
                    <Input {...register(`questions.${qIndex}.correctAnswer`)} />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        <Card className="border-dashed">
          <CardContent className="py-6 text-center">
            <p className="text-sm text-muted-foreground mb-4">Add a question</p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => addQuestion("MCQ")}>Multiple Choice</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => addQuestion("TRUE_FALSE")}>True/False</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => addQuestion("TEXT")}>Text Answer</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="destructive" disabled={deleteQuiz.isPending}>
              {deleteQuiz.isPending ? "Deleting..." : "Delete Quiz"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the quiz
                and remove all associated data including player attempts.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <div className="flex gap-3">
          <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={updateQuiz.isPending}>
            {updateQuiz.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </form>
  );
}

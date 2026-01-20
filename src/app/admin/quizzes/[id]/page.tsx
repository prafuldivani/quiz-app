"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

type QuestionType = "MCQ" | "TRUE_FALSE" | "TEXT";

interface Option {
  id?: string;
  text: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options: Option[];
  correctAnswer?: string;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Edit quiz page
 */
export default function EditQuizPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    async function loadQuiz() {
      try {
        const response = await fetch(`/api/quizzes/${id}`);
        const data = await response.json();

        if (data.success) {
          const quiz = data.data;
          setTitle(quiz.title);
          setDescription(quiz.description || "");
          setIsPublished(quiz.isPublished);
          setQuestions(quiz.questions.map((q: Question & { options: Option[] }) => ({
            id: q.id,
            text: q.text,
            type: q.type,
            options: q.options || [],
            correctAnswer: q.correctAnswer || "",
          })));
        } else {
          toast.error("Quiz not found");
          router.push("/admin/quizzes");
        }
      } catch {
        toast.error("Failed to load quiz");
        router.push("/admin/quizzes");
      } finally {
        setLoading(false);
      }
    }
    loadQuiz();
  }, [id, router]);

  const addQuestion = (type: QuestionType) => {
    const newQuestion: Question = {
      id: crypto.randomUUID(),
      text: "",
      type,
      options: type === "MCQ"
        ? [{ text: "", isCorrect: true }, { text: "", isCorrect: false }] // Start with 2 options
        : type === "TRUE_FALSE"
          ? [{ text: "True", isCorrect: true }, { text: "False", isCorrect: false }]
          : [],
      correctAnswer: "",
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestionText = (qid: string, text: string) => {
    setQuestions(questions.map(q => q.id === qid ? { ...q, text } : q));
  };

  const updateOptionText = (qId: string, oIndex: number, text: string) => {
    setQuestions(questions.map(q =>
      q.id === qId
        ? { ...q, options: q.options.map((o, i) => i === oIndex ? { ...o, text } : o) }
        : q
    ));
  };

  const setCorrectOption = (qId: string, oIndex: number) => {
    setQuestions(questions.map(q =>
      q.id === qId
        ? { ...q, options: q.options.map((o, i) => ({ ...o, isCorrect: i === oIndex })) }
        : q
    ));
  };

  const addOption = (qId: string) => {
    setQuestions(questions.map(q =>
      q.id === qId
        ? { ...q, options: [...q.options, { text: "", isCorrect: false }] }
        : q
    ));
  };

  const removeOption = (qId: string, oIndex: number) => {
    setQuestions(questions.map(q => {
      if (q.id !== qId) return q;
      const newOptions = q.options.filter((_, i) => i !== oIndex);
      // If we removed the correct answer, set the first option as correct
      if (q.options[oIndex]?.isCorrect && newOptions.length > 0) {
        newOptions[0].isCorrect = true;
      }
      return { ...q, options: newOptions };
    }));
  };

  const updateCorrectAnswer = (qid: string, answer: string) => {
    setQuestions(questions.map(q => q.id === qid ? { ...q, correctAnswer: answer } : q));
  };

  const removeQuestion = (qid: string) => {
    setQuestions(questions.filter(q => q.id !== qid));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Please enter a quiz title");
      return;
    }
    if (questions.length === 0) {
      toast.error("Please add at least one question");
      return;
    }
    // Validate MCQ questions have at least 2 options
    const invalidMcq = questions.find(q => q.type === "MCQ" && q.options.length < 2);
    if (invalidMcq) {
      toast.error("MCQ questions must have at least 2 options");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`/api/quizzes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          isPublished,
          questions: questions.map((q, index) => ({
            text: q.text,
            type: q.type,
            order: index,
            options: q.type !== "TEXT" ? q.options.map(o => ({ text: o.text, isCorrect: o.isCorrect })) : undefined,
            correctAnswer: q.type === "TEXT" ? q.correctAnswer : undefined,
          })),
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Quiz saved!");
      } else {
        toast.error(data.error || "Failed to save quiz");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this quiz? This cannot be undone.")) return;

    setDeleting(true);

    try {
      const response = await fetch(`/api/quizzes/${id}`, { method: "DELETE" });
      const data = await response.json();

      if (data.success) {
        toast.success("Quiz deleted");
        router.push("/admin/quizzes");
      } else {
        toast.error(data.error || "Failed to delete quiz");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setDeleting(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/quiz/${id}`);
    toast.success("Link copied!");
  };

  if (loading) {
    return <div className="py-12 text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Edit Quiz</h1>
          <p className="text-muted-foreground mt-1">Modify your quiz</p>
        </div>
        {isPublished && (
          <Button variant="outline" size="sm" onClick={copyLink}>Copy Link</Button>
        )}
      </div>

      {/* Quiz Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quiz Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="publish">Published</Label>
              <p className="text-sm text-muted-foreground">Make quiz available publicly</p>
            </div>
            <Switch id="publish" checked={isPublished} onCheckedChange={setIsPublished} />
          </div>
        </CardContent>
      </Card>

      {/* Questions */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Questions ({questions.length})</h2>

        {questions.map((question, qIndex) => (
          <Card key={question.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  Q{qIndex + 1} • {question.type === "MCQ" ? "Multiple Choice" : question.type === "TRUE_FALSE" ? "True/False" : "Text"}
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => removeQuestion(question.id)}>Remove</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Question</Label>
                <Textarea value={question.text} onChange={(e) => updateQuestionText(question.id, e.target.value)} rows={2} />
              </div>

              {question.type === "MCQ" && (
                <div className="space-y-3">
                  <Label>Options ({question.options.length})</Label>
                  <RadioGroup
                    value={question.options.findIndex(o => o.isCorrect).toString()}
                    onValueChange={(v) => setCorrectOption(question.id, parseInt(v))}
                    className="space-y-2"
                  >
                    {question.options.map((option, oIndex) => (
                      <div key={oIndex} className="flex items-center gap-2">
                        <RadioGroupItem value={oIndex.toString()} id={`${question.id}-${oIndex}`} />
                        <Input
                          value={option.text}
                          onChange={(e) => updateOptionText(question.id, oIndex, e.target.value)}
                          className="flex-1"
                          placeholder={`Option ${oIndex + 1}`}
                        />
                        {question.options.length > 2 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeOption(question.id, oIndex)}
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
                    onClick={() => addOption(question.id)}
                    className="w-full"
                  >
                    + Add Option
                  </Button>
                </div>
              )}

              {question.type === "TRUE_FALSE" && (
                <div className="space-y-2">
                  <Label>Correct answer</Label>
                  <div className="flex gap-2">
                    <Button type="button" variant={question.options[0]?.isCorrect ? "default" : "outline"} size="sm" onClick={() => setCorrectOption(question.id, 0)}>True</Button>
                    <Button type="button" variant={question.options[1]?.isCorrect ? "default" : "outline"} size="sm" onClick={() => setCorrectOption(question.id, 1)}>False</Button>
                  </div>
                </div>
              )}

              {question.type === "TEXT" && (
                <div className="space-y-2">
                  <Label>Expected answer</Label>
                  <Input value={question.correctAnswer || ""} onChange={(e) => updateCorrectAnswer(question.id, e.target.value)} />
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        <Card className="border-dashed">
          <CardContent className="py-6 text-center">
            <p className="text-sm text-muted-foreground mb-4">Add a question</p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => addQuestion("MCQ")}>Multiple Choice</Button>
              <Button variant="outline" size="sm" onClick={() => addQuestion("TRUE_FALSE")}>True/False</Button>
              <Button variant="outline" size="sm" onClick={() => addQuestion("TEXT")}>Text Answer</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
          {deleting ? "Deleting..." : "Delete"}
        </Button>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => router.back()}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !title.trim() || questions.length === 0}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

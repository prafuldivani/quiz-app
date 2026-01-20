"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

type QuestionType = "MCQ" | "TRUE_FALSE" | "TEXT";

interface Option {
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

/**
 * Create new quiz page
 */
export default function NewQuizPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);

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

  const updateQuestionText = (id: string, text: string) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, text } : q));
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

  const updateCorrectAnswer = (id: string, answer: string) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, correctAnswer: answer } : q));
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
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
      const response = await fetch("/api/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          isPublished,
          questions: questions.map((q, index) => ({
            text: q.text,
            type: q.type,
            order: index,
            options: q.type !== "TEXT" ? q.options : undefined,
            correctAnswer: q.type === "TEXT" ? q.correctAnswer : undefined,
          })),
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Quiz created successfully!");
        router.push("/admin/quizzes");
      } else {
        toast.error(data.error || "Failed to create quiz");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const getQuestionTypeLabel = (type: QuestionType) => {
    switch (type) {
      case "MCQ": return "Multiple Choice";
      case "TRUE_FALSE": return "True/False";
      case "TEXT": return "Text Answer";
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
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
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Enter quiz title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description <span className="text-muted-foreground">(optional)</span></Label>
            <Textarea
              id="description"
              placeholder="Add a brief description of your quiz"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <Label htmlFor="publish">Publish immediately</Label>
              <p className="text-sm text-muted-foreground">
                Make the quiz available to everyone
              </p>
            </div>
            <Switch id="publish" checked={isPublished} onCheckedChange={setIsPublished} />
          </div>
        </CardContent>
      </Card>

      {/* Questions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Questions</h2>
          <span className="text-sm text-muted-foreground">{questions.length} added</span>
        </div>

        {questions.map((question, qIndex) => (
          <Card key={question.id}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium">
                  Question {qIndex + 1} · {getQuestionTypeLabel(question.type)}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeQuestion(question.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  Remove
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>Question text</Label>
                <Textarea
                  placeholder="Enter your question"
                  value={question.text}
                  onChange={(e) => updateQuestionText(question.id, e.target.value)}
                  rows={2}
                />
              </div>

              {question.type === "MCQ" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Answer options <span className="text-muted-foreground">({question.options.length} options)</span></Label>
                  </div>
                  <RadioGroup
                    value={question.options.findIndex(o => o.isCorrect).toString()}
                    onValueChange={(v) => setCorrectOption(question.id, parseInt(v))}
                    className="space-y-2"
                  >
                    {question.options.map((option, oIndex) => (
                      <div key={oIndex} className="flex items-center gap-2">
                        <RadioGroupItem value={oIndex.toString()} id={`${question.id}-${oIndex}`} />
                        <Input
                          placeholder={`Option ${oIndex + 1}`}
                          value={option.text}
                          onChange={(e) => updateOptionText(question.id, oIndex, e.target.value)}
                          className="flex-1 h-10"
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
                <div className="space-y-3">
                  <Label>Correct answer</Label>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant={question.options[0]?.isCorrect ? "default" : "outline"}
                      onClick={() => setCorrectOption(question.id, 0)}
                      className="flex-1"
                    >
                      True
                    </Button>
                    <Button
                      type="button"
                      variant={question.options[1]?.isCorrect ? "default" : "outline"}
                      onClick={() => setCorrectOption(question.id, 1)}
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
                    value={question.correctAnswer || ""}
                    onChange={(e) => updateCorrectAnswer(question.id, e.target.value)}
                    className="h-10"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {/* Add Question Card */}
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground mb-4">Add a question to your quiz</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="outline" onClick={() => addQuestion("MCQ")}>
                Multiple Choice
              </Button>
              <Button variant="outline" onClick={() => addQuestion("TRUE_FALSE")}>
                True/False
              </Button>
              <Button variant="outline" onClick={() => addQuestion("TEXT")}>
                Text Answer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 py-4 border-t">
        <Button variant="ghost" onClick={() => router.back()}>Cancel</Button>
        <Button
          onClick={handleSave}
          disabled={saving || !title.trim() || questions.length === 0}
        >
          {saving ? "Creating..." : "Create Quiz"}
        </Button>
      </div>
    </div>
  );
}

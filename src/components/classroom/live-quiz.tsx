"use client";

import { useState, useCallback, useEffect } from "react";
import { Room, Participant } from "livekit-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Brain,
  X,
  Plus,
  Trash2,
  Play,
  StopCircle,
  BarChart3,
  CheckCircle2,
  Clock,
  Users,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuizQuestion {
  id: string;
  question: string;
  type: "multiple_choice" | "true_false" | "short_answer";
  options?: string[];
  correctAnswer: string | string[];
  points: number;
  timeLimit?: number; // in seconds
}

interface QuizResponse {
  participantId: string;
  participantName: string;
  answers: Record<string, string | string[]>;
  score: number;
  submittedAt: Date;
}

interface LiveQuizProps {
  room: Room;
  isTeacher: boolean;
  participants: Participant[];
  onClose: () => void;
}

export function LiveQuiz({ room, isTeacher, participants, onClose }: LiveQuizProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<QuizResponse[]>([]);
  const [studentAnswers, setStudentAnswers] = useState<Record<string, string | string[]>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);

  // New question form state
  const [newQuestion, setNewQuestion] = useState<Partial<QuizQuestion>>({
    question: "",
    type: "multiple_choice",
    options: ["", "", "", ""],
    correctAnswer: "",
    points: 10,
    timeLimit: 30,
  });

  const addQuestion = useCallback(() => {
    if (!newQuestion.question) {
      toast.error("La question ne peut pas être vide");
      return;
    }

    const question: QuizQuestion = {
      id: `q-${Date.now()}`,
      question: newQuestion.question!,
      type: newQuestion.type as any,
      options: newQuestion.type === "multiple_choice" ? newQuestion.options : undefined,
      correctAnswer: newQuestion.correctAnswer!,
      points: newQuestion.points || 10,
      timeLimit: newQuestion.timeLimit,
    };

    setQuestions((prev) => [...prev, question]);
    setNewQuestion({
      question: "",
      type: "multiple_choice",
      options: ["", "", "", ""],
      correctAnswer: "",
      points: 10,
      timeLimit: 30,
    });
    setIsCreating(false);
    toast.success("Question ajoutée");
  }, [newQuestion]);

  const removeQuestion = useCallback((id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
    toast.success("Question supprimée");
  }, []);

  const startQuiz = useCallback(() => {
    if (questions.length === 0) {
      toast.error("Ajoutez au moins une question");
      return;
    }

    setIsActive(true);
    setCurrentQuestionIndex(0);
    setResponses([]);
    setShowResults(false);

    // Send quiz start message to all participants
    const encoder = new TextEncoder();
    const data = encoder.encode(
      JSON.stringify({
        type: "quiz-start",
        totalQuestions: questions.length,
      })
    );
    room.localParticipant.publishData(data, { reliable: true });

    toast.success("Quiz démarré");
    sendCurrentQuestion();
  }, [questions, room]);

  const sendCurrentQuestion = useCallback(() => {
    const question = questions[currentQuestionIndex];
    if (!question) return;

    const encoder = new TextEncoder();
    const data = encoder.encode(
      JSON.stringify({
        type: "quiz-question",
        questionIndex: currentQuestionIndex,
        totalQuestions: questions.length,
        question: {
          id: question.id,
          question: question.question,
          type: question.type,
          options: question.options,
          timeLimit: question.timeLimit,
          points: question.points,
        },
      })
    );
    room.localParticipant.publishData(data, { reliable: true });

    if (question.timeLimit) {
      setTimeRemaining(question.timeLimit);
    }
  }, [questions, currentQuestionIndex, room]);

  const nextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setTimeout(sendCurrentQuestion, 100);
    } else {
      endQuiz();
    }
  }, [currentQuestionIndex, questions.length, sendCurrentQuestion]);

  const endQuiz = useCallback(() => {
    setIsActive(false);
    setShowResults(true);
    setTimeRemaining(null);

    const encoder = new TextEncoder();
    const data = encoder.encode(
      JSON.stringify({
        type: "quiz-end",
      })
    );
    room.localParticipant.publishData(data, { reliable: true });

    toast.success("Quiz terminé");
  }, [room]);

  const submitAnswer = useCallback(() => {
    const currentQuestion = questions[currentQuestionIndex];
    const answer = studentAnswers[currentQuestion.id];

    if (!answer) {
      toast.error("Veuillez sélectionner une réponse");
      return;
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(
      JSON.stringify({
        type: "quiz-answer",
        questionId: currentQuestion.id,
        answer,
      })
    );
    room.localParticipant.publishData(data, { reliable: true });

    toast.success("Réponse envoyée");
  }, [questions, currentQuestionIndex, studentAnswers, room]);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          if (isTeacher) {
            nextQuestion();
          }
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining, isTeacher, nextQuestion]);

  // Listen for student responses (teacher only)
  useEffect(() => {
    if (!room || !isTeacher) return;

    const handleData = (payload: Uint8Array, participant?: Participant) => {
      const decoder = new TextDecoder();
      const message = decoder.decode(payload);
      try {
        const data = JSON.parse(message);

        if (data.type === "quiz-answer" && participant) {
          setResponses((prev) => {
            const existing = prev.find((r) => r.participantId === participant.identity);
            if (existing) {
              return prev.map((r) =>
                r.participantId === participant.identity
                  ? {
                    ...r,
                    answers: { ...r.answers, [data.questionId]: data.answer },
                  }
                  : r
              );
            } else {
              return [
                ...prev,
                {
                  participantId: participant.identity,
                  participantName: participant.name || participant.identity,
                  answers: { [data.questionId]: data.answer },
                  score: 0,
                  submittedAt: new Date(),
                },
              ];
            }
          });
        }
      } catch (e) {
        console.error("Failed to parse quiz data:", e);
      }
    };

    room.on("dataReceived" as any, handleData);
    return () => {
      room.off("dataReceived" as any, handleData);
    };
  }, [room, isTeacher]);

  // Calculate scores
  const calculateScores = useCallback(() => {
    return responses.map((response) => {
      let score = 0;
      questions.forEach((question) => {
        const answer = response.answers[question.id];
        if (Array.isArray(question.correctAnswer)) {
          // Multiple correct answers
          if (
            Array.isArray(answer) &&
            answer.sort().join(",") === question.correctAnswer.sort().join(",")
          ) {
            score += question.points;
          }
        } else {
          // Single correct answer
          if (answer === question.correctAnswer) {
            score += question.points;
          }
        }
      });
      return { ...response, score };
    });
  }, [responses, questions]);

  const scoredResponses = calculateScores();
  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
  const averageScore =
    scoredResponses.length > 0
      ? scoredResponses.reduce((sum, r) => sum + r.score, 0) / scoredResponses.length
      : 0;

  const currentQuestion = questions[currentQuestionIndex];

  if (!isTeacher && !isActive) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <Card className="bg-[#1a1a1a] border-zinc-800 p-6 max-w-md text-center">
          <Brain className="h-12 w-12 text-blue-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">En attente du quiz</h3>
          <p className="text-zinc-400">
            L'enseignant n'a pas encore démarré le quiz.
          </p>
          <Button onClick={onClose} className="mt-4">
            Fermer
          </Button>
        </Card>
      </div>
    );
  }

  // Student view during active quiz
  if (!isTeacher && isActive && currentQuestion) {
    return (
      <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
        <Card className="bg-[#1a1a1a] border-zinc-800 w-full max-w-2xl">
          <div className="p-6 border-b border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                Question {currentQuestionIndex + 1}/{questions.length}
              </Badge>
              {timeRemaining !== null && (
                <Badge
                  variant="outline"
                  className={cn(
                    "border-orange-500/20",
                    timeRemaining > 10
                      ? "bg-green-500/10 text-green-400"
                      : "bg-red-500/10 text-red-400 animate-pulse"
                  )}
                >
                  <Clock className="h-3 w-3 mr-1" />
                  {timeRemaining}s
                </Badge>
              )}
            </div>
            <h3 className="text-xl font-semibold text-white">{currentQuestion.question}</h3>
          </div>

          <div className="p-6">
            {currentQuestion.type === "multiple_choice" && (
              <RadioGroup
                value={studentAnswers[currentQuestion.id] as string}
                onValueChange={(value) =>
                  setStudentAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }))
                }
                className="space-y-3"
              >
                {currentQuestion.options?.map((option, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 bg-zinc-900 p-4 rounded-lg border border-zinc-800 hover:border-blue-500/50 transition-colors cursor-pointer"
                  >
                    <RadioGroupItem value={option} id={`option-${index}`} />
                    <Label
                      htmlFor={`option-${index}`}
                      className="flex-1 cursor-pointer text-white"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {currentQuestion.type === "true_false" && (
              <RadioGroup
                value={studentAnswers[currentQuestion.id] as string}
                onValueChange={(value) =>
                  setStudentAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }))
                }
                className="space-y-3"
              >
                {["Vrai", "Faux"].map((option) => (
                  <div
                    key={option}
                    className="flex items-center space-x-3 bg-zinc-900 p-4 rounded-lg border border-zinc-800 hover:border-blue-500/50 transition-colors cursor-pointer"
                  >
                    <RadioGroupItem value={option} id={option} />
                    <Label htmlFor={option} className="flex-1 cursor-pointer text-white">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {currentQuestion.type === "short_answer" && (
              <Textarea
                value={(studentAnswers[currentQuestion.id] as string) || ""}
                onChange={(e) =>
                  setStudentAnswers((prev) => ({
                    ...prev,
                    [currentQuestion.id]: e.target.value,
                  }))
                }
                placeholder="Tapez votre réponse..."
                className="bg-zinc-900 border-zinc-800 text-white min-h-[120px]"
              />
            )}
          </div>

          <div className="p-6 border-t border-zinc-800 flex justify-between">
            <Button variant="outline" onClick={onClose} className="border-zinc-700">
              Quitter
            </Button>
            <Button onClick={submitAnswer} className="bg-blue-600 hover:bg-blue-700">
              Soumettre la réponse
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Teacher view
  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="bg-[#1a1a1a] border-zinc-800 w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Brain className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Quiz en direct</h2>
              <p className="text-sm text-zinc-400">
                {questions.length} question{questions.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isActive && (
              <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
                En cours
              </Badge>
            )}
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 p-6">
          {showResults ? (
            <div className="space-y-6">
              {/* Results Summary */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="bg-zinc-900 border-zinc-800 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-zinc-400">Réponses</p>
                      <p className="text-2xl font-bold text-white mt-1">
                        {scoredResponses.length}
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-blue-500" />
                  </div>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-zinc-400">Score moyen</p>
                      <p className="text-2xl font-bold text-white mt-1">
                        {Math.round((averageScore / totalPoints) * 100)}%
                      </p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-green-500" />
                  </div>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-zinc-400">Meilleur score</p>
                      <p className="text-2xl font-bold text-white mt-1">
                        {scoredResponses.length > 0
                          ? Math.round(
                            (Math.max(...scoredResponses.map((r) => r.score)) / totalPoints) *
                            100
                          )
                          : 0}
                        %
                      </p>
                    </div>
                    <Award className="h-8 w-8 text-yellow-500" />
                  </div>
                </Card>
              </div>

              {/* Leaderboard */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Classement</h3>
                <div className="space-y-2">
                  {scoredResponses
                    .sort((a, b) => b.score - a.score)
                    .map((response, index) => (
                      <Card
                        key={response.participantId}
                        className="bg-zinc-900 border-zinc-800 p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div
                              className={cn(
                                "h-8 w-8 rounded-full flex items-center justify-center font-bold",
                                index === 0 && "bg-yellow-500 text-black",
                                index === 1 && "bg-gray-400 text-black",
                                index === 2 && "bg-orange-600 text-white",
                                index > 2 && "bg-zinc-800 text-zinc-400"
                              )}
                            >
                              {index + 1}
                            </div>
                            <span className="text-white font-medium">
                              {response.participantName}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-white font-semibold">
                                {response.score}/{totalPoints}
                              </p>
                              <p className="text-xs text-zinc-500">
                                {Math.round((response.score / totalPoints) * 100)}%
                              </p>
                            </div>
                            <Progress
                              value={(response.score / totalPoints) * 100}
                              className="w-32"
                            />
                          </div>
                        </div>
                      </Card>
                    ))}
                </div>
              </div>
            </div>
          ) : isActive && currentQuestion ? (
            <div className="space-y-6">
              <Card className="bg-zinc-900 border-zinc-800 p-6">
                <div className="flex items-center justify-between mb-4">
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                    Question {currentQuestionIndex + 1}/{questions.length}
                  </Badge>
                  {timeRemaining !== null && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "border-orange-500/20",
                        timeRemaining > 10
                          ? "bg-green-500/10 text-green-400"
                          : "bg-red-500/10 text-red-400 animate-pulse"
                      )}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      {timeRemaining}s restantes
                    </Badge>
                  )}
                </div>
                <h3 className="text-2xl font-semibold text-white mb-4">
                  {currentQuestion.question}
                </h3>
                <div className="flex items-center gap-4 text-sm text-zinc-400">
                  <span>{currentQuestion.points} points</span>
                  <span>•</span>
                  <span>{currentQuestion.type.replace("_", " ")}</span>
                </div>
              </Card>

              <Card className="bg-zinc-900 border-zinc-800 p-6">
                <h4 className="text-lg font-semibold text-white mb-4">
                  Réponses reçues ({responses.length}/{participants.length - 1})
                </h4>
                <Progress
                  value={(responses.length / (participants.length - 1)) * 100}
                  className="mb-4"
                />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {responses.map((response) => (
                    <div
                      key={response.participantId}
                      className="bg-zinc-800 rounded px-3 py-2 text-sm text-white flex items-center gap-2"
                    >
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      {response.participantName}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((question, index) => (
                <Card key={question.id} className="bg-zinc-900 border-zinc-800 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                          Q{index + 1}
                        </Badge>
                        <Badge variant="outline" className="bg-zinc-800 text-zinc-400 border-zinc-700">
                          {question.points} pts
                        </Badge>
                      </div>
                      <h4 className="text-white font-medium mb-2">{question.question}</h4>
                      <p className="text-sm text-zinc-500">
                        Type: {question.type.replace("_", " ")} • Temps: {question.timeLimit}s
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeQuestion(question.id)}
                      className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}

              {questions.length === 0 && (
                <div className="text-center py-12">
                  <Brain className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Aucune question
                  </h3>
                  <p className="text-zinc-400 mb-6">
                    Commencez par ajouter des questions à votre quiz.
                  </p>
                  <Button
                    onClick={() => setIsCreating(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter une question
                  </Button>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-zinc-800">
          <div className="flex gap-2">
            {!isActive && !showResults && (
              <Button
                variant="outline"
                onClick={() => setIsCreating(true)}
                className="border-zinc-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une question
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {showResults ? (
              <Button
                onClick={() => {
                  setShowResults(false);
                  setIsActive(false);
                  setResponses([]);
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Nouveau quiz
              </Button>
            ) : isActive ? (
              <>
                <Button
                  variant="outline"
                  onClick={endQuiz}
                  className="border-zinc-700"
                >
                  <StopCircle className="h-4 w-4 mr-2" />
                  Terminer
                </Button>
                <Button
                  onClick={nextQuestion}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {currentQuestionIndex < questions.length - 1
                    ? "Question suivante"
                    : "Voir les résultats"}
                </Button>
              </>
            ) : (
              <Button
                onClick={startQuiz}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={questions.length === 0}
              >
                <Play className="h-4 w-4 mr-2" />
                Démarrer le quiz
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Create Question Dialog */}
      {isCreating && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="bg-[#1a1a1a] border-zinc-800 w-full max-w-2xl">
            <div className="p-6 border-b border-zinc-800">
              <h3 className="text-xl font-semibold text-white">Nouvelle question</h3>
            </div>

            <ScrollArea className="max-h-[60vh] p-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="question">Question</Label>
                  <Textarea
                    id="question"
                    value={newQuestion.question}
                    onChange={(e) =>
                      setNewQuestion((prev) => ({ ...prev, question: e.target.value }))
                    }
                    placeholder="Entrez votre question..."
                    className="bg-zinc-900 border-zinc-800 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Type de question</Label>
                    <Select
                      value={newQuestion.type}
                      onValueChange={(value: any) =>
                        setNewQuestion((prev) => ({ ...prev, type: value }))
                      }
                    >
                      <SelectTrigger className="bg-zinc-900 border-zinc-800">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800">
                        <SelectItem value="multiple_choice">Choix multiple</SelectItem>
                        <SelectItem value="true_false">Vrai/Faux</SelectItem>
                        <SelectItem value="short_answer">Réponse courte</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="points">Points</Label>
                    <Input
                      id="points"
                      type="number"
                      min={1}
                      value={newQuestion.points}
                      onChange={(e) =>
                        setNewQuestion((prev) => ({
                          ...prev,
                          points: parseInt(e.target.value) || 10,
                        }))
                      }
                      className="bg-zinc-900 border-zinc-800 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeLimit">Temps limite (secondes)</Label>
                  <Input
                    id="timeLimit"
                    type="number"
                    min={5}
                    value={newQuestion.timeLimit}
                    onChange={(e) =>
                      setNewQuestion((prev) => ({
                        ...prev,
                        timeLimit: parseInt(e.target.value) || 30,
                      }))
                    }
                    className="bg-zinc-900 border-zinc-800 text-white"
                  />
                </div>

                {newQuestion.type === "multiple_choice" && (
                  <div className="space-y-2">
                    <Label>Options</Label>
                    {newQuestion.options?.map((option, index) => (
                      <Input
                        key={index}
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...(newQuestion.options || [])];
                          newOptions[index] = e.target.value;
                          setNewQuestion((prev) => ({ ...prev, options: newOptions }));
                        }}
                        placeholder={`Option ${index + 1}`}
                        className="bg-zinc-900 border-zinc-800 text-white"
                      />
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="correctAnswer">Réponse correcte</Label>
                  {newQuestion.type === "multiple_choice" ? (
                    <Select
                      value={newQuestion.correctAnswer as string}
                      onValueChange={(value) =>
                        setNewQuestion((prev) => ({ ...prev, correctAnswer: value }))
                      }
                    >
                      <SelectTrigger className="bg-zinc-900 border-zinc-800">
                        <SelectValue placeholder="Sélectionnez la bonne réponse" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800">
                        {newQuestion.options?.map((option, index) => (
                          <SelectItem key={index} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : newQuestion.type === "true_false" ? (
                    <Select
                      value={newQuestion.correctAnswer as string}
                      onValueChange={(value) =>
                        setNewQuestion((prev) => ({ ...prev, correctAnswer: value }))
                      }
                    >
                      <SelectTrigger className="bg-zinc-900 border-zinc-800">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800">
                        <SelectItem value="Vrai">Vrai</SelectItem>
                        <SelectItem value="Faux">Faux</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id="correctAnswer"
                      value={newQuestion.correctAnswer as string}
                      onChange={(e) =>
                        setNewQuestion((prev) => ({ ...prev, correctAnswer: e.target.value }))
                      }
                      placeholder="Entrez la réponse correcte"
                      className="bg-zinc-900 border-zinc-800 text-white"
                    />
                  )}
                </div>
              </div>
            </ScrollArea>

            <div className="p-6 border-t border-zinc-800 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsCreating(false)}
                className="border-zinc-700"
              >
                Annuler
              </Button>
              <Button onClick={addQuestion} className="bg-blue-600 hover:bg-blue-700">
                Ajouter
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

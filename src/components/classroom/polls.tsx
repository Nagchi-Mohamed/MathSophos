"use client";

import { useState, useEffect, useCallback } from "react";
import {
  X,
  Plus,
  Send,
  BarChart3,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Room, Participant } from "livekit-client";

interface PollsProps {
  room: Room;
  isTeacher: boolean;
  participants: Participant[];
  onClose: () => void;
}

interface Poll {
  id: string;
  question: string;
  options: string[];
  createdBy: string;
  createdAt: number;
  responses: Map<string, number>; // participantId -> optionIndex
}

export function Polls({ room, isTeacher, participants, onClose }: PollsProps) {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [activePoll, setActivePoll] = useState<Poll | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [newOptions, setNewOptions] = useState(["", ""]);
  const [myResponse, setMyResponse] = useState<number | null>(null);

  const localParticipant = room.localParticipant;

  // Broadcast poll
  const broadcastPoll = useCallback((poll: Poll) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify({ type: "poll", poll }));
    room.localParticipant.publishData(data, { reliable: true });
  }, [room]);

  // Broadcast response
  const broadcastResponse = useCallback((pollId: string, optionIndex: number) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify({
      type: "poll-response",
      pollId,
      optionIndex,
      participantId: localParticipant.identity,
    }));
    room.localParticipant.publishData(data, { reliable: true });
  }, [room, localParticipant]);

  // Listen for polls and responses
  useEffect(() => {
    if (!room) return;

    const onDataReceived = (payload: Uint8Array, participant?: Participant) => {
      const decoder = new TextDecoder();
      const message = decoder.decode(payload);
      try {
        const parsed = JSON.parse(message);

        if (parsed.type === "poll") {
          const poll = parsed.poll as Poll;
          poll.responses = new Map(Object.entries(poll.responses || {}));
          setPolls((prev) => [...prev, poll]);
          setActivePoll(poll);
          if (participant?.identity !== localParticipant.identity) {
            toast.info("New poll created!", { description: poll.question });
          }
        } else if (parsed.type === "poll-response") {
          const { pollId, optionIndex, participantId } = parsed;
          setPolls((prev) =>
            prev.map((p) => {
              if (p.id === pollId) {
                const newResponses = new Map(p.responses);
                newResponses.set(participantId, optionIndex);
                return { ...p, responses: newResponses };
              }
              return p;
            })
          );
          if (activePoll?.id === pollId) {
            setActivePoll((prev) => {
              if (!prev) return null;
              const newResponses = new Map(prev.responses);
              newResponses.set(participantId, optionIndex);
              return { ...prev, responses: newResponses };
            });
          }
        }
      } catch (e) {
        console.error("Failed to parse poll data:", e);
      }
    };

    room.on("dataReceived", onDataReceived as any);
    return () => {
      room.off("dataReceived", onDataReceived as any);
    };
  }, [room, localParticipant, activePoll]);

  const createPoll = () => {
    if (!newQuestion.trim()) {
      toast.error("Please enter a question");
      return;
    }

    const validOptions = newOptions.filter((o) => o.trim());
    if (validOptions.length < 2) {
      toast.error("Please provide at least 2 options");
      return;
    }

    const poll: Poll = {
      id: `poll-${Date.now()}`,
      question: newQuestion,
      options: validOptions,
      createdBy: localParticipant.identity,
      createdAt: Date.now(),
      responses: new Map(),
    };

    setPolls((prev) => [...prev, poll]);
    setActivePoll(poll);
    broadcastPoll(poll);

    // Reset form
    setNewQuestion("");
    setNewOptions(["", ""]);
    setIsCreating(false);
    toast.success("Poll created!");
  };

  const submitResponse = (optionIndex: number) => {
    if (!activePoll) return;

    setMyResponse(optionIndex);
    broadcastResponse(activePoll.id, optionIndex);
    toast.success("Response submitted!");
  };

  const calculateResults = (poll: Poll) => {
    const total = poll.responses.size;
    return poll.options.map((_, index) => {
      const count = Array.from(poll.responses.values()).filter((v) => v === index).length;
      const percentage = total > 0 ? (count / total) * 100 : 0;
      return { count, percentage };
    });
  };

  const hasResponded = activePoll?.responses.has(localParticipant.identity);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Polls
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isCreating ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="question">Question</Label>
                <Input
                  id="question"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="What is your question?"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Options</Label>
                <div className="space-y-2 mt-1">
                  {newOptions.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={option}
                        onChange={(e) => {
                          const updated = [...newOptions];
                          updated[index] = e.target.value;
                          setNewOptions(updated);
                        }}
                        placeholder={`Option ${index + 1}`}
                      />
                      {newOptions.length > 2 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setNewOptions(newOptions.filter((_, i) => i !== index));
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNewOptions([...newOptions, ""])}
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Option
                </Button>
              </div>

              <div className="flex gap-2">
                <Button onClick={createPoll} className="flex-1">
                  <Send className="h-4 w-4 mr-2" />
                  Create Poll
                </Button>
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : activePoll ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">{activePoll.question}</h3>
                <p className="text-sm text-gray-500">
                  {activePoll.responses.size} / {participants.length} responses
                </p>
              </div>

              {!hasResponded && !isTeacher ? (
                <RadioGroup onValueChange={(value) => submitResponse(parseInt(value))}>
                  {activePoll.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
                      <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                      <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              ) : (
                <div className="space-y-3">
                  {activePoll.options.map((option, index) => {
                    const results = calculateResults(activePoll);
                    const result = results[index];
                    const isMyChoice = myResponse === index || activePoll.responses.get(localParticipant.identity) === index;

                    return (
                      <div key={index} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className={cn("font-medium", isMyChoice && "text-blue-600")}>
                            {isMyChoice && <CheckCircle2 className="inline h-4 w-4 mr-1" />}
                            {option}
                          </span>
                          <span className="text-gray-600">
                            {result.count} ({result.percentage.toFixed(0)}%)
                          </span>
                        </div>
                        <Progress value={result.percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              )}

              {polls.length > 1 && (
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-2">Previous Polls</h4>
                  <div className="space-y-1">
                    {polls.filter((p) => p.id !== activePoll.id).map((poll) => (
                      <button
                        key={poll.id}
                        onClick={() => setActivePoll(poll)}
                        className="w-full text-left p-2 rounded hover:bg-gray-100 text-sm"
                      >
                        {poll.question}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No active polls</p>
              {isTeacher && (
                <Button onClick={() => setIsCreating(true)} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Poll
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {isTeacher && !isCreating && activePoll && (
          <div className="p-4 border-t bg-gray-50">
            <Button onClick={() => setIsCreating(true)} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Create New Poll
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

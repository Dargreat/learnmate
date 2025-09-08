import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, Trash2, Save, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Question {
  id: string;
  question: string;
  type: 'multiple-choice' | 'theory';
  options?: string[];
  correctAnswer: string;
  explanation?: string;
}

interface Quiz {
  id: string;
  title: string;
  type: 'multiple-choice' | 'theory';
  questions: Question[];
}

interface QuizBuilderProps {
  tutorialId: string;
  onComplete: (tutorialId: string, quiz: Quiz) => void;
  onCancel: () => void;
}

export const QuizBuilder = ({ tutorialId, onComplete, onCancel }: QuizBuilderProps) => {
  const [quiz, setQuiz] = useState<Omit<Quiz, 'id'>>({
    title: '',
    type: 'multiple-choice',
    questions: []
  });

  const [currentQuestion, setCurrentQuestion] = useState<Omit<Question, 'id'>>({
    question: '',
    type: 'multiple-choice',
    options: ['', '', '', ''],
    correctAnswer: '',
    explanation: ''
  });

  const [showQuestionForm, setShowQuestionForm] = useState(false);

  const handleAddQuestion = () => {
    if (!currentQuestion.question || !currentQuestion.correctAnswer) return;

    const newQuestion: Question = {
      id: Date.now().toString(),
      ...currentQuestion
    };

    setQuiz(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));

    setCurrentQuestion({
      question: '',
      type: quiz.type,
      options: quiz.type === 'multiple-choice' ? ['', '', '', ''] : undefined,
      correctAnswer: '',
      explanation: ''
    });

    setShowQuestionForm(false);
  };

  const handleRemoveQuestion = (questionId: string) => {
    setQuiz(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== questionId)
    }));
  };

  const handleSubmitQuiz = () => {
    if (!quiz.title || quiz.questions.length === 0) return;

    const completeQuiz: Quiz = {
      id: Date.now().toString(),
      ...quiz
    };

    onComplete(tutorialId, completeQuiz);
  };

  const updateQuestionOption = (index: number, value: string) => {
    const newOptions = [...(currentQuestion.options || [])];
    newOptions[index] = value;
    setCurrentQuestion(prev => ({ ...prev, options: newOptions }));
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Quiz Builder
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quiz Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Quiz Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="quizTitle">Quiz Title</Label>
                <Input
                  id="quizTitle"
                  value={quiz.title}
                  onChange={(e) => setQuiz(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter quiz title"
                />
              </div>
              <div className="space-y-2">
                <Label>Quiz Type</Label>
                <Select
                  value={quiz.type}
                  onValueChange={(value: 'multiple-choice' | 'theory') => {
                    setQuiz(prev => ({ ...prev, type: value }));
                    setCurrentQuestion(prev => ({
                      ...prev,
                      type: value,
                      options: value === 'multiple-choice' ? ['', '', '', ''] : undefined
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                    <SelectItem value="theory">Theory</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Questions List */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Questions ({quiz.questions.length})</CardTitle>
                  <CardDescription>Add questions to your quiz</CardDescription>
                </div>
                <Button 
                  onClick={() => setShowQuestionForm(true)}
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {quiz.questions.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No questions added yet</p>
              ) : (
                <div className="space-y-4">
                  {quiz.questions.map((question, index) => (
                    <Card key={question.id} className="border border-muted">
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium mb-2">
                              {index + 1}. {question.question}
                            </p>
                            {question.type === 'multiple-choice' && question.options && (
                              <div className="space-y-1 text-sm text-muted-foreground">
                                {question.options.map((option, optIndex) => (
                                  <p key={optIndex} className={option === question.correctAnswer ? 'text-primary font-medium' : ''}>
                                    {String.fromCharCode(65 + optIndex)}. {option} {option === question.correctAnswer && '✓'}
                                  </p>
                                ))}
                              </div>
                            )}
                            {question.type === 'theory' && (
                              <p className="text-sm text-muted-foreground">
                                Answer: {question.correctAnswer}
                              </p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRemoveQuestion(question.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Question Form */}
          {showQuestionForm && (
            <Card className="border-primary">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  Add New Question
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowQuestionForm(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="question">Question</Label>
                  <Textarea
                    id="question"
                    value={currentQuestion.question}
                    onChange={(e) => setCurrentQuestion(prev => ({ ...prev, question: e.target.value }))}
                    placeholder="Enter your question"
                    rows={3}
                  />
                </div>

                {currentQuestion.type === 'multiple-choice' && (
                  <>
                    <div className="space-y-2">
                      <Label>Answer Options</Label>
                      <div className="space-y-2">
                        {currentQuestion.options?.map((option, index) => (
                          <Input
                            key={index}
                            value={option}
                            onChange={(e) => updateQuestionOption(index, e.target.value)}
                            placeholder={`Option ${String.fromCharCode(65 + index)}`}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Correct Answer</Label>
                      <RadioGroup
                        value={currentQuestion.correctAnswer}
                        onValueChange={(value) => setCurrentQuestion(prev => ({ ...prev, correctAnswer: value }))}
                      >
                        {currentQuestion.options?.map((option, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <RadioGroupItem value={option} id={`option-${index}`} disabled={!option} />
                            <Label htmlFor={`option-${index}`}>
                              Option {String.fromCharCode(65 + index)}: {option || 'Enter option first'}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  </>
                )}

                {currentQuestion.type === 'theory' && (
                  <div className="space-y-2">
                    <Label htmlFor="answer">Correct Answer</Label>
                    <Textarea
                      id="answer"
                      value={currentQuestion.correctAnswer}
                      onChange={(e) => setCurrentQuestion(prev => ({ ...prev, correctAnswer: e.target.value }))}
                      placeholder="Enter the correct answer"
                      rows={3}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="explanation">Explanation (Optional)</Label>
                  <Textarea
                    id="explanation"
                    value={currentQuestion.explanation}
                    onChange={(e) => setCurrentQuestion(prev => ({ ...prev, explanation: e.target.value }))}
                    placeholder="Explain why this is the correct answer"
                    rows={2}
                  />
                </div>

                <Button 
                  onClick={handleAddQuestion}
                  variant="gradient"
                  disabled={!currentQuestion.question || !currentQuestion.correctAnswer}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Submit Quiz */}
          <div className="flex gap-2">
            <Button 
              onClick={handleSubmitQuiz}
              variant="gradient"
              disabled={!quiz.title || quiz.questions.length === 0}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Quiz
            </Button>
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
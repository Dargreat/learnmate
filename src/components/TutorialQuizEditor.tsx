import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, Trash2, Save, X, Upload, Link, Edit, Check } from "lucide-react";
import { FileUpload } from "@/components/FileUpload";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Question {
  id?: string;
  question: string;
  type: 'multiple-choice' | 'theory';
  options?: string[];
  correctAnswer: string;
  explanation?: string;
}

interface Quiz {
  id?: string;
  title: string;
  type: 'multiple-choice' | 'theory';
  questions: Question[];
}

interface Tutorial {
  id?: string;
  title: string;
  description: string;
  video_url: string;
  subject: string;
  level: string;
  duration: string;
  uploader_name: string;
  quizzes?: Quiz[];
}

interface TutorialQuizEditorProps {
  tutorial?: Tutorial | null;
  onSave: (tutorial: Tutorial, quizzes: Quiz[]) => void;
  onCancel: () => void;
}

export const TutorialQuizEditor = ({ tutorial, onSave, onCancel }: TutorialQuizEditorProps) => {
  const { toast } = useToast();
  const [videoUploadType, setVideoUploadType] = useState<'link' | 'upload'>('link');
  const [activeTab, setActiveTab] = useState('tutorial');
  
  const [tutorialForm, setTutorialForm] = useState({
    title: tutorial?.title || '',
    description: tutorial?.description || '',
    video_url: tutorial?.video_url || '',
    subject: tutorial?.subject || '',
    level: tutorial?.level || '',
    duration: tutorial?.duration || '',
    uploader_name: tutorial?.uploader_name || 'Admin'
  });

  const [quizzes, setQuizzes] = useState<Quiz[]>(tutorial?.quizzes || []);
  const [currentQuiz, setCurrentQuiz] = useState<Quiz>({
    title: '',
    type: 'multiple-choice',
    questions: []
  });
  const [editingQuizIndex, setEditingQuizIndex] = useState<number | null>(null);
  const [showQuizForm, setShowQuizForm] = useState(false);

  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    question: '',
    type: 'multiple-choice',
    options: ['', '', '', ''],
    correctAnswer: '',
    explanation: ''
  });
  const [showQuestionForm, setShowQuestionForm] = useState(false);

  const subjects = ['mathematics', 'programming', 'science', 'language', 'business'];
  const levels = ['high-school', 'undergraduate', 'graduate', 'professional', 'self-learner'];

  useEffect(() => {
    // Update form when tutorial prop changes
    if (tutorial) {
      setTutorialForm({
        title: tutorial.title,
        description: tutorial.description,
        video_url: tutorial.video_url,
        subject: tutorial.subject,
        level: tutorial.level,
        duration: tutorial.duration,
        uploader_name: tutorial.uploader_name
      });
    }

    const loadExistingQuizzes = async () => {
      if (tutorial?.id) {
        try {
          const { data: assessments, error } = await supabase
            .from('assessments')
            .select(`
              *,
              questions (*)
            `)
            .eq('tutorial_id', tutorial.id);

          if (error) throw error;

          const loadedQuizzes = (assessments || []).map(assessment => ({
            id: assessment.id,
            title: assessment.title,
            type: assessment.type as 'multiple-choice' | 'theory',
            questions: (assessment.questions || []).map((q: any) => ({
              id: q.id,
              question: q.question,
              type: q.type as 'multiple-choice' | 'theory',
              options: q.options,
              correctAnswer: q.correct_answer,
              explanation: q.explanation
            }))
          }));

          setQuizzes(loadedQuizzes);
        } catch (error: any) {
          console.error('Error loading quizzes:', error);
        }
      }
    };

    loadExistingQuizzes();
  }, [tutorial]);

  const handleAddQuestion = () => {
    if (!currentQuestion.question || !currentQuestion.correctAnswer) return;

    const newQuestion: Question = {
      ...currentQuestion,
      id: currentQuestion.id || `temp-${Date.now()}`
    };

    setCurrentQuiz(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));

    resetQuestionForm();
    setShowQuestionForm(false);
  };

  const handleEditQuestion = (index: number) => {
    const question = currentQuiz.questions[index];
    setCurrentQuestion({ ...question });
    setShowQuestionForm(true);
  };

  const handleUpdateQuestion = () => {
    if (!currentQuestion.question || !currentQuestion.correctAnswer) return;

    setCurrentQuiz(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === currentQuestion.id ? currentQuestion : q
      )
    }));

    resetQuestionForm();
    setShowQuestionForm(false);
  };

  const handleRemoveQuestion = (index: number) => {
    setCurrentQuiz(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  const resetQuestionForm = () => {
    setCurrentQuestion({
      question: '',
      type: currentQuiz.type,
      options: currentQuiz.type === 'multiple-choice' ? ['', '', '', ''] : undefined,
      correctAnswer: '',
      explanation: ''
    });
  };

  const handleSaveQuiz = () => {
    if (!currentQuiz.title || currentQuiz.questions.length === 0) {
      toast({
        title: "Validation Error",
        description: "Quiz must have a title and at least one question",
        variant: "destructive"
      });
      return;
    }

    if (editingQuizIndex !== null) {
      setQuizzes(prev => prev.map((quiz, index) => 
        index === editingQuizIndex ? { ...currentQuiz } : quiz
      ));
      setEditingQuizIndex(null);
    } else {
      setQuizzes(prev => [...prev, { ...currentQuiz, id: `temp-${Date.now()}` }]);
    }

    resetQuizForm();
    setShowQuizForm(false);
  };

  const handleEditQuiz = (index: number) => {
    setCurrentQuiz({ ...quizzes[index] });
    setEditingQuizIndex(index);
    setShowQuizForm(true);
  };

  const handleRemoveQuiz = (index: number) => {
    setQuizzes(prev => prev.filter((_, i) => i !== index));
  };

  const resetQuizForm = () => {
    setCurrentQuiz({
      title: '',
      type: 'multiple-choice',
      questions: []
    });
  };

  const updateQuestionOption = (index: number, value: string) => {
    const newOptions = [...(currentQuestion.options || [])];
    newOptions[index] = value;
    setCurrentQuestion(prev => ({ ...prev, options: newOptions }));
  };

  const handleSubmit = () => {
    if (!tutorialForm.title || !tutorialForm.description || !tutorialForm.video_url) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required tutorial fields",
        variant: "destructive"
      });
      return;
    }

    onSave(
      {
        ...tutorial,
        ...tutorialForm,
      },
      quizzes
    );
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            {tutorial ? 'Edit Tutorial & Quizzes' : 'Create Tutorial & Quizzes'}
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tutorial">Tutorial Details</TabsTrigger>
            <TabsTrigger value="quizzes">Quizzes ({quizzes.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="tutorial" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tutorial Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Tutorial Title *</Label>
                    <Input
                      id="title"
                      value={tutorialForm.title}
                      onChange={(e) => setTutorialForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter tutorial title"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration *</Label>
                    <Input
                      id="duration"
                      value={tutorialForm.duration}
                      onChange={(e) => setTutorialForm(prev => ({ ...prev, duration: e.target.value }))}
                      placeholder="e.g., 45 min"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={tutorialForm.description}
                    onChange={(e) => setTutorialForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what students will learn"
                    rows={3}
                    required
                  />
                </div>

                <div className="space-y-4">
                  <Label>Video Source</Label>
                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant={videoUploadType === 'link' ? 'default' : 'outline'}
                      onClick={() => setVideoUploadType('link')}
                      className="flex items-center gap-2"
                    >
                      <Link className="h-4 w-4" />
                      Video Link
                    </Button>
                    <Button
                      type="button"
                      variant={videoUploadType === 'upload' ? 'default' : 'outline'}
                      onClick={() => setVideoUploadType('upload')}
                      className="flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Upload Video
                    </Button>
                  </div>

                  {videoUploadType === 'link' ? (
                    <Input
                      value={tutorialForm.video_url}
                      onChange={(e) => setTutorialForm(prev => ({ ...prev, video_url: e.target.value }))}
                      placeholder="YouTube, Vimeo, or direct video link"
                      required
                    />
                  ) : (
                    <FileUpload
                      bucket="tutorial-videos"
                      accept="video/*"
                      maxSize={100}
                      currentFile={tutorialForm.video_url.startsWith('http') ? undefined : tutorialForm.video_url}
                      placeholder="Upload a video file (MP4, WebM, etc.)"
                      onFileUploaded={(url, fileName) => {
                        setTutorialForm(prev => ({ ...prev, video_url: url }));
                        toast({
                          title: "Video uploaded successfully",
                          description: `${fileName} is ready to use`
                        });
                      }}
                      onFileRemoved={() => {
                        setTutorialForm(prev => ({ ...prev, video_url: '' }));
                      }}
                    />
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Subject *</Label>
                    <Select
                      value={tutorialForm.subject}
                      onValueChange={(value) => setTutorialForm(prev => ({ ...prev, subject: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map(subject => (
                          <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Level *</Label>
                    <Select
                      value={tutorialForm.level}
                      onValueChange={(value) => setTutorialForm(prev => ({ ...prev, level: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        {levels.map(level => (
                          <SelectItem key={level} value={level}>{level.replace('-', ' ')}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quizzes" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Tutorial Quizzes</CardTitle>
                    <CardDescription>Add quizzes to test student understanding</CardDescription>
                  </div>
                  <Button 
                    onClick={() => setShowQuizForm(true)}
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Quiz
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {quizzes.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No quizzes added yet</p>
                ) : (
                  <div className="space-y-4">
                    {quizzes.map((quiz, index) => (
                      <Card key={quiz.id || index} className="border border-muted">
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-medium">{quiz.title}</h3>
                                <Badge variant="outline">{quiz.type}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {quiz.questions.length} question(s)
                              </p>
                              <div className="space-y-1">
                                {quiz.questions.slice(0, 2).map((question, qIndex) => (
                                  <p key={qIndex} className="text-xs text-muted-foreground truncate">
                                    {qIndex + 1}. {question.question}
                                  </p>
                                ))}
                                {quiz.questions.length > 2 && (
                                  <p className="text-xs text-muted-foreground">
                                    ...and {quiz.questions.length - 2} more questions
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditQuiz(index)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRemoveQuiz(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quiz Form */}
            {showQuizForm && (
              <Card className="border-primary">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    {editingQuizIndex !== null ? 'Edit Quiz' : 'Add New Quiz'}
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setShowQuizForm(false);
                        setEditingQuizIndex(null);
                        resetQuizForm();
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quizTitle">Quiz Title</Label>
                      <Input
                        id="quizTitle"
                        value={currentQuiz.title}
                        onChange={(e) => setCurrentQuiz(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter quiz title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Quiz Type</Label>
                      <Select
                        value={currentQuiz.type}
                        onValueChange={(value: 'multiple-choice' | 'theory') => {
                          setCurrentQuiz(prev => ({ ...prev, type: value }));
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
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Questions ({currentQuiz.questions.length})</h4>
                      <Button 
                        size="sm"
                        onClick={() => setShowQuestionForm(true)}
                        variant="outline"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Question
                      </Button>
                    </div>

                    {currentQuiz.questions.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">No questions added yet</p>
                    ) : (
                      <div className="space-y-2">
                        {currentQuiz.questions.map((question, index) => (
                          <div key={question.id || index} className="border rounded-lg p-3 bg-muted/50">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="text-sm font-medium">
                                  {index + 1}. {question.question}
                                </p>
                                {question.type === 'multiple-choice' && question.options && (
                                  <div className="mt-1 space-y-1">
                                    {question.options.map((option, optIndex) => (
                                      <p key={optIndex} className={`text-xs ${option === question.correctAnswer ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                                        {String.fromCharCode(65 + optIndex)}. {option} {option === question.correctAnswer && '✓'}
                                      </p>
                                    ))}
                                  </div>
                                )}
                                {question.type === 'theory' && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Answer: {question.correctAnswer}
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditQuestion(index)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleRemoveQuestion(index)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Question Form */}
                  {showQuestionForm && (
                    <Card className="border-secondary">
                      <CardHeader>
                        <CardTitle className="flex justify-between items-center text-lg">
                          {currentQuestion.id ? 'Edit Question' : 'Add Question'}
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setShowQuestionForm(false);
                              resetQuestionForm();
                            }}
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
                            rows={2}
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
                                    <Label htmlFor={`option-${index}`} className="text-sm">
                                      {String.fromCharCode(65 + index)}: {option || 'Enter option first'}
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
                              rows={2}
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
                          onClick={currentQuestion.id ? handleUpdateQuestion : handleAddQuestion}
                          variant="secondary"
                          disabled={!currentQuestion.question || !currentQuestion.correctAnswer}
                          className="w-full"
                        >
                          <Check className="h-4 w-4 mr-2" />
                          {currentQuestion.id ? 'Update Question' : 'Add Question'}
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  <Button 
                    onClick={handleSaveQuiz}
                    variant="gradient"
                    disabled={!currentQuiz.title || currentQuiz.questions.length === 0}
                    className="w-full"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {editingQuizIndex !== null ? 'Update Quiz' : 'Save Quiz'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <Button 
            onClick={handleSubmit}
            variant="gradient"
            className="flex-1"
            disabled={!tutorialForm.title || !tutorialForm.description || !tutorialForm.video_url}
          >
            <Save className="h-4 w-4 mr-2" />
            {tutorial ? 'Update Tutorial' : 'Create Tutorial'}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
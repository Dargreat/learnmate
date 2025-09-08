import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Play, CheckCircle, Award, Clock, BookOpen, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { VideoPlayer } from "./VideoPlayer";
import { useSupabaseTutorials } from "@/hooks/useSupabaseTutorials";

interface Tutorial {
  id: string;
  title: string;
  description: string;
  video_url: string;
  subject: string;
  level: string;
  duration: string;
  uploader_name: string;
  quizzes?: Quiz[];
}

interface Quiz {
  id: string;
  title: string;
  type: 'multiple-choice' | 'theory';
  questions: Question[];
}

interface Question {
  id: string;
  question: string;
  type: 'multiple-choice' | 'theory';
  options?: string[];
  correctAnswer: string;
  explanation?: string;
}

interface UserProgress {
  tutorialId: string;
  videoWatched: boolean;
  videoProgress: number;
  quizResults: Record<string, {
    score: number;
    answers: Record<string, string>;
    completed: boolean;
  }>;
  completedAt?: string;
}

interface TutorialViewerProps {
  tutorial: Tutorial;
  userProgress: UserProgress | null;
  onBack: () => void;
  onProgressUpdate: (progress: UserProgress) => void;
}

export const TutorialViewer = ({ tutorial, userProgress, onBack, onProgressUpdate }: TutorialViewerProps) => {
  const [currentStep, setCurrentStep] = useState<'video' | 'quiz' | 'complete'>('video');
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizResults, setQuizResults] = useState<any[]>([]);
  const [videoWatched, setVideoWatched] = useState(userProgress?.videoWatched || false);
  const [videoProgress, setVideoProgress] = useState(userProgress?.videoProgress || 0);
  const { toast } = useToast();
  const { updateUserProgress } = useSupabaseTutorials();

  const currentQuiz = tutorial.quizzes?.[currentQuizIndex];
  const hasQuizzes = tutorial.quizzes?.length > 0;

  // Handle video progress updates
  const handleVideoProgressUpdate = async (progress: number) => {
    setVideoProgress(progress);
    
    // Update database with new progress
    const result = await updateUserProgress(tutorial.id, {
      video_progress: progress,
      video_watched: progress >= 80 // Mark as watched when 80% complete
    });

    // Auto-advance when video is mostly watched
    if (progress >= 80 && !videoWatched) {
      setVideoWatched(true);
      onProgressUpdate({
        tutorialId: tutorial.id,
        videoWatched: true,
        videoProgress: progress,
        quizResults: userProgress?.quizResults || {},
        completedAt: userProgress?.completedAt
      });
      toast({
        title: "Great progress!",
        description: "You've watched most of the video. You can now proceed to the quiz."
      });
    }
  };

  const handleVideoComplete = async () => {
    setVideoWatched(true);
    setVideoProgress(100);
    
    // Update progress in database - set completed_at if no quizzes
    await updateUserProgress(tutorial.id, {
      video_progress: 100,
      video_watched: true,
      completed_at: hasQuizzes ? undefined : new Date().toISOString()
    });

    // Update parent component state
    onProgressUpdate({
      tutorialId: tutorial.id,
      videoWatched: true,
      videoProgress: 100,
      quizResults: userProgress?.quizResults || {},
      completedAt: hasQuizzes ? userProgress?.completedAt : new Date().toISOString()
    });

    if (hasQuizzes) {
      setCurrentStep('quiz');
    } else {
      setCurrentStep('complete');
      markTutorialComplete();
    }
  };

  const handleQuizSubmit = () => {
    if (!currentQuiz) return;

    let score = 0;
    const results: any[] = [];

    currentQuiz.questions.forEach(question => {
      const userAnswer = quizAnswers[question.id] || '';
      const isCorrect = userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
      
      if (isCorrect) score++;
      
      results.push({
        questionId: question.id,
        question: question.question,
        userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        explanation: question.explanation
      });
    });

    const percentage = Math.round((score / currentQuiz.questions.length) * 100);
    
    setQuizResults(prev => [...prev, {
      quizId: currentQuiz.id,
      score: percentage,
      results
    }]);

    toast({
      title: `Quiz completed!`,
      description: `You scored ${percentage}% (${score}/${currentQuiz.questions.length})`
    });

    // Move to next quiz or complete
    if (tutorial.quizzes && currentQuizIndex < tutorial.quizzes.length - 1) {
      setCurrentQuizIndex(prev => prev + 1);
      setQuizAnswers({});
    } else {
      setCurrentStep('complete');
      markTutorialComplete();
    }
  };

  const markTutorialComplete = async () => {
    console.log('Marking tutorial as complete');
    // Update database with completion
    const result = await updateUserProgress(tutorial.id, {
      video_progress: 100,
      video_watched: true,
      completed_at: new Date().toISOString()
    });
    
    console.log('Completion update result:', result);

    const progress: UserProgress = {
      tutorialId: tutorial.id,
      videoWatched: true,
      videoProgress: 100, // Mark as 100% when completed
      quizResults: quizResults.reduce((acc, result) => ({
        ...acc,
        [result.quizId]: {
          score: result.score,
          answers: {},
          completed: true
        }
      }), {}),
      completedAt: new Date().toISOString()
    };

    onProgressUpdate(progress);
    toast({
      title: "Tutorial completed!",
      description: "Great job! You've successfully completed this tutorial."
    });
  };

  const getEmbedUrl = (url: string) => {
    if (url.includes('youtube.com/watch')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes('vimeo.com/')) {
      const videoId = url.split('vimeo.com/')[1];
      return `https://player.vimeo.com/video/${videoId}`;
    }
    return url;
  };

  const totalQuizzes = tutorial.quizzes?.length || 0;
  const completedQuizzes = quizResults.length;
  const overallProgress = hasQuizzes ? 
    Math.round(((videoProgress/100 + completedQuizzes) / (1 + totalQuizzes)) * 100) :
    Math.round(videoProgress);

  return (
    <div className="min-h-screen bg-gradient-bg">
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={onBack} size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span className="hidden sm:block">Back to Dashboard</span>
                <span className="sm:hidden">Back</span>
              </Button>
              <h1 className="text-lg sm:text-xl font-bold truncate">{tutorial.title}</h1>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs">{tutorial.subject}</Badge>
              <Badge variant="secondary" className="text-xs">{tutorial.level.replace('-', ' ')}</Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Progress Overview */}
        <Card className="mb-8 shadow-soft border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Tutorial Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span>{Math.round(overallProgress)}%</span>
              </div>
              <Progress value={overallProgress} className="h-3" />
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="space-y-1">
                  <div className={`text-2xl ${videoWatched ? 'text-primary' : 'text-muted-foreground'}`}>
                    {videoWatched ? <CheckCircle className="h-6 w-6 mx-auto" /> : <Play className="h-6 w-6 mx-auto" />}
                  </div>
                  <p className="text-sm">Video</p>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl text-muted-foreground">
                    <FileText className="h-6 w-6 mx-auto" />
                  </div>
                  <p className="text-sm">{totalQuizzes} Quizzes</p>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-primary">
                    {completedQuizzes}/{totalQuizzes}
                  </div>
                  <p className="text-sm">Completed</p>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl text-muted-foreground">
                    <Clock className="h-6 w-6 mx-auto" />
                  </div>
                  <p className="text-sm">{tutorial.duration}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content based on current step */}
        {currentStep === 'video' && (
          <Card className="shadow-soft border-0">
            <CardHeader>
              <CardTitle>{tutorial.title}</CardTitle>
              <CardDescription>{tutorial.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <VideoPlayer
                src={tutorial.video_url}
                title={tutorial.title}
                onProgressUpdate={handleVideoProgressUpdate}
                initialProgress={videoProgress}
              />
              
              <div className="mt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Video Progress</span>
                  <span>{Math.round(videoProgress)}%</span>
                </div>
                
                {videoProgress >= 80 && hasQuizzes && (
                  <Button 
                    onClick={() => setCurrentStep('quiz')}
                    variant="gradient"
                    className="w-full"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Continue to Quiz
                  </Button>
                )}
                
                {videoProgress >= 80 && !hasQuizzes && (
                  <Button 
                    onClick={handleVideoComplete}
                    variant="gradient"
                    className="w-full"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Complete Tutorial
                  </Button>
                )}
                
                {videoProgress < 80 && (
                  <Button 
                    onClick={handleVideoComplete}
                    variant="outline"
                    className="w-full"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Watched (Skip to {hasQuizzes ? 'Quiz' : 'Complete'})
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 'quiz' && currentQuiz && (
          <Card className="shadow-soft border-0">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {currentQuiz.title}
                <Badge variant="outline">
                  Quiz {currentQuizIndex + 1} of {totalQuizzes}
                </Badge>
              </CardTitle>
              <CardDescription>
                {currentQuiz.type === 'multiple-choice' ? 'Choose the best answer' : 'Provide detailed answers'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {currentQuiz.questions.map((question, index) => (
                <div key={question.id} className="space-y-4">
                  <h3 className="font-medium text-lg">
                    {index + 1}. {question.question}
                  </h3>
                  
                  {question.type === 'multiple-choice' && question.options ? (
                    <RadioGroup
                      value={quizAnswers[question.id] || ''}
                      onValueChange={(value) => setQuizAnswers(prev => ({
                        ...prev,
                        [question.id]: value
                      }))}
                    >
                      {question.options.map((option, optIndex) => (
                        <div key={optIndex} className="flex items-center space-x-2">
                          <RadioGroupItem value={option} id={`${question.id}-${optIndex}`} />
                          <Label htmlFor={`${question.id}-${optIndex}`} className="cursor-pointer">
                            {String.fromCharCode(65 + optIndex)}. {option}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  ) : (
                    <Textarea
                      value={quizAnswers[question.id] || ''}
                      onChange={(e) => setQuizAnswers(prev => ({
                        ...prev,
                        [question.id]: e.target.value
                      }))}
                      placeholder="Enter your answer..."
                      rows={4}
                    />
                  )}
                </div>
              ))}
              
              <Button 
                onClick={handleQuizSubmit}
                variant="gradient"
                className="w-full"
                disabled={currentQuiz.questions.some(q => !quizAnswers[q.id])}
              >
                Submit Quiz
              </Button>
            </CardContent>
          </Card>
        )}

        {currentStep === 'complete' && (
          <Card className="shadow-soft border-0 text-center">
            <CardContent className="py-12">
              <Award className="h-16 w-16 mx-auto text-primary mb-6" />
              <h2 className="text-3xl font-bold mb-4">Congratulations!</h2>
              <p className="text-muted-foreground mb-6">
                You have successfully completed "{tutorial.title}"
              </p>
              
              {quizResults.length > 0 && (
                <div className="space-y-4 mb-6">
                  <h3 className="text-lg font-semibold">Quiz Results</h3>
                  {quizResults.map((result, index) => (
                    <div key={index} className="bg-muted/50 rounded-lg p-4">
                      <p className="font-medium">Quiz {index + 1}: {result.score}%</p>
                    </div>
                  ))}
                </div>
              )}
              
              <Button onClick={onBack} variant="gradient" size="lg">
                Return to Dashboard
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
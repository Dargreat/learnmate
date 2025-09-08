import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, ChevronLeft, BookOpen, Target, Clock, Award } from "lucide-react";

interface PersonalizationFlowProps {
  user: any;
  onComplete: (preferences: any) => void;
}

interface Question {
  id: string;
  title: string;
  description: string;
  icon: any;
  options: { value: string; label: string; description?: string }[];
}

const questions: Question[] = [
  {
    id: 'subject',
    title: 'What are you studying today?',
    description: 'Choose your primary area of focus',
    icon: BookOpen,
    options: [
      { value: 'mathematics', label: 'Mathematics', description: 'Algebra, Calculus, Statistics' },
      { value: 'science', label: 'Science', description: 'Physics, Chemistry, Biology' },
      { value: 'programming', label: 'Programming', description: 'JavaScript, Python, Web Development' },
      { value: 'language', label: 'Languages', description: 'English, Spanish, French' },
      { value: 'business', label: 'Business', description: 'Marketing, Finance, Management' }
    ]
  },
  {
    id: 'level',
    title: 'What is your education level?',
    description: 'Help us match content to your level',
    icon: Award,
    options: [
      { value: 'high-school', label: 'High School', description: 'Grades 9-12' },
      { value: 'undergraduate', label: 'Undergraduate', description: 'Bachelor\'s degree student' },
      { value: 'graduate', label: 'Graduate', description: 'Master\'s or PhD student' },
      { value: 'professional', label: 'Professional', description: 'Working professional' },
      { value: 'self-learner', label: 'Self-Learner', description: 'Learning independently' }
    ]
  },
  {
    id: 'goals',
    title: 'What are your learning goals?',
    description: 'What do you want to achieve?',
    icon: Target,
    options: [
      { value: 'exam-prep', label: 'Exam Preparation', description: 'Preparing for tests or certifications' },
      { value: 'skill-building', label: 'Skill Building', description: 'Developing new abilities' },
      { value: 'career-change', label: 'Career Change', description: 'Transitioning to a new field' },
      { value: 'hobby', label: 'Personal Interest', description: 'Learning for fun and enrichment' },
      { value: 'academic', label: 'Academic Success', description: 'Improving grades and understanding' }
    ]
  },
  {
    id: 'pace',
    title: 'What is your preferred learning pace?',
    description: 'How quickly do you like to progress?',
    icon: Clock,
    options: [
      { value: 'fast', label: 'Fast Track', description: 'I want to learn quickly and efficiently' },
      { value: 'moderate', label: 'Steady Progress', description: 'I prefer a balanced, sustainable pace' },
      { value: 'slow', label: 'Take My Time', description: 'I like to thoroughly understand each concept' },
      { value: 'flexible', label: 'Flexible', description: 'My pace varies depending on the topic' }
    ]
  }
];

export const PersonalizationFlow = ({ user, onComplete }: PersonalizationFlowProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  const handleAnswer = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete personalization
      const preferences = {
        ...answers,
        completedAt: new Date().toISOString()
      };
      onComplete(preferences);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = answers[currentQuestion.id];

  return (
    <div className="min-h-screen bg-gradient-bg flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-3 sm:space-y-4">
          <h1 className="text-2xl sm:text-3xl font-bold">Let's Personalize Your Learning</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Answer a few quick questions to create your perfect learning experience
          </p>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs sm:text-sm text-muted-foreground">
            <span>Question {currentStep + 1} of {questions.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        <Card className="shadow-soft animate-scale-in">
          <CardHeader className="text-center space-y-3 sm:space-y-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto">
              <currentQuestion.icon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <CardTitle className="text-xl sm:text-2xl">{currentQuestion.title}</CardTitle>
            <CardDescription className="text-sm sm:text-base">{currentQuestion.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup
              value={answers[currentQuestion.id] || ''}
              onValueChange={(value) => handleAnswer(currentQuestion.id, value)}
            >
              {currentQuestion.options.map((option) => (
                <div key={option.value} className="flex items-start space-x-3 p-3 sm:p-4 rounded-lg border hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor={option.value} className="text-sm sm:text-base font-medium cursor-pointer">
                      {option.label}
                    </Label>
                    {option.description && (
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">{option.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between gap-4">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex items-center gap-2 flex-1 sm:flex-initial"
            size="sm"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:block">Previous</span>
            <span className="sm:hidden">Prev</span>
          </Button>
          
          <Button
            onClick={handleNext}
            disabled={!canProceed}
            variant="gradient"
            className="flex items-center gap-2 flex-1 sm:flex-initial"
            size="sm"
          >
            <span className="sm:hidden">{currentStep === questions.length - 1 ? 'Complete' : 'Next'}</span>
            <span className="hidden sm:block">{currentStep === questions.length - 1 ? 'Complete Setup' : 'Next'}</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
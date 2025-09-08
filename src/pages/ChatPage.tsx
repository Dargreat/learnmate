import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { 
  ArrowLeft,
  Bot, 
  User, 
  BookOpen, 
  Target,
  Award,
  Settings,
  HelpCircle,
  TrendingUp,
  MessageCircle,
  LogOut
} from "lucide-react";

interface Message {
  id: string;
  type: 'bot' | 'user';
  content: string;
  timestamp: Date;
}

interface QuickQuestion {
  id: string;
  question: string;
  answer: string;
  category: 'learning' | 'progress' | 'features' | 'account';
}

const quickQuestions: QuickQuestion[] = [
  {
    id: '1',
    question: 'How do I track my learning progress?',
    answer: 'Your progress is automatically tracked as you watch videos and complete quizzes. You can see your overall progress in the dashboard cards and individual tutorial progress bars. Completed tutorials show a green checkmark.',
    category: 'progress'
  },
  {
    id: '2', 
    question: 'How are tutorials personalized for me?',
    answer: 'Tutorials are personalized based on your preferences set during onboarding - your subject interest, education level, and learning goals. The system prioritizes content that matches your profile and shows "Recommended" tutorials first.',
    category: 'learning'
  },
  {
    id: '3',
    question: 'Can I switch between different subjects?',
    answer: 'Yes! You can use the category filters to explore tutorials in different subjects. Click "View All" to see content beyond your personalized recommendations, or use the subject filter buttons.',
    category: 'features'
  },
  {
    id: '4',
    question: 'What do the difficulty badges mean?',
    answer: 'Difficulty badges show the educational level: High School (beginner), Undergraduate (intermediate), Graduate/Professional (advanced). These help you find content appropriate for your skill level.',
    category: 'learning'
  },
  {
    id: '5',
    question: 'How do I complete a tutorial?',
    answer: 'To complete a tutorial, watch the video fully and complete any associated quiz. Your progress is saved automatically, and you can resume where you left off if you need to take a break.',
    category: 'learning'
  },
  {
    id: '6',
    question: 'Can I retake quizzes?',
    answer: 'Yes, you can retake quizzes to improve your understanding and score. Your best score is typically recorded, and you can access quizzes from the tutorial viewer.',
    category: 'features'
  },
  {
    id: '7',
    question: 'What does my average quiz score represent?',
    answer: 'Your average quiz score shows your overall performance across completed quizzes. This helps track your comprehension and learning effectiveness over time.',
    category: 'progress'
  },
  {
    id: '8',
    question: 'How can I update my learning preferences?',
    answer: 'You can update your preferences through your account settings. This will adjust which tutorials are recommended to you and help personalize your learning experience.',
    category: 'account'
  },
  {
    id: '9',
    question: 'Why am I seeing "Recommended" vs "All" tutorials?',
    answer: 'Recommended tutorials are filtered based on your learning preferences and goals. "All" tutorials shows the complete library. We suggest starting with recommended content for the best personalized experience.',
    category: 'learning'
  },
  {
    id: '10',
    question: 'How often is new content added?',
    answer: 'New tutorials are added regularly by our content team and educators. You\'ll see the latest additions in your dashboard, and we prioritize content that matches user interests and requests.',
    category: 'features'
  },
  {
    id: '11',
    question: 'How do I access my account settings?',
    answer: 'You can access your account settings from the dashboard header. Look for the user icon or settings button to modify your profile and learning preferences.',
    category: 'account'
  },
  {
    id: '12',
    question: 'What should I do if a video won\'t load?',
    answer: 'If a video won\'t load, try refreshing the page first. Check your internet connection and ensure your browser supports video playback. If issues persist, contact support.',
    category: 'features'
  }
];

export const ChatPage = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [showQuestions, setShowQuestions] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    // Only redirect if loading is complete and user is null
    if (!loading && !user) {
      navigate('/');
      return;
    }

    // Initialize chat only if user is loaded
    if (user && !loading) {
      // Initialize welcome message
      const welcomeMessage: Message = {
        id: '1',
        type: 'bot',
        content: `Hi ${user.user_metadata?.display_name || 'there'}! 👋 Welcome to LearnMate Support. I'm here to help you with any questions about the platform. What can I help you with today?`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [user, loading, navigate]);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleQuestionClick = (question: QuickQuestion) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: question.question,
      timestamp: new Date()
    };

    const botResponse: Message = {
      id: (Date.now() + 1).toString(),
      type: 'bot',
      content: question.answer,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage, botResponse]);
    setShowQuestions(false);
  };

  const handleBackToQuestions = () => {
    setShowQuestions(true);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'learning': return <BookOpen className="h-4 w-4" />;
      case 'progress': return <TrendingUp className="h-4 w-4" />;
      case 'features': return <Settings className="h-4 w-4" />;
      case 'account': return <User className="h-4 w-4" />;
      default: return <HelpCircle className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'learning': return 'bg-primary/10 text-primary border-primary/20';
      case 'progress': return 'bg-secondary/10 text-secondary-foreground border-secondary/20';
      case 'features': return 'bg-accent/10 text-accent-foreground border-accent/20';
      case 'account': return 'bg-muted/10 text-muted-foreground border-muted/20';
      default: return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  const categories = ['all', 'learning', 'progress', 'features', 'account'];
  
  const filteredQuestions = selectedCategory === 'all' 
    ? quickQuestions 
    : quickQuestions.filter(q => q.category === selectedCategory);

  if (!user && loading) {
    return (
      <div className="min-h-screen bg-gradient-bg flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-bg">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:block">Back to Dashboard</span>
            </Button>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-gradient-primary rounded-full flex items-center justify-center">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <h1 className="text-xl font-bold">LearnMate Assistant</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span className="hidden sm:block">{user.user_metadata?.display_name || user.email}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:block ml-2">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4 lg:py-8">
        <div className="max-w-4xl mx-auto flex flex-col lg:grid lg:grid-cols-3 gap-4 lg:gap-6 h-[calc(100vh-120px)]">
          {/* Chat Area */}
          <div className="lg:col-span-2 flex-1 lg:flex-none">
            <Card className="h-full flex flex-col shadow-soft border-0">
              <CardHeader className="flex-shrink-0 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-gradient-primary rounded-full flex items-center justify-center">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle>Chat with LearnMate Assistant</CardTitle>
                    <p className="text-sm text-muted-foreground">Get help with your learning journey</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col p-0">
                {/* Messages Area */}
                <ScrollArea className="flex-1 px-6">
                  <div className="space-y-4 pb-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] p-4 rounded-lg ${
                            message.type === 'user'
                              ? 'bg-primary text-primary-foreground ml-4'
                              : 'bg-muted mr-4'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {message.type === 'bot' && (
                              <Bot className="h-5 w-5 mt-0.5 flex-shrink-0" />
                            )}
                            <div>
                              <p className="leading-relaxed">{message.content}</p>
                              <p className="text-xs opacity-70 mt-2">
                                {message.timestamp.toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {/* Back to Questions Button */}
                {!showQuestions && messages.length > 1 && (
                  <div className="border-t p-4">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleBackToQuestions}
                    >
                      <HelpCircle className="h-4 w-4 mr-2" />
                      More Questions
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Questions Sidebar */}
          <div className="lg:col-span-1 flex-shrink-0">
            <Card className="shadow-soft border-0 h-full lg:h-auto max-h-[60vh] lg:max-h-[70vh]">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
                  <MessageCircle className="h-4 w-4 lg:h-5 lg:w-5" />
                  Quick Questions
                </CardTitle>
                <p className="text-xs lg:text-sm text-muted-foreground">
                  Click on any question to get instant help
                </p>
              </CardHeader>

              <CardContent className="space-y-3 lg:space-y-4 p-4 lg:p-6">
                {/* Category Filters */}
                <div className="flex flex-wrap gap-1 lg:gap-2">
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                      className="capitalize text-xs h-7 lg:h-8 px-2 lg:px-3"
                    >
                      {category === 'all' ? 'All' : category}
                    </Button>
                  ))}
                </div>

                {/* Questions List */}
                <ScrollArea className="h-[40vh] lg:h-[45vh]">
                  <div className="space-y-1 lg:space-y-2 pr-2">
                    {filteredQuestions.map((question) => (
                      <Button
                        key={question.id}
                        variant="ghost"
                        className="w-full justify-start text-left h-auto p-2 lg:p-3 hover:bg-accent/50"
                        onClick={() => handleQuestionClick(question)}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 lg:gap-2">
                            {getCategoryIcon(question.category)}
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getCategoryColor(question.category)}`}
                            >
                              {question.category}
                            </Badge>
                          </div>
                          <p className="text-xs lg:text-sm font-medium text-left leading-tight">
                            {question.question}
                          </p>
                        </div>
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
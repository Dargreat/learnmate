// import { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { ScrollArea } from "@/components/ui/scroll-area";
// import { useAuth } from "@/hooks/useAuth";
// import { 
//   ArrowLeft,
//   Bot, 
//   User, 
//   BookOpen, 
//   Target,
//   Award,
//   Settings,
//   HelpCircle,
//   TrendingUp,
//   MessageCircle,
//   LogOut
// } from "lucide-react";

// interface Message {
//   id: string;
//   type: 'bot' | 'user';
//   content: string;
//   timestamp: Date;
// }

// interface QuickQuestion {
//   id: string;
//   question: string;
//   answer: string;
//   category: 'learning' | 'progress' | 'features' | 'account';
// }

// const quickQuestions: QuickQuestion[] = [
//   {
//     id: '1',
//     question: 'How do I track my learning progress?',
//     answer: 'Your progress is automatically tracked as you watch videos and complete quizzes. You can see your overall progress in the dashboard cards and individual tutorial progress bars. Completed tutorials show a green checkmark.',
//     category: 'progress'
//   },
//   {
//     id: '2', 
//     question: 'How are tutorials personalized for me?',
//     answer: 'Tutorials are personalized based on your preferences set during onboarding - your subject interest, education level, and learning goals. The system prioritizes content that matches your profile and shows "Recommended" tutorials first.',
//     category: 'learning'
//   },
//   {
//     id: '3',
//     question: 'Can I switch between different subjects?',
//     answer: 'Yes! You can use the category filters to explore tutorials in different subjects. Click "View All" to see content beyond your personalized recommendations, or use the subject filter buttons.',
//     category: 'features'
//   },
//   {
//     id: '4',
//     question: 'What do the difficulty badges mean?',
//     answer: 'Difficulty badges show the educational level: High School (beginner), Undergraduate (intermediate), Graduate/Professional (advanced). These help you find content appropriate for your skill level.',
//     category: 'learning'
//   },
//   {
//     id: '5',
//     question: 'How do I complete a tutorial?',
//     answer: 'To complete a tutorial, watch the video fully and complete any associated quiz. Your progress is saved automatically, and you can resume where you left off if you need to take a break.',
//     category: 'learning'
//   },
//   {
//     id: '6',
//     question: 'Can I retake quizzes?',
//     answer: 'Yes, you can retake quizzes to improve your understanding and score. Your best score is typically recorded, and you can access quizzes from the tutorial viewer.',
//     category: 'features'
//   },
//   {
//     id: '7',
//     question: 'What does my average quiz score represent?',
//     answer: 'Your average quiz score shows your overall performance across completed quizzes. This helps track your comprehension and learning effectiveness over time.',
//     category: 'progress'
//   },
//   {
//     id: '8',
//     question: 'How can I update my learning preferences?',
//     answer: 'You can update your preferences through your account settings. This will adjust which tutorials are recommended to you and help personalize your learning experience.',
//     category: 'account'
//   },
//   {
//     id: '9',
//     question: 'Why am I seeing "Recommended" vs "All" tutorials?',
//     answer: 'Recommended tutorials are filtered based on your learning preferences and goals. "All" tutorials shows the complete library. We suggest starting with recommended content for the best personalized experience.',
//     category: 'learning'
//   },
//   {
//     id: '10',
//     question: 'How often is new content added?',
//     answer: 'New tutorials are added regularly by our content team and educators. You\'ll see the latest additions in your dashboard, and we prioritize content that matches user interests and requests.',
//     category: 'features'
//   },
//   {
//     id: '11',
//     question: 'How do I access my account settings?',
//     answer: 'You can access your account settings from the dashboard header. Look for the user icon or settings button to modify your profile and learning preferences.',
//     category: 'account'
//   },
//   {
//     id: '12',
//     question: 'What should I do if a video won\'t load?',
//     answer: 'If a video won\'t load, try refreshing the page first. Check your internet connection and ensure your browser supports video playback. If issues persist, contact support.',
//     category: 'features'
//   }
// ];

// export const ChatPage = () => {
//   const navigate = useNavigate();
//   const { user, loading, signOut } = useAuth();
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [showQuestions, setShowQuestions] = useState(true);
//   const [selectedCategory, setSelectedCategory] = useState<string>('all');

//   useEffect(() => {
//     if (!loading && !user) {
//       navigate('/');
//       return;
//     }

//     if (user && !loading) {
//       const welcomeMessage: Message = {
//         id: '1',
//         type: 'bot',
//         content: `Hi ${user.user_metadata?.display_name || 'there'}! 👋 Welcome to LearnMate Support. I'm here to help you with any questions about the platform. What can I help you with today?`,
//         timestamp: new Date()
//       };
//       setMessages([welcomeMessage]);
//     }
//   }, [user, loading, navigate]);

//   const handleLogout = async () => {
//     await signOut();
//     navigate('/');
//   };

//   const handleQuestionClick = (question: QuickQuestion) => {
//     const userMessage: Message = {
//       id: Date.now().toString(),
//       type: 'user',
//       content: question.question,
//       timestamp: new Date()
//     };

//     const botResponse: Message = {
//       id: (Date.now() + 1).toString(),
//       type: 'bot',
//       content: question.answer,
//       timestamp: new Date()
//     };

//     setMessages(prev => [...prev, userMessage, botResponse]);
//     setShowQuestions(false);
//   };

//   const handleBackToQuestions = () => {
//     setShowQuestions(true);
//   };

//   const getCategoryIcon = (category: string) => {
//     switch (category) {
//       case 'learning': return <BookOpen className="h-4 w-4" />;
//       case 'progress': return <TrendingUp className="h-4 w-4" />;
//       case 'features': return <Settings className="h-4 w-4" />;
//       case 'account': return <User className="h-4 w-4" />;
//       default: return <HelpCircle className="h-4 w-4" />;
//     }
//   };

//   const getCategoryColor = (category: string) => {
//     switch (category) {
//       case 'learning': return 'bg-primary/10 text-primary border-primary/20';
//       case 'progress': return 'bg-secondary/10 text-secondary-foreground border-secondary/20';
//       case 'features': return 'bg-accent/10 text-accent-foreground border-accent/20';
//       case 'account': return 'bg-muted/10 text-muted-foreground border-muted/20';
//       default: return 'bg-muted/10 text-muted-foreground border-muted/20';
//     }
//   };

//   const categories = ['all', 'learning', 'progress', 'features', 'account'];
  
//   const filteredQuestions = selectedCategory === 'all' 
//     ? quickQuestions 
//     : quickQuestions.filter(q => q.category === selectedCategory);

//   if (!user && loading) {
//     return (
//       <div className="min-h-screen bg-gradient-bg flex items-center justify-center">
//         <div className="text-center">
//           <div className="text-lg">Loading...</div>
//         </div>
//       </div>
//     );
//   }

//   if (!user) {
//     return null;
//   }

//   return (
//     <div className="min-h-screen bg-gradient-bg">
//       <h1>Chat Page</h1>
//     </div>
//   );
// };

export const ChatPage = () => {
  return (
    <div className="min-h-screen bg-gradient-bg flex items-center justify-center">
      <div className="text-center p-6">
        <h1 className="text-2xl font-bold mb-4">
          Not needed for now
        </h1>
        <p className="text-lg">
          Do reach out when you need my services, shalom ✌️
        </p>
      </div>
    </div>
  );
};

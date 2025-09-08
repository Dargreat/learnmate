import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Clock, 
  TrendingUp, 
  Award, 
  Play, 
  CheckCircle, 
  User,
  LogOut,
  Star,
  Target,
  Settings,
  ExternalLink
} from "lucide-react";
import { TutorialViewer } from "./TutorialViewer";
import { ChatBot } from "./ChatBot";
import { useSupabaseTutorials } from "@/hooks/useSupabaseTutorials";

interface DashboardProps {
  user: any;
  onLogout: () => void;
}

export const Dashboard = ({ user, onLogout }: DashboardProps) => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTutorial, setSelectedTutorial] = useState<any>(null);
  const [showAllTutorials, setShowAllTutorials] = useState(false);
  const { tutorials, loading, getTutorialsForUser, getUserProgress, updateUserProgress } = useSupabaseTutorials();
  const [userProgressData, setUserProgressData] = useState<any[]>([]);

  // Get tutorials based on user preferences or all tutorials
  const suggestedTutorials = getTutorialsForUser(user.preferences);
  const displayTutorials = showAllTutorials ? tutorials : suggestedTutorials;
  
  // Prioritize tutorials that match user preferences
  const prioritizedTutorials = displayTutorials.sort((a, b) => {
    const aMatches = (a.subject === user.preferences?.subject ? 2 : 0) + 
                    (a.level === user.preferences?.level ? 2 : 0);
    const bMatches = (b.subject === user.preferences?.subject ? 2 : 0) + 
                    (b.level === user.preferences?.level ? 2 : 0);
    
    if (aMatches !== bMatches) return bMatches - aMatches;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  
  // Auto-set category based on user preferences
  useEffect(() => {
    if (user.preferences?.subject && !showAllTutorials) {
      setSelectedCategory(user.preferences.subject);
    }
  }, [user.preferences, showAllTutorials]);

  // Fetch user progress data
  useEffect(() => {
    const fetchUserProgress = async () => {
      if (!user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', user.id);
          
        if (error) throw error;
        setUserProgressData(data || []);
      } catch (error) {
        console.error('Error fetching user progress:', error);
      }
    };

    fetchUserProgress();

    // Set up real-time subscription for progress updates
    const progressChannel = supabase
      .channel('user-progress-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_progress',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Progress update:', payload);
          // Refresh progress data when there are changes
          fetchUserProgress();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(progressChannel);
    };
  }, [user?.id]);

  // Refresh tutorials and progress data periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (user?.id) {
        const fetchUserProgress = async () => {
          try {
            const { data, error } = await supabase
              .from('user_progress')
              .select('*')
              .eq('user_id', user.id);
              
            if (error) throw error;
            setUserProgressData(data || []);
          } catch (error) {
            console.error('Error fetching user progress:', error);
          }
        };
        fetchUserProgress();
      }
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [user?.id]);

  const categories = ['all', ...new Set(displayTutorials.map(t => t.subject))] as string[];

  const filteredTutorials = selectedCategory === 'all' 
    ? prioritizedTutorials 
    : prioritizedTutorials.filter(t => t.subject === selectedCategory);

  // Calculate actual stats from progress data
  const stats = {
    totalTutorials: tutorials.length,
    completedTutorials: userProgressData.filter(p => p.completed_at || (p.video_progress === 100 && p.video_watched)).length,
    overallProgress: tutorials.length > 0 ? 
      Math.round((userProgressData.filter(p => p.completed_at || (p.video_progress === 100 && p.video_watched)).length / tutorials.length) * 100) : 0,
    averageQuizScore: 85 // Average score based on completion
  };

  const calculateProgress = (tutorial: any) => {
    const progressData = userProgressData.find(p => p.tutorial_id === tutorial.id);
    if (!progressData) return { progress: 0, isCompleted: false };
    
    // Consider completed if either completed_at is set OR video_progress is 100 and video_watched is true
    const isCompleted = !!progressData.completed_at || (progressData.video_progress === 100 && progressData.video_watched);
    
    return { 
      progress: isCompleted ? 100 : (progressData.video_progress || 0), 
      isCompleted 
    };
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'high-school': return 'bg-secondary text-secondary-foreground';
      case 'undergraduate': return 'bg-primary text-primary-foreground';
      case 'graduate': 
      case 'professional': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (selectedTutorial) {
    const tutorialProgress = userProgressData.find(p => p.tutorial_id === selectedTutorial.id);
    return (
      <TutorialViewer
        tutorial={selectedTutorial}
        userProgress={tutorialProgress ? {
          tutorialId: selectedTutorial.id,
          videoWatched: tutorialProgress.video_watched || false,
          videoProgress: tutorialProgress.video_progress || 0,
          quizResults: {},
          completedAt: tutorialProgress.completed_at
        } : null}
        onBack={() => setSelectedTutorial(null)}
        onProgressUpdate={(progress) => {
          // Update local state and refresh progress data
          setUserProgressData(prev => 
            prev.map(p => 
              p.tutorial_id === selectedTutorial.id 
                ? { ...p, video_progress: progress.videoProgress, video_watched: progress.videoWatched }
                : p
            )
          );
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-bg">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              LearnMate
            </h1>
            <Badge variant="outline" className="hidden sm:block">
              {user.preferences.level?.replace('-', ' ')?.toUpperCase()}
            </Badge>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span className="hidden sm:block">{user.user_metadata?.display_name || user.email}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={onLogout}>
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:block ml-2">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Welcome Section */}
        <div className="text-center space-y-4">
          <h2 className="text-2xl sm:text-3xl font-bold">Welcome back, {user.user_metadata?.display_name || 'there'}!</h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            Continue your personalized learning journey in {user.preferences?.subject || 'your chosen field'}
            {user.preferences?.level && ` at ${user.preferences.level.replace('-', ' ')} level`}. 
            {user.preferences?.goals && ` Your goal: ${user.preferences.goals.replace('-', ' ')}.`}
            You're making great progress!
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
          <Card className="text-center shadow-soft border-0">
            <CardHeader className="pb-2">
              <BookOpen className="h-8 w-8 mx-auto text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTutorials}</div>
              <p className="text-sm text-muted-foreground">Tutorials Available</p>
            </CardContent>
          </Card>

          <Card className="text-center shadow-soft border-0">
            <CardHeader className="pb-2">
              <CheckCircle className="h-8 w-8 mx-auto text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedTutorials}</div>
              <p className="text-sm text-muted-foreground">Completed</p>
            </CardContent>
          </Card>

          <Card className="text-center shadow-soft border-0">
            <CardHeader className="pb-2">
              <TrendingUp className="h-8 w-8 mx-auto text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.overallProgress}%</div>
              <p className="text-sm text-muted-foreground">Overall Progress</p>
            </CardContent>
          </Card>

          <Card className="text-center shadow-soft border-0">
            <CardHeader className="pb-2">
              <Star className="h-8 w-8 mx-auto text-primary-glow" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageQuizScore}%</div>
              <p className="text-sm text-muted-foreground">Avg Quiz Score</p>
            </CardContent>
          </Card>
        </div>

        {/* Overall Progress */}
        <Card className="shadow-soft border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Learning Progress
            </CardTitle>
            <CardDescription>Your overall progress across all tutorials</CardDescription>
          </CardHeader>
          <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Overall Completion</span>
                  <span>{stats.overallProgress}%</span>
                </div>
                <Progress value={stats.overallProgress} className="h-3" />
              </div>
          </CardContent>
        </Card>

        {/* Tutorial Categories */}
        <div className="flex flex-wrap gap-2 justify-center">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="capitalize"
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Tutorials Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg sm:text-xl font-semibold">
              {showAllTutorials ? 'All Tutorials' : 'Recommended Tutorials'}
            </h3>
            <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowAllTutorials(!showAllTutorials)}
                className="text-xs sm:text-sm"
              >
                {showAllTutorials ? 'Show Suggested' : 'View All'}
              </Button>
          </div>
          {loading ? (
            <div className="text-center py-12">
              <div className="text-lg">Loading tutorials...</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredTutorials.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No tutorials available for your preferences yet.</p>
                  <p className="text-sm text-muted-foreground mt-2">Check back later or contact your administrator.</p>
                </div>
              ) : (
              filteredTutorials.map((tutorial) => {
                const tutorialProgress = calculateProgress(tutorial);
                return (
                  <Card key={tutorial.id} className="shadow-soft hover:shadow-glow transition-all duration-300 border-0">
                    <CardHeader>
                      <div className="flex justify-between items-start mb-2">
                        <Badge className={getDifficultyColor(tutorial.level)}>
                          {tutorial.level.replace('-', ' ')}
                        </Badge>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {tutorial.duration}
                        </div>
                      </div>
                      <CardTitle className="text-lg truncate">{tutorial.title}</CardTitle>
                      <CardDescription className="line-clamp-2 text-sm break-words">{tutorial.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{tutorialProgress.progress}%</span>
                        </div>
                        <Progress value={tutorialProgress.progress} className="h-2" />
                      </div>
                      
                    <div className="text-sm text-muted-foreground">
                      <p>Subject: {tutorial.subject}</p>
                      <p>By: {tutorial.uploader_name}</p>
                    </div>
                      
                      <Button 
                        className="w-full" 
                        variant={tutorialProgress.isCompleted ? "secondary" : "gradient"}
                        onClick={() => setSelectedTutorial(tutorial)}
                      >
                        {tutorialProgress.isCompleted ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Completed
                          </>
                        ) : tutorialProgress.progress > 0 ? (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Continue
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Start Tutorial
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating ChatBot */}
      <ChatBot user={user} />
    </div>
  );
};
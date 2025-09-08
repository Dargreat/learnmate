import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Plus, Video, Trash2, Edit, Save, X, LogOut, Eye, EyeOff, Mail, Lock, Upload, Link, Users, BookOpen, Clock } from "lucide-react";
import { FileUpload } from "@/components/FileUpload";
import { VideoFileManager } from "@/components/VideoFileManager";
import { useAuth } from "@/hooks/useAuth";
import { useSupabaseTutorials, Tutorial } from "@/hooks/useSupabaseTutorials";
import { TutorialQuizEditor } from "@/components/TutorialQuizEditor";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const AdminPage = () => {
  const navigate = useNavigate();
  const { user, signIn, signOut } = useAuth();
  const { tutorials, loading, createTutorial, updateTutorial, deleteTutorial } = useSupabaseTutorials();
  const { toast } = useToast();
  const [showAuth, setShowAuth] = useState(!user);
  const [authForm, setAuthForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [showTutorialForm, setShowTutorialForm] = useState(false);
  const [editingTutorial, setEditingTutorial] = useState<Tutorial | null>(null);
  const [showQuizBuilder, setShowQuizBuilder] = useState(false);
  const [currentTutorialId, setCurrentTutorialId] = useState<string | null>(null);
  const [videoUploadType, setVideoUploadType] = useState<'link' | 'upload'>('link');
  const [users, setUsers] = useState<any[]>([]);
  const [userProgress, setUserProgress] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('tutorials');

  const [tutorialForm, setTutorialForm] = useState({
    title: '',
    description: '',
    video_url: '',
    subject: '',
    level: '',
    duration: '',
    uploader_name: 'Admin'
  });

  const subjects = ['mathematics', 'programming', 'science', 'language', 'business'];
  const levels = ['high-school', 'undergraduate', 'graduate', 'professional', 'self-learner'];

  useEffect(() => {
    if (!user) {
      setShowAuth(true);
    } else {
      setShowAuth(false);
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(profiles || []);

      // Fetch user progress for each user
      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select(`
          *,
          tutorials:tutorial_id (title, subject)
        `);

      if (progressError) throw progressError;
      setUserProgress(progressData || []);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error loading user data",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Set up real-time updates for user management
  useEffect(() => {
    if (!user) return;

    const usersChannel = supabase
      .channel('profiles-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        () => {
          fetchUsers(); // Refresh when profiles change
        }
      )
      .subscribe();

    const progressChannel = supabase
      .channel('progress-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_progress'
        },
        () => {
          fetchUsers(); // Refresh when progress changes
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(usersChannel);
      supabase.removeChannel(progressChannel);
    };
  }, [user]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);

    try {
      const { error } = await signIn(authForm.email, authForm.password);
      if (error) {
        toast({
          title: "Authentication Failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setShowAuth(false);
        toast({ title: "Welcome to Admin Panel!" });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSubmitTutorial = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let result;
      if (editingTutorial) {
        result = await updateTutorial(editingTutorial.id, tutorialForm);
        setEditingTutorial(null);
      } else {
        result = await createTutorial(tutorialForm);
      }

      if (result.data) {
        // Ask if they want to add a quiz
        setCurrentTutorialId(result.data.id);
        setShowQuizBuilder(true);
      }

      setTutorialForm({
        title: '',
        description: '',
        video_url: '',
        subject: '',
        level: '',
        duration: '',
        uploader_name: 'Admin'
      });
      setShowTutorialForm(false);
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const handleQuizComplete = async (tutorialId: string, quiz: any) => {
    try {
      // Create assessment
      const { data: assessment, error: assessmentError } = await supabase
        .from('assessments')
        .insert([{
          tutorial_id: tutorialId,
          title: quiz.title,
          type: quiz.type
        }])
        .select()
        .single();

      if (assessmentError) throw assessmentError;

      // Create questions
      const questions = quiz.questions.map((q: any) => ({
        assessment_id: assessment.id,
        question: q.question,
        type: q.type,
        options: q.options,
        correct_answer: q.correctAnswer,
        explanation: q.explanation
      }));

      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questions);

      if (questionsError) throw questionsError;

      toast({ title: "Assessment created successfully!" });
      setShowQuizBuilder(false);
      setCurrentTutorialId(null);
    } catch (error: any) {
      toast({
        title: "Error creating assessment",
        description: error.message,
        variant: "destructive"
      });
    }
  };


  const handleEditTutorial = (tutorial: Tutorial) => {
    setEditingTutorial(tutorial);
    setTutorialForm({
      title: tutorial.title,
      description: tutorial.description,
      video_url: tutorial.video_url,
      subject: tutorial.subject,
      level: tutorial.level,
      duration: tutorial.duration,
      uploader_name: tutorial.uploader_name
    });
    setShowTutorialForm(true);
  };

  const handleTutorialSave = async (tutorial: any, quizzes: any[]) => {
    try {
      let result;
      if (tutorial.id) {
        // Update existing tutorial
        result = await updateTutorial(tutorial.id, tutorial);
      } else {
        // Create new tutorial
        result = await createTutorial(tutorial);
      }

      if (result.data && quizzes.length > 0) {
        await handleSaveQuizzes(result.data.id, quizzes);
      }

      setShowTutorialForm(false);
      setEditingTutorial(null);
      toast({ title: tutorial.id ? "Tutorial updated successfully!" : "Tutorial created successfully!" });
    } catch (error: any) {
      toast({
        title: "Error saving tutorial",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleSaveQuizzes = async (tutorialId: string, quizzes: any[]) => {
    try {
      // Delete existing assessments for this tutorial
      const { data: existingAssessments } = await supabase
        .from('assessments')
        .select('id')
        .eq('tutorial_id', tutorialId);
      
      if (existingAssessments && existingAssessments.length > 0) {
        await supabase
          .from('questions')
          .delete()
          .in('assessment_id', existingAssessments.map(a => a.id));
        
        await supabase
          .from('assessments')
          .delete()
          .eq('tutorial_id', tutorialId);
      }

      // Create new assessments and questions
      for (const quiz of quizzes) {
        const { data: assessment, error: assessmentError } = await supabase
          .from('assessments')
          .insert([{
            tutorial_id: tutorialId,
            title: quiz.title,
            type: quiz.type
          }])
          .select()
          .single();

        if (assessmentError) throw assessmentError;

        if (quiz.questions.length > 0) {
          const questions = quiz.questions.map((q: any) => ({
            assessment_id: assessment.id,
            question: q.question,
            type: q.type,
            options: q.options,
            correct_answer: q.correctAnswer,
            explanation: q.explanation
          }));

          const { error: questionsError } = await supabase
            .from('questions')
            .insert(questions);

          if (questionsError) throw questionsError;
        }
      }
    } catch (error: any) {
      console.error('Error saving quizzes:', error);
      throw error;
    }
  };

  const handleDeleteTutorial = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this tutorial? This action cannot be undone.')) {
      try {
        await deleteTutorial(id);
        toast({
          title: "Tutorial deleted",
          description: "The tutorial has been successfully deleted"
        });
      } catch (error) {
        console.error('Error deleting tutorial:', error);
        toast({
          title: "Error deleting tutorial", 
          description: "Failed to delete the tutorial",
          variant: "destructive"
        });
      }
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (showAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-bg p-4">
        <Card className="w-full max-w-md shadow-soft border-0">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Admin Access
            </CardTitle>
            <CardDescription>
              Sign in to access the admin panel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={authForm.email}
                    onChange={(e) => setAuthForm(prev => ({ ...prev, email: e.target.value }))}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={authForm.password}
                    onChange={(e) => setAuthForm(prev => ({ ...prev, password: e.target.value }))}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  className="flex-1" 
                  variant="gradient"
                  disabled={authLoading}
                >
                  {authLoading ? 'Signing in...' : 'Sign In'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => navigate("/")}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-bg">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              LearnMate Admin Panel
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-xs sm:text-sm text-muted-foreground">Welcome, {user?.email}</span>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                <span className="hidden sm:block">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Admin Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tutorials">Tutorial Management</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="files">File Storage</TabsTrigger>
          </TabsList>

          <TabsContent value="tutorials" className="space-y-8">
            {/* Add Tutorial Button */}
            <div className="flex justify-between items-center">
              <h2 className="text-2xl sm:text-3xl font-bold">Tutorial Management</h2>
              <Button 
                onClick={() => setShowTutorialForm(true)}
                variant="gradient"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Tutorial
              </Button>
            </div>

            {/* Enhanced Tutorial/Quiz Editor */}
            {showTutorialForm && (
              <TutorialQuizEditor
                tutorial={editingTutorial ? {
                  id: editingTutorial.id,
                  title: editingTutorial.title,
                  description: editingTutorial.description,
                  video_url: editingTutorial.video_url,
                  subject: editingTutorial.subject,
                  level: editingTutorial.level,
                  duration: editingTutorial.duration,
                  uploader_name: editingTutorial.uploader_name,
                  quizzes: editingTutorial.quizzes?.map(quiz => ({
                    id: quiz.id,
                    title: quiz.title,
                    type: quiz.type as 'multiple-choice' | 'theory',
                    questions: quiz.questions?.map(q => ({
                      id: q.id,
                      question: q.question,
                      type: q.type as 'multiple-choice' | 'theory',
                      options: q.options,
                      correctAnswer: q.correctAnswer,
                      explanation: q.explanation
                    })) || []
                  })) || []
                } : null}
                onSave={handleTutorialSave}
                onCancel={() => {
                  setShowTutorialForm(false);
                  setEditingTutorial(null);
                }}
              />
            )}

            {/* Tutorials List */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Existing Tutorials ({tutorials.length})</h3>
              {loading ? (
                <div className="text-center py-12">
                  <div className="text-lg">Loading tutorials...</div>
                </div>
              ) : tutorials.length === 0 ? (
                <Card className="text-center py-12 border-dashed">
                  <CardContent>
                    <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No tutorials created yet. Add your first tutorial to get started!</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {tutorials.map((tutorial) => (
                    <Card key={tutorial.id} className="shadow-soft hover:shadow-glow transition-all duration-300 border-0">
                      <CardHeader>
                        <div className="flex justify-between items-start mb-2">
                          <Badge variant="outline">{tutorial.subject}</Badge>
                          <Badge variant="secondary">{tutorial.level.replace('-', ' ')}</Badge>
                        </div>
                        <CardTitle className="text-lg">{tutorial.title}</CardTitle>
                        <CardDescription>{tutorial.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="text-sm text-muted-foreground">
                          <p>Duration: {tutorial.duration}</p>
                          <p>By: {tutorial.uploader_name}</p>
                        </div>
                        
                        <div className="flex gap-2 flex-wrap">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEditTutorial(tutorial)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleDeleteTutorial(tutorial.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-8">
            {/* User Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="text-center shadow-soft border-0">
                <CardHeader className="pb-2">
                  <Users className="h-8 w-8 mx-auto text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{users.length}</div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                </CardContent>
              </Card>

              <Card className="text-center shadow-soft border-0">
                <CardHeader className="pb-2">
                  <BookOpen className="h-8 w-8 mx-auto text-secondary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userProgress.length}</div>
                  <p className="text-sm text-muted-foreground">Total Progress Records</p>
                </CardContent>
              </Card>

              <Card className="text-center shadow-soft border-0">
                <CardHeader className="pb-2">
                  <Clock className="h-8 w-8 mx-auto text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {userProgress.filter(p => p.completed_at).length}
                  </div>
                  <p className="text-sm text-muted-foreground">Completed Tutorials</p>
                </CardContent>
              </Card>

              <Card className="text-center shadow-soft border-0">
                <CardHeader className="pb-2">
                  <Video className="h-8 w-8 mx-auto text-primary-glow" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {userProgress.filter(p => p.video_watched).length}
                  </div>
                  <p className="text-sm text-muted-foreground">Videos Watched</p>
                </CardContent>
              </Card>
            </div>

            {/* Users List */}
            <Card className="shadow-soft border-0">
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Monitor user activity and progress</CardDescription>
              </CardHeader>
              <CardContent>
                {users.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No users registered yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {users.map((user) => {
                      const userProgressData = userProgress.filter(p => p.user_id === user.user_id);
                      const completedTutorials = userProgressData.filter(p => p.completed_at).length;
                      const totalProgress = userProgressData.length;
                      const progressPercentage = totalProgress > 0 ? (completedTutorials / totalProgress) * 100 : 0;

                      return (
                        <Card key={user.id} className="border border-muted">
                          <CardContent className="pt-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-medium">{user.display_name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  Preferences: {user.preferences?.subject || 'Not set'} • {user.preferences?.level || 'Not set'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Learning Goals: {user.learning_goals || 'Not specified'}
                                </p>
                                <div className="mt-2 space-y-1">
                                  <div className="flex justify-between text-sm">
                                    <span>Progress: {completedTutorials}/{totalProgress} tutorials</span>
                                    <span>{Math.round(progressPercentage)}%</span>
                                  </div>
                                  <Progress value={progressPercentage} className="h-2" />
                                </div>
                              </div>
                              <Badge variant="outline" className="ml-4">
                                Joined {new Date(user.created_at).toLocaleDateString()}
                              </Badge>
                            </div>
                            
                            {userProgressData.length > 0 && (
                              <div className="mt-4 pt-4 border-t">
                                <h5 className="text-sm font-medium mb-2">Recent Activity:</h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted-foreground">
                                  {userProgressData.slice(0, 4).map((progress) => (
                                    <div key={progress.id} className="flex justify-between">
                                      <span>{progress.tutorials?.title || 'Unknown Tutorial'}</span>
                                      <span>{progress.completed_at ? '✓ Completed' : progress.video_watched ? 'Watching' : 'Started'}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="files" className="space-y-8">
            <VideoFileManager />
          </TabsContent>
        </Tabs>

      </div>
    </div>
  );
};

export default AdminPage;
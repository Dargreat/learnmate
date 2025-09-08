import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, BookOpen, Users, TrendingUp, ArrowRight } from "lucide-react";
import { AuthModal } from "@/components/AuthModal";
import { PersonalizationFlow } from "@/components/PersonalizationFlow";
import { Dashboard } from "@/components/Dashboard";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";


const Index = () => {
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [showPersonalization, setShowPersonalization] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const { user, loading, signOut } = useAuth();
  

  // Fetch user profile data
  useEffect(() => {
    if (user) {
      fetchUserProfile();
    } else {
      // Reset states when user is not logged in
      setUserProfile(null);
      setShowPersonalization(false);
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        setUserProfile(data);
        // If user has no preferences, show personalization
        if (!data.preferences || Object.keys(data.preferences).length === 0) {
          setShowPersonalization(true);
        }
      } else {
        // If no profile exists, show personalization
        setShowPersonalization(true);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleAuthSuccess = (userData: any) => {
    setShowAuth(false);
    if (userData.isNewUser) {
      setShowPersonalization(true);
    }
  };

  const handlePersonalizationComplete = async (preferences: any) => {
    if (!user) return;
    
    try {
      console.log('Saving preferences:', preferences);
      
      // First, try to update existing profile
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      let data, error;
      
      if (existingProfile) {
        // Update existing profile
        const result = await supabase
          .from('profiles')
          .update({
            preferences: preferences,
            grade: preferences.level,
            learning_goals: preferences.goals,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .select()
          .single();
        
        data = result.data;
        error = result.error;
      } else {
        // Insert new profile
        const result = await supabase
          .from('profiles')
          .insert([{
            user_id: user.id,
            display_name: user.user_metadata?.display_name || user.email?.split('@')[0],
            preferences: preferences,
            grade: preferences.level,
            learning_goals: preferences.goals
          }])
          .select()
          .single();
        
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error('Error saving preferences:', error);
        throw error;
      }

      console.log('Preferences saved successfully:', data);

      setUserProfile({
        user_id: user.id,
        display_name: data.display_name,
        preferences: preferences,
        grade: preferences.level,
        learning_goals: preferences.goals
      });
      setShowPersonalization(false);
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-bg">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Show dashboard if user is logged in and has completed personalization  
  if (user && !loading && userProfile && userProfile.preferences && Object.keys(userProfile.preferences).length > 0) {
    return (
      <Dashboard 
        user={{
          id: user.id,
          name: userProfile.display_name,
          email: user.email,
          preferences: userProfile.preferences
        }} 
        onLogout={async () => {
          await signOut();
          setUserProfile(null);
        }}
      />
    );
  }

  // Show personalization flow if user is logged in but hasn't completed it
  if (user && !loading && showPersonalization) {
    return (
      <PersonalizationFlow
        user={{
          id: user.id,
          name: user.user_metadata?.display_name || user.email?.split('@')[0],
          email: user.email
        }}
        onComplete={handlePersonalizationComplete}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-bg">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-8 animate-fade-in">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              LearnMate
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Your personalized learning companion. Get customized tutorials and learning paths 
              tailored to your education level, study goals, and learning style.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="gradient" 
              size="lg"
              onClick={() => {
                setAuthMode('signup');
                setShowAuth(true);
              }}
              className="group"
            >
              Get Started
              <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => {
                setAuthMode('login');
                setShowAuth(true);
              }}
            >
              Sign In
            </Button>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-16 sm:mt-24 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: GraduationCap,
              title: "Personalized Learning",
              description: "Custom learning paths based on your education level and goals"
            },
            {
              icon: BookOpen,
              title: "Interactive Tutorials",
              description: "Engaging step-by-step tutorials with practice exercises"
            },
            {
              icon: Users,
              title: "Progress Tracking",
              description: "Monitor your learning journey and celebrate achievements"
            },
            {
              icon: TrendingUp,
              title: "Adaptive Content",
              description: "Content that adapts to your learning pace and style"
            }
          ].map((feature, index) => (
            <Card key={index} className="text-center hover:shadow-soft transition-all duration-300 animate-scale-in border-0 shadow-sm">
              <CardHeader>
                <feature.icon className="h-12 w-12 mx-auto text-primary mb-4" />
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* How It Works Section */}
        <div className="mt-16 sm:mt-24 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-8 sm:mb-12">How LearnMate Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Sign Up & Assess",
                description: "Create your account and take our quick assessment to understand your learning needs"
              },
              {
                step: "2", 
                title: "Get Personalized Path",
                description: "Receive a customized learning dashboard with tutorials matched to your goals"
              },
              {
                step: "3",
                title: "Learn & Grow",
                description: "Engage with interactive content, complete exercises, and track your progress"
              }
            ].map((step, index) => (
              <div key={index} className="space-y-4">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto text-white font-bold text-xl">
                  {step.step}
                </div>
                <h3 className="text-lg sm:text-xl font-semibold">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showAuth && (
        <AuthModal
          mode={authMode}
          onClose={() => setShowAuth(false)}
          onSuccess={handleAuthSuccess}
          onSwitchMode={(mode) => setAuthMode(mode)}
        />
      )}
    </div>
  );
};

export default Index;
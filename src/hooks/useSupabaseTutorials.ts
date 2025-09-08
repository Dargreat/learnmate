import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  video_url: string;
  subject: string;
  level: string;
  duration: string;
  uploader_name: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  quizzes?: Quiz[];
}

export interface Quiz {
  id: string;
  title: string;
  type: string;
  questions: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: string;
  options?: any;
  correctAnswer: string;
  explanation?: string;
}

export interface Assessment {
  id: string;
  tutorial_id: string;
  title: string;
  type: string;
  created_at: string;
}

export interface Question {
  id: string;
  assessment_id: string;
  question: string;
  type: string;
  options?: any;
  correct_answer: string;
  explanation?: string;
  created_at: string;
}

export interface UserProgress {
  id: string;
  user_id: string;
  tutorial_id: string;
  video_watched: boolean;
  video_progress: number;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AssessmentResult {
  id: string;
  user_id: string;
  assessment_id: string;
  score: number;
  answers: any;
  completed_at: string;
}

export const useSupabaseTutorials = () => {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch all tutorials with their assessments and questions
  const fetchTutorials = async () => {
    try {
      const { data, error } = await supabase
        .from('tutorials')
        .select(`
          *,
          assessments (
            id,
            title,
            type,
            questions (
              id,
              question,
              type,
              options,
              correct_answer,
              explanation
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match TutorialViewer expectations
      const tutorialsWithQuizzes = (data || []).map(tutorial => {
        const { assessments, ...tutorialData } = tutorial;
        return {
          ...tutorialData,
          quizzes: assessments?.map((assessment: any) => ({
            id: assessment.id,
            title: assessment.title,
            type: assessment.type,
            questions: (assessment.questions || []).map((q: any) => ({
              id: q.id,
              question: q.question,
              type: q.type,
              options: q.options,
              correctAnswer: q.correct_answer,
              explanation: q.explanation
            }))
          })) || []
        };
      });
      
      setTutorials(tutorialsWithQuizzes);
    } catch (error: any) {
      toast({
        title: "Error fetching tutorials",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTutorials();
  }, []);

  // Create tutorial
  const createTutorial = async (tutorial: Omit<Tutorial, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('tutorials')
        .insert([tutorial])
        .select()
        .single();

      if (error) throw error;
      
      setTutorials(prev => [data, ...prev]);
      toast({ title: "Tutorial created successfully!" });
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error creating tutorial",
        description: error.message,
        variant: "destructive"
      });
      return { data: null, error };
    }
  };

  // Update tutorial
  const updateTutorial = async (id: string, updates: Partial<Tutorial>) => {
    try {
      console.log('Updating tutorial:', id, updates);
      const { data, error } = await supabase
        .from('tutorials')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Update error:', error);
        throw error;
      }
      
      console.log('Update successful:', data);
      // Update local state immediately
      setTutorials(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
      toast({ title: "Tutorial updated successfully!" });
      return { data, error: null };
    } catch (error: any) {
      console.error('Tutorial update failed:', error);
      toast({
        title: "Error updating tutorial",
        description: error.message,
        variant: "destructive"
      });
      return { data: null, error };
    }
  };

  // Delete tutorial
  const deleteTutorial = async (id: string) => {
    try {
      console.log('Deleting tutorial:', id);
      
      // First delete related assessments and questions
      const { data: assessments } = await supabase
        .from('assessments')
        .select('id')
        .eq('tutorial_id', id);

      if (assessments && assessments.length > 0) {
        const { error: questionsError } = await supabase
          .from('questions')
          .delete()
          .in('assessment_id', assessments.map(a => a.id));
        
        if (questionsError) console.warn('Questions delete error:', questionsError);
        
        const { error: assessmentsError } = await supabase
          .from('assessments')
          .delete()
          .eq('tutorial_id', id);
          
        if (assessmentsError) console.warn('Assessments delete error:', assessmentsError);
      }

      // Delete user progress (this might fail due to RLS, but continue anyway)
      const { error: progressError } = await supabase
        .from('user_progress')
        .delete()
        .eq('tutorial_id', id);
        
      if (progressError) console.warn('Progress delete error:', progressError);

      // Finally delete the tutorial
      const { error } = await supabase
        .from('tutorials')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Tutorial delete error:', error);
        throw error;
      }
      
      console.log('Tutorial deleted successfully');
      // Update local state immediately
      setTutorials(prev => prev.filter(t => t.id !== id));
      toast({ title: "Tutorial deleted successfully!" });
      return { error: null };
    } catch (error: any) {
      console.error('Delete tutorial failed:', error);
      toast({
        title: "Error deleting tutorial",
        description: error.message,
        variant: "destructive"
      });
      return { error };
    }
  };

  // Get tutorials for user based on preferences
  const getTutorialsForUser = (userPreferences: any) => {
    if (!userPreferences) return tutorials;
    
    const { subject, level } = userPreferences;
    
    return tutorials.filter(tutorial => {
      const subjectMatch = !subject || tutorial.subject === subject;
      const levelMatch = !level || tutorial.level === level;
      return subjectMatch || levelMatch;
    }).sort((a, b) => {
      // Prioritize exact matches
      const aExactMatch = a.subject === subject && a.level === level;
      const bExactMatch = b.subject === subject && b.level === level;
      
      if (aExactMatch && !bExactMatch) return -1;
      if (!aExactMatch && bExactMatch) return 1;
      
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  };

  // Get user progress for a tutorial
  const getUserProgress = async (tutorialId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('tutorial_id', tutorialId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error: any) {
      console.error('Error fetching user progress:', error);
      return null;
    }
  };

  // Update user progress with video progress tracking
  const updateUserProgress = async (tutorialId: string, progress: Partial<UserProgress>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // If video_progress is 100 and completed_at is not set, set it now
      const progressUpdate = { 
        tutorial_id: tutorialId, 
        user_id: user.id,
        ...progress 
      };
      
      if (progress.video_progress === 100 && !progress.completed_at) {
        progressUpdate.completed_at = new Date().toISOString();
      }

      console.log('Updating user progress:', progressUpdate);
      const { data, error } = await supabase
        .from('user_progress')
        .upsert([progressUpdate])
        .select()
        .single();

      if (error) {
        console.error('Progress update error:', error);
        throw error;
      }
      
      console.log('Progress updated:', data);
      return { data, error: null };
    } catch (error: any) {
      console.error('Update user progress failed:', error);
      toast({
        title: "Error updating progress",
        description: error.message,
        variant: "destructive"
      });
      return { data: null, error };
    }
  };

  // Create assessment
  const createAssessment = async (assessment: Omit<Assessment, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('assessments')
        .insert([assessment])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error creating assessment",
        description: error.message,
        variant: "destructive"
      });
      return { data: null, error };
    }
  };

  // Create questions for assessment
  const createQuestions = async (questions: Omit<Question, 'id' | 'created_at'>[]) => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .insert(questions)
        .select();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error creating questions",
        description: error.message,
        variant: "destructive"
      });
      return { data: null, error };
    }
  };

  // Get assessments for tutorial
  const getAssessments = async (tutorialId: string) => {
    try {
      const { data, error } = await supabase
        .from('assessments')
        .select(`
          *,
          questions (*)
        `)
        .eq('tutorial_id', tutorialId);

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error fetching assessments:', error);
      return [];
    }
  };

  // Submit assessment result
  const submitAssessmentResult = async (result: Omit<AssessmentResult, 'id' | 'completed_at'>) => {
    try {
      const { data, error } = await supabase
        .from('assessment_results')
        .upsert([result])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error submitting assessment",
        description: error.message,
        variant: "destructive"
      });
      return { data: null, error };
    }
  };

  return {
    tutorials,
    loading,
    createTutorial,
    updateTutorial,
    deleteTutorial,
    getTutorialsForUser,
    getUserProgress,
    updateUserProgress,
    createAssessment,
    createQuestions,
    getAssessments,
    submitAssessmentResult,
    refetch: fetchTutorials
  };
};
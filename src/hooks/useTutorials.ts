import { useState, useEffect } from 'react';

interface Tutorial {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  subject: string;
  level: string;
  duration: string;
  quizzes: Quiz[];
  createdAt: string;
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
  quizResults: Record<string, {
    score: number;
    answers: Record<string, string>;
    completed: boolean;
  }>;
  completedAt?: string;
}

export const useTutorials = () => {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [userProgress, setUserProgress] = useState<Record<string, UserProgress>>({});

  // Load from localStorage on mount
  useEffect(() => {
    const savedTutorials = localStorage.getItem('learnmate_tutorials');
    const savedProgress = localStorage.getItem('learnmate_progress');
    
    if (savedTutorials) {
      setTutorials(JSON.parse(savedTutorials));
    }
    
    if (savedProgress) {
      setUserProgress(JSON.parse(savedProgress));
    }
  }, []);

  // Save to localStorage when data changes
  useEffect(() => {
    localStorage.setItem('learnmate_tutorials', JSON.stringify(tutorials));
  }, [tutorials]);

  useEffect(() => {
    localStorage.setItem('learnmate_progress', JSON.stringify(userProgress));
  }, [userProgress]);

  const addTutorial = (tutorial: Omit<Tutorial, 'id' | 'createdAt'>) => {
    const newTutorial: Tutorial = {
      id: Date.now().toString(),
      ...tutorial,
      createdAt: new Date().toISOString()
    };
    setTutorials(prev => [...prev, newTutorial]);
    return newTutorial;
  };

  const updateTutorial = (id: string, updates: Partial<Tutorial>) => {
    setTutorials(prev => prev.map(tutorial => 
      tutorial.id === id ? { ...tutorial, ...updates } : tutorial
    ));
  };

  const deleteTutorial = (id: string) => {
    setTutorials(prev => prev.filter(tutorial => tutorial.id !== id));
    // Also remove progress for this tutorial
    setUserProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[id];
      return newProgress;
    });
  };

  const addQuizToTutorial = (tutorialId: string, quiz: Quiz) => {
    setTutorials(prev => prev.map(tutorial => 
      tutorial.id === tutorialId 
        ? { ...tutorial, quizzes: [...tutorial.quizzes, quiz] }
        : tutorial
    ));
  };

  const updateProgress = (progress: UserProgress) => {
    setUserProgress(prev => ({
      ...prev,
      [progress.tutorialId]: progress
    }));
  };

  const getTutorialsForUser = (userPreferences: any) => {
    if (!userPreferences) return tutorials;
    
    const { subject, level } = userPreferences;
    
    return tutorials.filter(tutorial => {
      const subjectMatch = !subject || tutorial.subject === subject;
      const levelMatch = !level || tutorial.level === level;
      return subjectMatch || levelMatch; // Show if either matches
    }).sort((a, b) => {
      // Prioritize exact matches
      const aExactMatch = a.subject === subject && a.level === level;
      const bExactMatch = b.subject === subject && b.level === level;
      
      if (aExactMatch && !bExactMatch) return -1;
      if (!aExactMatch && bExactMatch) return 1;
      
      // Then sort by creation date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  };

  const getAllTutorials = () => {
    return tutorials;
  };

  const getTutorialProgress = (tutorialId: string) => {
    return userProgress[tutorialId] || null;
  };

  const getUserStats = (userId: string) => {
    const completedTutorials = Object.values(userProgress).filter(p => p.completedAt).length;
    const totalTutorials = tutorials.length;
    const totalQuizzes = tutorials.reduce((sum, t) => sum + t.quizzes.length, 0);
    const completedQuizzes = Object.values(userProgress).reduce((sum, p) => {
      return sum + Object.keys(p.quizResults).length;
    }, 0);
    
    const averageQuizScore = Object.values(userProgress).reduce((scores, progress) => {
      const quizScores = Object.values(progress.quizResults).map(r => r.score);
      return [...scores, ...quizScores];
    }, [] as number[]);
    
    const avgScore = averageQuizScore.length > 0 
      ? averageQuizScore.reduce((sum, score) => sum + score, 0) / averageQuizScore.length
      : 0;

    return {
      completedTutorials,
      totalTutorials,
      completedQuizzes,
      totalQuizzes,
      averageQuizScore: Math.round(avgScore),
      overallProgress: totalTutorials > 0 ? Math.round((completedTutorials / totalTutorials) * 100) : 0
    };
  };

  return {
    tutorials,
    userProgress,
    addTutorial,
    updateTutorial,
    deleteTutorial,
    addQuizToTutorial,
    updateProgress,
    getTutorialsForUser,
    getAllTutorials,
    getTutorialProgress,
    getUserStats
  };
};
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface ThemeContextType {
  theme: 'light' | 'dark' | 'auto';
  compactMode: boolean;
  showPatientPhotos: boolean;
  highContrast: boolean;
  reduceMotion: boolean;
  screenReaderOptimized: boolean;
  fontSize: 'small' | 'medium' | 'large';
  calendarView: 'day' | 'week' | 'month';
  showWeekends: boolean;
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  setCompactMode: (compact: boolean) => void;
  setShowPatientPhotos: (show: boolean) => void;
  setHighContrast: (contrast: boolean) => void;
  setReduceMotion: (reduce: boolean) => void;
  setScreenReaderOptimized: (optimized: boolean) => void;
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
  setCalendarView: (view: 'day' | 'week' | 'month') => void;
  setShowWeekends: (show: boolean) => void;
  toggleTheme: () => void;
  currentTheme: 'light' | 'dark'; // The actual resolved theme
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<'light' | 'dark' | 'auto'>('light');
  const [compactMode, setCompactModeState] = useState(false);
  const [showPatientPhotos, setShowPatientPhotosState] = useState(true);
  const [highContrast, setHighContrastState] = useState(false);
  const [reduceMotion, setReduceMotionState] = useState(false);
  const [screenReaderOptimized, setScreenReaderOptimizedState] = useState(false);
  const [fontSize, setFontSizeState] = useState<'small' | 'medium' | 'large'>('medium');
  const [calendarView, setCalendarViewState] = useState<'day' | 'week' | 'month'>('week');
  const [showWeekends, setShowWeekendsState] = useState(true);
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light');

  const queryClient = useQueryClient();

  // Load user preferences
  const { data: userPreferences } = useQuery<any>({
    queryKey: ['/api/user-preferences'],
  });

  // Update preferences mutation
  const updatePreferences = useMutation({
    mutationFn: (data: any) => apiRequest('/api/user-preferences', 'PUT', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-preferences'] });
    }
  });

  // Initialize theme and preferences from API
  useEffect(() => {
    if (userPreferences) {
      setThemeState(userPreferences?.theme || 'light');
      setCompactModeState(userPreferences?.compactMode || false);
      setShowPatientPhotosState(userPreferences?.showPatientPhotos !== false);
      setHighContrastState(userPreferences?.highContrast || false);
      setReduceMotionState(userPreferences?.reduceMotion || false);
      setScreenReaderOptimizedState(userPreferences?.screenReaderOptimized || false);
      setFontSizeState(userPreferences?.fontSizeScale || 'medium');
      setCalendarViewState(userPreferences?.calendarView || 'week');
      setShowWeekendsState(userPreferences?.showWeekends !== false);
    }
  }, [userPreferences]);

  // Apply theme to document
  useEffect(() => {
    const root = window.document.documentElement;
    const body = window.document.body;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const applyTheme = () => {
      let resolvedTheme: 'light' | 'dark' = 'light';
      
      if (theme === 'auto') {
        resolvedTheme = mediaQuery.matches ? 'dark' : 'light';
      } else {
        resolvedTheme = theme;
      }
      
      setCurrentTheme(resolvedTheme);
      
      // Remove all theme classes first
      root.classList.remove('light', 'dark', 'compact-mode', 'high-contrast', 'reduce-motion', 'screen-reader-optimized');
      root.classList.remove('font-small', 'font-medium', 'font-large');
      body.classList.remove('light', 'dark', 'compact-mode', 'high-contrast', 'reduce-motion', 'screen-reader-optimized');
      body.classList.remove('font-small', 'font-medium', 'font-large');
      
      // Apply theme classes to both root and body
      root.classList.add(resolvedTheme);
      body.classList.add(resolvedTheme);
      
      // Apply compact mode
      if (compactMode) {
        root.classList.add('compact-mode');
        body.classList.add('compact-mode');
      }
      
      // Apply high contrast
      if (highContrast) {
        root.classList.add('high-contrast');
        body.classList.add('high-contrast');
      }
      
      // Apply reduced motion
      if (reduceMotion) {
        root.classList.add('reduce-motion');
        body.classList.add('reduce-motion');
      }
      
      // Apply font size
      root.classList.add(`font-${fontSize}`);
      body.classList.add(`font-${fontSize}`);
      
      // Apply screen reader optimization
      if (screenReaderOptimized) {
        root.classList.add('screen-reader-optimized');
        body.classList.add('screen-reader-optimized');
      }

      // Force immediate style recalculation
      root.style.setProperty('color-scheme', resolvedTheme);
      body.style.setProperty('color-scheme', resolvedTheme);
    };

    applyTheme();
    
    // Listen for system theme changes
    const handleMediaQueryChange = () => {
      if (theme === 'auto') {
        applyTheme();
      }
    };
    
    mediaQuery.addEventListener('change', handleMediaQueryChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleMediaQueryChange);
    };
  }, [theme, compactMode, highContrast, reduceMotion, fontSize, screenReaderOptimized]);

  // Theme setters that also update the backend
  const setTheme = (newTheme: 'light' | 'dark' | 'auto') => {
    setThemeState(newTheme);
    updatePreferences.mutate({ theme: newTheme });
  };

  const setCompactMode = (compact: boolean) => {
    setCompactModeState(compact);
    updatePreferences.mutate({ compactMode: compact });
  };

  const setShowPatientPhotos = (show: boolean) => {
    setShowPatientPhotosState(show);
    updatePreferences.mutate({ showPatientPhotos: show });
  };

  const setHighContrast = (contrast: boolean) => {
    setHighContrastState(contrast);
    updatePreferences.mutate({ highContrast: contrast });
  };

  const setReduceMotion = (reduce: boolean) => {
    setReduceMotionState(reduce);
    updatePreferences.mutate({ reduceMotion: reduce });
  };

  const setScreenReaderOptimized = (optimized: boolean) => {
    setScreenReaderOptimizedState(optimized);
    updatePreferences.mutate({ screenReaderOptimized: optimized });
  };

  const setFontSize = (size: 'small' | 'medium' | 'large') => {
    setFontSizeState(size);
    updatePreferences.mutate({ fontSizeScale: size });
  };

  const setCalendarView = (view: 'day' | 'week' | 'month') => {
    setCalendarViewState(view);
    updatePreferences.mutate({ calendarView: view });
  };

  const setShowWeekends = (show: boolean) => {
    setShowWeekendsState(show);
    updatePreferences.mutate({ showWeekends: show });
  };

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('auto');
    } else {
      setTheme('light');
    }
  };

  return (
    <ThemeContext.Provider value={{
      theme,
      compactMode,
      showPatientPhotos,
      highContrast,
      reduceMotion,
      screenReaderOptimized,
      fontSize,
      calendarView,
      showWeekends,
      currentTheme,
      setTheme,
      setCompactMode,
      setShowPatientPhotos,
      setHighContrast,
      setReduceMotion,
      setScreenReaderOptimized,
      setFontSize,
      setCalendarView,
      setShowWeekends,
      toggleTheme,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
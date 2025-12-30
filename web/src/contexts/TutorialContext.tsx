import { createContext, useContext, useState, useCallback, type ReactNode, useEffect } from 'react';
import type {
  Tutorial,
  TutorialStep,
  TutorialContextValue,
  TutorialCompletion,
} from '@/types/tutorial.types';
import {
  scrollToElement,
  highlightElement,
  unhighlightElement,
  waitForElement,
} from '@/lib/tutorialHelpers';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/auth';

const TutorialContext = createContext<TutorialContextValue | undefined>(undefined);

export function TutorialProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [currentTutorialId, setCurrentTutorialId] = useState<string | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [steps, setSteps] = useState<TutorialStep[]>([]);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);

  const { user, profile, setProfile } = useAuthStore();

  // Cleanup highlighted element when component unmounts or tutorial changes
  useEffect(() => {
    return () => {
      unhighlightElement(highlightedElement);
    };
  }, [highlightedElement]);

  // Current step derived state
  const currentStep = steps[currentStepIndex] || null;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;
  const progress = steps.length > 0 ? ((currentStepIndex + 1) / steps.length) * 100 : 0;

  /**
   * Start a tutorial
   */
  const startTutorial = useCallback((tutorial: Tutorial) => {
    setCurrentTutorialId(tutorial.id);
    setSteps(tutorial.steps);
    setCurrentStepIndex(0);
    setIsActive(true);

    // Handle first step
    const firstStep = tutorial.steps[0];
    if (firstStep?.action) {
      firstStep.action();
    }

    // Highlight element if specified
    if (firstStep?.targetSelector) {
      setTimeout(async () => {
        try {
          await waitForElement(firstStep.targetSelector!, 2000);
          if (!firstStep.disableScroll) {
            scrollToElement(firstStep.targetSelector!, 150);
          }
          setTimeout(() => {
            const element = highlightElement(firstStep.targetSelector!);
            setHighlightedElement(element);
          }, 300);
        } catch (error) {
          console.warn('Tutorial element not found:', firstStep.targetSelector);
        }
      }, 100);
    }
  }, []);

  /**
   * Navigate to next step
   */
  const nextStep = useCallback(async () => {
    if (isLastStep) {
      await completeTutorial();
      return;
    }

    // Run beforeNext validation if present
    if (currentStep?.beforeNext) {
      const canProceed = await currentStep.beforeNext();
      if (!canProceed) return;
    }

    // Cleanup current highlight
    unhighlightElement(highlightedElement);
    setHighlightedElement(null);

    const nextIndex = currentStepIndex + 1;
    const nextStepData = steps[nextIndex];

    setCurrentStepIndex(nextIndex);

    // Execute next step action
    if (nextStepData?.action) {
      await nextStepData.action();
    }

    // Highlight next element
    if (nextStepData?.targetSelector) {
      setTimeout(async () => {
        try {
          await waitForElement(nextStepData.targetSelector!, 2000);
          if (!nextStepData.disableScroll) {
            scrollToElement(nextStepData.targetSelector!, 150);
          }
          setTimeout(() => {
            const element = highlightElement(nextStepData.targetSelector!);
            setHighlightedElement(element);
          }, 300);
        } catch (error) {
          console.warn('Tutorial element not found:', nextStepData.targetSelector);
        }
      }, 100);
    }
  }, [currentStepIndex, steps, isLastStep, currentStep, highlightedElement]);

  /**
   * Navigate to previous step
   */
  const previousStep = useCallback(() => {
    if (isFirstStep) return;

    // Cleanup current highlight
    unhighlightElement(highlightedElement);
    setHighlightedElement(null);

    const prevIndex = currentStepIndex - 1;
    const prevStepData = steps[prevIndex];

    setCurrentStepIndex(prevIndex);

    // Execute previous step action
    if (prevStepData?.action) {
      prevStepData.action();
    }

    // Highlight previous element
    if (prevStepData?.targetSelector) {
      setTimeout(async () => {
        try {
          await waitForElement(prevStepData.targetSelector!, 2000);
          if (!prevStepData.disableScroll) {
            scrollToElement(prevStepData.targetSelector!, 150);
          }
          setTimeout(() => {
            const element = highlightElement(prevStepData.targetSelector!);
            setHighlightedElement(element);
          }, 300);
        } catch (error) {
          console.warn('Tutorial element not found:', prevStepData.targetSelector);
        }
      }, 100);
    }
  }, [currentStepIndex, steps, isFirstStep, highlightedElement]);

  /**
   * Skip tutorial and mark as completed
   */
  const skipTutorial = useCallback(async () => {
    if (!currentTutorialId || !user) return;

    const completion: TutorialCompletion = {
      completed_at: new Date().toISOString(),
      steps_completed: currentStepIndex,
      skipped: true,
    };

    await updateTutorialCompletion(currentTutorialId, completion);
    exitTutorial();
  }, [currentTutorialId, currentStepIndex, user]);

  /**
   * Complete tutorial
   */
  const completeTutorial = useCallback(async () => {
    if (!currentTutorialId || !user) return;

    const completion: TutorialCompletion = {
      completed_at: new Date().toISOString(),
      steps_completed: steps.length,
      skipped: false,
    };

    await updateTutorialCompletion(currentTutorialId, completion);
    exitTutorial();
  }, [currentTutorialId, steps.length, user]);

  /**
   * Exit tutorial without saving
   */
  const exitTutorial = useCallback(() => {
    unhighlightElement(highlightedElement);
    setHighlightedElement(null);
    setIsActive(false);
    setCurrentTutorialId(null);
    setCurrentStepIndex(0);
    setSteps([]);
  }, [highlightedElement]);

  /**
   * Update tutorial completion in database
   */
  const updateTutorialCompletion = async (
    tutorialId: string,
    completion: TutorialCompletion
  ) => {
    if (!user || !profile) return;

    const updatedTutorials = {
      ...(profile.tutorials_completed || {}),
      [tutorialId]: completion,
    };

    const { error } = await supabase
      .from('profiles')
      .update({ tutorials_completed: updatedTutorials })
      .eq('id', user.id);

    if (error) {
      console.error('Failed to update tutorial completion:', error);
      return;
    }

    // Update local profile state
    setProfile({
      ...profile,
      tutorials_completed: updatedTutorials,
    });
  };

  const value: TutorialContextValue = {
    isActive,
    currentTutorialId,
    currentStepIndex,
    steps,
    highlightedElement,
    currentStep,
    isFirstStep,
    isLastStep,
    progress,
    startTutorial,
    nextStep,
    previousStep,
    skipTutorial,
    completeTutorial,
    exitTutorial,
  };

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  const context = useContext(TutorialContext);
  if (context === undefined) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
}

/**
 * Tutorial Types
 * Types for the tutorial/onboarding system
 */

// Popup position relative to highlighted element
export type PopupPosition =
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'center';

// Individual tutorial step
export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetSelector?: string; // CSS selector for element to highlight (optional for center popups)
  position?: PopupPosition; // Where to position popup relative to target
  action?: () => void | Promise<void>; // Optional action to perform on step entry
  beforeNext?: () => boolean | Promise<boolean>; // Validation before proceeding to next step
  disableNext?: boolean; // Disable next button (useful for steps requiring user action)
  disableScroll?: boolean; // Disable auto-scroll to element (useful for elements already in view)
}

// Complete tutorial definition
export interface Tutorial {
  id: string;
  name: string;
  description?: string;
  steps: TutorialStep[];
}

// Tutorial completion data stored in database
export interface TutorialCompletion {
  completed_at: string; // ISO timestamp
  steps_completed: number;
  skipped?: boolean; // Whether tutorial was skipped vs completed
  data?: Record<string, any>; // Additional tutorial-specific data
}

// Tutorial context state
export interface TutorialContextState {
  isActive: boolean;
  currentTutorialId: string | null;
  currentStepIndex: number;
  steps: TutorialStep[];
  highlightedElement: HTMLElement | null;
}

// Tutorial context methods
export interface TutorialContextMethods {
  startTutorial: (tutorial: Tutorial) => void;
  nextStep: () => Promise<void>;
  previousStep: () => void;
  skipTutorial: () => Promise<void>;
  completeTutorial: () => Promise<void>;
  exitTutorial: () => void;
}

// Combined tutorial context value
export interface TutorialContextValue extends TutorialContextState, TutorialContextMethods {
  currentStep: TutorialStep | null;
  isFirstStep: boolean;
  isLastStep: boolean;
  progress: number; // Percentage (0-100)
}

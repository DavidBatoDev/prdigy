import { useEffect, useState, useRef } from 'react';
import { useTutorial } from '@/contexts/TutorialContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, SkipForward } from 'lucide-react';
import {
  getElementPosition,
  calculatePopupPosition,
  type CalculatedPosition,
} from '@/lib/tutorialHelpers';

export function TutorialPopup() {
  const {
    isActive,
    currentStep,
    currentStepIndex,
    steps,
    isFirstStep,
    isLastStep,
    nextStep,
    previousStep,
    skipTutorial,
    exitTutorial,
  } = useTutorial();

  const [position, setPosition] = useState<CalculatedPosition>({
    top: 0,
    left: 0,
    position: 'center',
  });
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !currentStep) return;

    const updatePosition = () => {
      if (!currentStep.targetSelector) {
        // Center position for steps without target
        setPosition({
          top: window.scrollY + window.innerHeight / 2 - 200,
          left: window.scrollX + window.innerWidth / 2 - 200,
          position: 'center',
        });
        return;
      }

      const targetRect = getElementPosition(currentStep.targetSelector);
      if (!targetRect || !popupRef.current) return;

      const popupSize = {
        width: popupRef.current.offsetWidth || 400,
        height: popupRef.current.offsetHeight || 300,
      };

      const calculatedPos = calculatePopupPosition(
        targetRect,
        popupSize,
        currentStep.position || 'bottom',
        20
      );

      setPosition(calculatedPos);
    };

    // Initial position calculation with delay to ensure popup is rendered
    setTimeout(updatePosition, 100);

    // Update on scroll and resize
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isActive, currentStep]);

  if (!isActive || !currentStep) return null;

  const stepNumber = currentStepIndex + 1;
  const totalSteps = steps.length;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentStep.id}
        ref={popupRef}
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="fixed bg-white rounded-xl shadow-2xl pointer-events-auto"
        style={{
          top: position.top,
          left: position.left,
          width: '400px',
          maxWidth: '90vw',
          zIndex: 10002,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">
              <span className="text-pink-600 font-semibold text-sm">{stepNumber}</span>
            </div>
            <span className="text-sm text-gray-500">
              Step {stepNumber} of {totalSteps}
            </span>
          </div>
          <button
            onClick={exitTutorial}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close tutorial"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-3">
            {currentStep.title}
          </h3>
          <p className="text-gray-600 leading-relaxed">
            {currentStep.description}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button
            onClick={skipTutorial}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <SkipForward className="w-4 h-4" />
            Skip Tutorial
          </button>

          <div className="flex items-center gap-2">
            {!isFirstStep && (
              <button
                onClick={previousStep}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
            )}

            <button
              onClick={nextStep}
              disabled={currentStep.disableNext}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {isLastStep ? 'Complete' : 'Next'}
              {!isLastStep && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Arrow pointer to highlighted element */}
        {currentStep.targetSelector && position.position !== 'center' && (
          <div
            className="absolute w-4 h-4 bg-white transform rotate-45"
            style={{
              ...(position.position.includes('top') && {
                bottom: '-8px',
                left: '50%',
                marginLeft: '-8px',
              }),
              ...(position.position.includes('bottom') && {
                top: '-8px',
                left: '50%',
                marginLeft: '-8px',
              }),
              ...(position.position === 'left' && {
                right: '-8px',
                top: '50%',
                marginTop: '-8px',
              }),
              ...(position.position === 'right' && {
                left: '-8px',
                top: '50%',
                marginTop: '-8px',
              }),
            }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}

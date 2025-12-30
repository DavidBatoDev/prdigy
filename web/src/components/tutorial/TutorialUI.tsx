import { TutorialOverlay } from './TutorialOverlay';
import { TutorialPopup } from './TutorialPopup';
import { useTutorial } from '@/contexts/TutorialContext';

/**
 * Main tutorial UI component that renders both overlay and popup
 * This should be placed at the root level of your app
 */
export function TutorialUI() {
  const { isActive } = useTutorial();

  if (!isActive) return null;

  return (
    <>
      <TutorialOverlay />
      <TutorialPopup />
    </>
  );
}

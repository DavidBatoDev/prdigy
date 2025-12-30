import { useEffect, useState } from 'react';
import { useTutorial } from '@/contexts/TutorialContext';
import { motion, AnimatePresence } from 'framer-motion';

export function TutorialOverlay() {
  const { isActive, highlightedElement } = useTutorial();
  const [elementRect, setElementRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!highlightedElement) {
      setElementRect(null);
      return;
    }

    const updateRect = () => {
      const rect = highlightedElement.getBoundingClientRect();
      setElementRect(rect);
    };

    updateRect();

    // Update on scroll and resize
    window.addEventListener('scroll', updateRect, true);
    window.addEventListener('resize', updateRect);

    return () => {
      window.removeEventListener('scroll', updateRect, true);
      window.removeEventListener('resize', updateRect);
    };
  }, [highlightedElement]);

  if (!isActive) return null;

  // Calculate cutout dimensions with padding
  const padding = 8;
  const cutoutRect = elementRect
    ? {
        x: elementRect.left - padding,
        y: elementRect.top - padding,
        width: elementRect.width + padding * 2,
        height: elementRect.height + padding * 2,
      }
    : null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 10000 }}
      >
        <svg
          className="absolute inset-0 w-full h-full"
          style={{ pointerEvents: 'none' }}
        >
          <defs>
            <mask id="tutorial-mask">
              {/* White background - visible area */}
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              
              {/* Black cutout - transparent area for highlighted element */}
              {cutoutRect && (
                <motion.rect
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  x={cutoutRect.x}
                  y={cutoutRect.y}
                  width={cutoutRect.width}
                  height={cutoutRect.height}
                  rx="8"
                  ry="8"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          
          {/* Dark overlay with mask applied */}
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.7)"
            mask="url(#tutorial-mask)"
          />
        </svg>

        {/* Pink glow around highlighted element */}
        {cutoutRect && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="absolute pointer-events-none"
            style={{
              top: cutoutRect.y,
              left: cutoutRect.x,
              width: cutoutRect.width,
              height: cutoutRect.height,
              borderRadius: '8px',
              boxShadow: '0 0 0 2px rgba(236, 72, 153, 0.5), 0 0 20px 4px rgba(236, 72, 153, 0.3)',
            }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}

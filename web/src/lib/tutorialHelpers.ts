/**
 * Tutorial Helper Functions
 * Utilities for DOM manipulation, positioning, and element detection
 */

import type { PopupPosition } from '@/types/tutorial.types';

export interface ElementPosition {
  top: number;
  left: number;
  width: number;
  height: number;
  bottom: number;
  right: number;
}

export interface PopupSize {
  width: number;
  height: number;
}

export interface CalculatedPosition {
  top: number;
  left: number;
  position: PopupPosition;
}

/**
 * Get the position and dimensions of an element
 */
export function getElementPosition(selector: string): ElementPosition | null {
  const element = document.querySelector(selector);
  if (!element) return null;

  const rect = element.getBoundingClientRect();
  return {
    top: rect.top + window.scrollY,
    left: rect.left + window.scrollX,
    width: rect.width,
    height: rect.height,
    bottom: rect.bottom + window.scrollY,
    right: rect.right + window.scrollX,
  };
}

/**
 * Calculate optimal popup position relative to target element
 * Auto-adjusts if popup would overflow viewport
 */
export function calculatePopupPosition(
  targetRect: ElementPosition,
  popupSize: PopupSize,
  preferredPosition: PopupPosition = 'bottom',
  spacing: number = 16
): CalculatedPosition {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const scrollY = window.scrollY;
  const scrollX = window.scrollX;

  let top = 0;
  let left = 0;
  let finalPosition = preferredPosition;

  // Calculate position based on preference
  switch (preferredPosition) {
    case 'top':
      top = targetRect.top - popupSize.height - spacing;
      left = targetRect.left + targetRect.width / 2 - popupSize.width / 2;
      break;

    case 'bottom':
      top = targetRect.bottom + spacing;
      left = targetRect.left + targetRect.width / 2 - popupSize.width / 2;
      break;

    case 'left':
      top = targetRect.top + targetRect.height / 2 - popupSize.height / 2;
      left = targetRect.left - popupSize.width - spacing;
      break;

    case 'right':
      top = targetRect.top + targetRect.height / 2 - popupSize.height / 2;
      left = targetRect.right + spacing;
      break;

    case 'top-left':
      top = targetRect.top - popupSize.height - spacing;
      left = targetRect.left;
      break;

    case 'top-right':
      top = targetRect.top - popupSize.height - spacing;
      left = targetRect.right - popupSize.width;
      break;

    case 'bottom-left':
      top = targetRect.bottom + spacing;
      left = targetRect.left;
      break;

    case 'bottom-right':
      top = targetRect.bottom + spacing;
      left = targetRect.right - popupSize.width;
      break;

    case 'center':
      top = scrollY + viewportHeight / 2 - popupSize.height / 2;
      left = scrollX + viewportWidth / 2 - popupSize.width / 2;
      break;
  }

  // Check if popup overflows viewport and adjust
  const popupBottom = top - scrollY + popupSize.height;
  const popupRight = left - scrollX + popupSize.width;
  const popupTop = top - scrollY;
  const popupLeft = left - scrollX;

  // Adjust horizontal overflow
  if (popupRight > viewportWidth) {
    left = scrollX + viewportWidth - popupSize.width - spacing;
  }
  if (popupLeft < 0) {
    left = scrollX + spacing;
  }

  // Adjust vertical overflow
  if (popupBottom > viewportHeight) {
    top = scrollY + viewportHeight - popupSize.height - spacing;
  }
  if (popupTop < 0) {
    top = scrollY + spacing;
  }

  return { top, left, position: finalPosition };
}

/**
 * Smooth scroll to bring element into view
 */
export function scrollToElement(selector: string, offset: number = 100): void {
  const element = document.querySelector(selector);
  if (!element) return;

  const rect = element.getBoundingClientRect();
  const absoluteTop = rect.top + window.scrollY;
  const scrollTo = absoluteTop - offset;

  window.scrollTo({
    top: scrollTo,
    behavior: 'smooth',
  });
}

/**
 * Wait for an element to appear in the DOM
 */
export function waitForElement(
  selector: string,
  timeout: number = 5000
): Promise<HTMLElement> {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector) as HTMLElement;
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element ${selector} not found within ${timeout}ms`));
    }, timeout);
  });
}

/**
 * Check if element is in viewport
 */
export function isElementInViewport(selector: string): boolean {
  const element = document.querySelector(selector);
  if (!element) return false;

  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= window.innerHeight &&
    rect.right <= window.innerWidth
  );
}

/**
 * Add highlight class to element
 */
export function highlightElement(selector: string): HTMLElement | null {
  const element = document.querySelector(selector) as HTMLElement;
  if (!element) return null;

  element.setAttribute('data-tutorial-highlight', 'true');
  
  // Store original position value
  const originalPosition = window.getComputedStyle(element).position;
  element.setAttribute('data-tutorial-original-position', originalPosition);
  
  // Only set position if it's static (default), otherwise keep original
  if (originalPosition === 'static') {
    element.style.position = 'relative';
  }
  
  element.style.zIndex = '10001';
  
  return element;
}

/**
 * Remove highlight from element
 */
export function unhighlightElement(element: HTMLElement | null): void {
  if (!element) return;

  element.removeAttribute('data-tutorial-highlight');
  
  // Restore original position
  const originalPosition = element.getAttribute('data-tutorial-original-position');
  if (originalPosition === 'static') {
    element.style.position = '';
  }
  element.removeAttribute('data-tutorial-original-position');
  
  element.style.zIndex = '';
}

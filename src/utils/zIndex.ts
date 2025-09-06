/**
 * Z-Index Hierarchy for Portfolio Assistant
 * 
 * This file defines the z-index values used throughout the application
 * to ensure proper layering and prevent navigation/content overlap issues.
 */

export const Z_INDEX = {
  /**
   * Base/Default Level (z-0)
   * Regular page content, cards, etc.
   */
  BASE: 0,

  /**
   * Low Level (z-1 to z-9)
   * Slightly elevated content, subtle overlays
   */
  ELEVATED: 1,

  /**
   * Mid Level (z-10 to z-49)
   * Dropdowns, tooltips, local overlays
   */
  DROPDOWN: 10,
  TOOLTIP: 20,
  POPOVER: 30,

  /**
   * Navigation Level (z-50)
   * Navigation bars (top header, bottom mobile nav)
   */
  NAVIGATION: 50,

  /**
   * Modal Level (z-9999)
   * Modals, dialogs - highest priority, above everything
   */
  MODAL: 9999,
} as const;

/**
 * Utility function to get z-index class names
 */
export const getZIndexClass = (level: keyof typeof Z_INDEX): string => {
  const value = Z_INDEX[level];
  
  // Use bracket notation for high values to ensure proper escaping
  if (value >= 1000) {
    return `z-[${value}]`;
  }
  
  return `z-${value}`;
};

/**
 * CSS-in-JS z-index values (for styled components or inline styles)
 */
export const zIndexStyle = (level: keyof typeof Z_INDEX): { zIndex: number } => ({
  zIndex: Z_INDEX[level],
});

/**
 * Guidelines for z-index usage:
 * 
 * 1. BASE (z-0): Default for all regular content
 * 2. ELEVATED (z-1): Slightly raised content like cards on hover
 * 3. DROPDOWN (z-10): Component dropdowns, select menus
 * 4. TOOLTIP (z-20): Tooltips, help text overlays
 * 5. POPOVER (z-30): Larger popovers, date pickers
 * 6. NAVIGATION (z-50): All navigation elements
 * 7. MODAL (z-9999): All modals, dialogs, full-screen overlays
 * 
 * Usage Examples:
 * 
 * // In React components:
 * <div className={getZIndexClass('MODAL')}>Modal content</div>
 * 
 * // Modal overlay (full screen coverage):
 * className="fixed inset-0 bg-black bg-opacity-50 z-[9999] p-2 pt-20 pb-20 sm:p-4 sm:pt-4 sm:pb-4"
 * 
 * // For inline styles:
 * style={zIndexStyle('NAVIGATION')}
 * 
 * // IMPORTANT: Modal padding order matters!
 * // ✅ Correct: p-2 pt-20 pb-20 sm:p-4 sm:pt-4 sm:pb-4
 * // ❌ Wrong:   p-2 sm:p-4 pt-20 pb-20 sm:pt-4 sm:pb-4 (creates gaps on desktop)
 */

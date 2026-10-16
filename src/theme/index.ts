// src/theme/index.ts
import { colors } from './colors';

export const theme = {
  colors,
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40, // Added for larger layout spacing
  },
  fontSizes: {
    xs: 10,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32, // For Large Titles
  },
  borderRadius: 12, // Slightly more curved for modern look
  
  // --- New Gradients Section ---
  gradients: {
    header: [colors.gradHeaderStart, colors.gradHeaderMid, colors.gradHeaderEnd],
    primaryButton: [colors.gradBtnStart, colors.gradBtnMid, colors.gradBtnEnd],
  },
};
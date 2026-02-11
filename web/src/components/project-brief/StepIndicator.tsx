import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface StepIndicatorProps {
  step: number;
  currentStep: number;
  label: string;
  totalSteps?: number; // For determining color (2-step vs 3-step)
}

export function StepIndicator({ step, currentStep, label, totalSteps = 2 }: StepIndicatorProps) {
  const isActive = step === currentStep;
  const isCompleted = step < currentStep;

  // Determine colors based on step state and position
  let bgClass = "bg-gray-200";
  let textClass = "text-gray-400";
  let shadowClass = "";
  let labelClass = "text-gray-400";
  let glowGradient = "";

  if (isActive || isCompleted) {
    if (step === 1) {
      bgClass = "bg-[#ff9933]";
      textClass = "text-white";
      shadowClass = isActive ? "shadow-[0_0_20px_rgba(255,153,51,0.4)]" : "";
      labelClass = isActive ? "text-[#ff9933] font-semibold" : "text-[#ff9933]";
      glowGradient = "from-[#ff9933] to-[#ff9933]";
    } else if (step === 2) {
      bgClass = "bg-[#e91e63]";
      textClass = "text-white";
      shadowClass = isActive ? "shadow-[0_0_20px_rgba(233,30,99,0.4)]" : "";
      labelClass = isActive ? "text-[#e91e63] font-semibold" : "text-[#e91e63]";
      glowGradient = "from-[#e91e63] to-[#e91e63]";
    } else if (totalSteps >= 3) {
      // Only used in 3-step flow
      bgClass = "bg-[#8b5cf6]";
      textClass = "text-white";
      shadowClass = isActive ? "shadow-[0_0_20px_rgba(139,92,246,0.4)]" : "";
      labelClass = isActive ? "text-[#8b5cf6] font-semibold" : "text-[#8b5cf6]";
      glowGradient = "from-[#8b5cf6] to-[#8b5cf6]";
    }
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        {/* Glow ring - only show for active steps */}
        {(isActive || isCompleted) && (
          <motion.div
            className={`absolute -inset-2 rounded-full blur-md opacity-60 bg-linear-to-r ${glowGradient}`}
            initial={false}
            animate={{
              opacity: isActive || isCompleted ? 0.7 : 0,
              scale: isActive ? [1, 1.06, 1] : 1,
            }}
            transition={{
              duration: 1.2,
              repeat: isActive ? Infinity : 0,
              ease: "easeInOut",
            }}
          />
        )}
        <motion.div
          className={`relative w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 ${bgClass} ${textClass} ${shadowClass}`}
          initial={false}
          animate={{
            scale: isActive ? 1.15 : 1,
          }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
          }}
        >
          <motion.div
            initial={false}
            animate={{
              scale: isCompleted ? [1, 1.2, 1] : 1,
              opacity: isCompleted ? [0, 1] : 1,
            }}
            transition={{
              duration: 0.4,
              ease: "easeOut",
            }}
          >
            {isCompleted ? <Check className="w-6 h-6" /> : <span>{step}</span>}
          </motion.div>
        </motion.div>
      </div>
      <p className={`mt-2 text-xs transition-colors duration-300 ${labelClass}`}>
        {label}
      </p>
    </div>
  );
}

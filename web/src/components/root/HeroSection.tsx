import { Link } from "@tanstack/react-router";
import { Button } from "@/ui/button";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const typingPhrases = [
  "Hire structured teams curated by expert consultants who understand your vision.",
  "Build your startup with a readily structured team that grows with your success.",
  "Get comprehensive product management & team leadership expertise all in one place.",
  "Connect with experienced consultants who assemble and manage complete teams for you.",
  "Transform your vision into a thriving, managed startup with professional guidance.",
];

const useTypingEffect = (
  phrases: string[],
  typingSpeed = 30,
  deletingSpeed = 20,
  pauseDuration = 1500
) => {
  const [displayText, setDisplayText] = useState("");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentPhrase = phrases[phraseIndex];
    let timeout: NodeJS.Timeout;

    if (!isDeleting && displayText === currentPhrase) {
      // Pause at the end of the phrase
      timeout = setTimeout(() => setIsDeleting(true), pauseDuration);
    } else if (isDeleting && displayText === "") {
      // Move to next phrase
      setIsDeleting(false);
      setPhraseIndex((prev) => (prev + 1) % phrases.length);
    } else {
      // Type or delete characters
      const speed = isDeleting ? deletingSpeed : typingSpeed;
      timeout = setTimeout(() => {
        setDisplayText(
          isDeleting
            ? currentPhrase.substring(0, displayText.length - 1)
            : currentPhrase.substring(0, displayText.length + 1)
        );
      }, speed);
    }

    return () => clearTimeout(timeout);
  }, [
    displayText,
    isDeleting,
    phraseIndex,
    phrases,
    typingSpeed,
    deletingSpeed,
    pauseDuration,
  ]);

  return displayText;
};

export const HeroSection = () => {
  const typedText = useTypingEffect(typingPhrases);

  return (
    <div className="text-center max-w-5xl mx-auto mt-16 mb-16 min-h-[400px] flex flex-col justify-center">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-5xl md:text-7xl font-bold text-gray-900 mb-6"
      >
        Work with Expert
        <br />
        <span className="text-primary">Consultants</span>
      </motion.h1>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed min-h-[3.5rem] flex items-center justify-center"
      >
        <span>
          {typedText}
          <span className="animate-pulse text-primary">|</span>
        </span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
        className="flex justify-center gap-4 mt-12"
      >
        <Link to="/project/roadmap">
          <Button
            variant="contained"
            colorScheme="primary"
            size="lg"
            className="text-lg px-8 py-4"
          >
            Create Your Roadmap
          </Button>
        </Link>
        <Button
          variant="outlined"
          colorScheme="primary"
          size="lg"
          className="text-lg px-8 py-4"
        >
          Find Professional Consultant
        </Button>
      </motion.div>
    </div>
  );
};

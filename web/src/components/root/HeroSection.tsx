import { Link } from "@tanstack/react-router";
import { Button } from "@/ui/button";
import { motion } from "framer-motion";
import { ShieldCheck, Award, Star } from "lucide-react";
import { HeroRoadmapAnimation } from "./HeroRoadmapAnimation";

export const HeroSection = () => {
  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 pt-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-4 items-center">
        {/* Left Column: Text & Search */}
        <div className="flex flex-col space-y-4 justify-center py-2 lg:py-4">
          {/* Trust Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2 bg-gray-50/80 backdrop-blur-sm px-3 py-1.5 rounded-full w-fit border border-gray-100"
          >
            <div className="flex -space-x-2">
              <img className="w-6 h-6 rounded-full border border-white" src="https://i.pravatar.cc/100?img=1" alt="Avatar" />
              <img className="w-6 h-6 rounded-full border border-white" src="https://i.pravatar.cc/100?img=2" alt="Avatar" />
              <img className="w-6 h-6 rounded-full border border-white" src="https://i.pravatar.cc/100?img=3" alt="Avatar" />
            </div>
            <span className="text-xs font-medium text-gray-600">Used by teams to plan and execute real projects</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 leading-[1.1] tracking-tight"
          >
            Turn your idea into a <span className="text-primary">structured roadmap</span>, then build it with <span className="text-secondary">the right experts.</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xs md:text-sm text-gray-600 max-w-2xl leading-relaxed"
          >
            Prodigitality guides delivery from project vision to consultant-backed roadmap to freelancer execution. Clients, consultants, and specialists work inside one execution-ready system.
          </motion.p>

          {/* Action Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="pt-2"
          >
            <Link to="/auth/signup" search={{ redirect: window.location.pathname }}>
              <Button
                variant="contained"
                colorScheme="primary"
                className="rounded-full px-6 py-3 text-sm font-semibold shadow-md hover:shadow-lg transition-all"
              >
                Create Your Roadmap
              </Button>
            </Link>
          </motion.div>
          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-wrap items-center gap-4 text-xs text-gray-500 font-medium pt-1"
          >
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-secondary" />
              <span>Verified Pros</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-secondary" />
              <span>Licensed Experts</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-secondary" />
              <span>4.9/5 Average Rating</span>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Animated Roadmap */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative lg:h-[300px] w-full flex items-center justify-center rounded-[30px] overflow-hidden"
        >
          <HeroRoadmapAnimation />
        </motion.div>
      </div>
    </div>
  );
};

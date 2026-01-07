import { Link } from "@tanstack/react-router";
import { Button } from "@/ui/button";
import { Zap } from "lucide-react";

export const HeroSection = () => {
  return (
    <div className="text-center max-w-5xl mx-auto mb-16">
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6">
        <Zap className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-primary">
          AI-Powered Project Planning
        </span>
      </div>
      <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
        Create a Project
        <br />
        <span className="text-primary">Roadmap</span>
      </h1>
      <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
        Transform your project idea into a comprehensive roadmap with AI. Get
        instant timeline estimates, milestone breakdowns, and budget
        planning—ready to present to expert consultants.
      </p>

      <div className="flex justify-center gap-4 mt-12">
        <Link to="/auth/signup">
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
          View Sample Roadmap
        </Button>
      </div>
    </div>
  );
};

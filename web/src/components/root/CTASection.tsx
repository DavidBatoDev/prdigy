import { Link } from "@tanstack/react-router";
import { Button } from "@/ui/button";
import { TrendingUp } from "lucide-react";

export const CTASection = () => {
  return (
    <div className="mt-24 text-center max-w-3xl mx-auto">
      <div className="bg-linear-to-br from-primary-light via-secondary-light to-white rounded-3xl p-12 border-2 border-primary/20">
        <TrendingUp className="w-12 h-12 text-primary mx-auto mb-4" />
        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          Ready to build your project?
        </h2>
        <p className="text-lg text-gray-700 mb-8">
          Create a professional roadmap in minutes and connect with expert
          consultants who can bring your vision to life. AI-powered planning
          meets human expertise.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link to="/auth/signup">
            <Button variant="contained" colorScheme="primary" size="lg">
              Start Your Project
            </Button>
          </Link>
          <Link to="/landing">
            <Button variant="outlined" colorScheme="primary" size="lg">
              Learn More
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

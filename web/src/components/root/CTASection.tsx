import { Link } from "@tanstack/react-router";
import { Button } from "@/ui/button";
import { TrendingUp } from "lucide-react";

export const CTASection = () => {
  return (
    <div className="mt-24 text-center max-w-3xl mx-auto">
      <div className="bg-linear-to-br from-primary-light via-secondary-light to-white rounded-3xl p-12 border-2 border-primary/20">
        <TrendingUp className="w-12 h-12 text-primary mx-auto mb-4" />
        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          Turn your idea into a working product.
        </h2>
        <p className="text-lg text-gray-700 mb-8">
          Start with a structured roadmap, align with expert consultants, and
          execute with vetted freelancers from first milestone to delivery.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            to="/auth/signup"
            search={{ redirect: window.location.pathname }}
          >
            <Button variant="contained" colorScheme="primary" size="lg">
              Start Your Project
            </Button>
          </Link>
          <Link to="/">
            <Button variant="outlined" colorScheme="primary" size="lg">
              Browse Templates
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

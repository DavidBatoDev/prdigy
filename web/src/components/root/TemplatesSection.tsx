import { CheckCircle2, DollarSign, Loader } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { getRoadmaps } from "@/api";
import type { Roadmap } from "@/types/roadmap";

interface Template {
  id: string;
  title: string;
  category: string;
  milestones: string;
  budget: string;
  image: string;
  tag: string;
}

export const TemplatesSection = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRoadmaps = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use centralized API from apiClient with automatic auth headers
        const roadmaps = await getRoadmaps();

        // Transform roadmaps to template format
        const transformedTemplates: Template[] = roadmaps.map(
          (roadmap: Roadmap, index: number) => ({
            id: roadmap.id,
            title: roadmap.name,
            category: roadmap.description || "Project Roadmap",
            milestones: "View plan",
            budget: "Custom",
            image: `https://images.unsplash.com/photo-${1563013544 + index}?w=400&h=300&fit=crop`,
            tag:
              index === 0
                ? "Active"
                : roadmap.status === "completed"
                  ? "Completed"
                  : "Draft",
          }),
        );

        setTemplates(transformedTemplates);
      } catch (err) {
        console.error("Error fetching roadmaps:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load roadmaps",
        );
        setTemplates([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRoadmaps();
  }, []);
  return (
    <div className="mt-24">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">Your Roadmaps</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          View all your AI-generated roadmaps with timelines, milestones, and
          budget estimates
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <p className="text-gray-600">
            Unable to load roadmaps. Please try again later.
          </p>
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">
            No roadmaps yet. Create your first roadmap to get started!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {templates.map((template) => (
            <Link
              key={template.id}
              to="/project/roadmap/$roadmapId"
              params={{ roadmapId: template.id }}
              className="group relative bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:border-primary hover:shadow-xl transition-all block"
            >
              <div className="absolute top-3 left-3 z-10">
                <span className="px-3 py-1 bg-primary text-white text-xs font-semibold rounded-full">
                  {template.tag}
                </span>
              </div>
              <div className="aspect-4/3 overflow-hidden bg-linear-to-br from-primary-light to-secondary-light">
                <img
                  src={template.image}
                  alt={template.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-1">
                  {template.title}
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  {template.category}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {template.milestones}
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    {template.budget}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

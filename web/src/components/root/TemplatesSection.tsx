import { CheckCircle2, DollarSign, Loader, Inbox } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { getRoadmapsPreview } from "@/api";
import { ProjectTypes } from "./ProjectTypes";
import type { RoadmapPreview } from "@/api/endpoints/roadmap";

interface Template {
  id: string;
  title: string;
  category: string;
  milestones: string;
  budget: string;
  tag: string;
  preview: RoadmapPreview;
}

const EpicOverview = ({ preview }: { preview: RoadmapPreview }) => {
  const MAX_EPICS = 5;

  const allEpics = [...(preview.epics || [])].sort(
    (a, b) => a.position - b.position,
  );

  const displayedEpics = allEpics.slice(0, MAX_EPICS);
  const remainingCount = allEpics.length - MAX_EPICS;

  if (allEpics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-8 px-4">
        <div className="bg-gray-100 rounded-full p-3 mb-3">
          <Inbox className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-600 mb-1">No epics yet</p>
        <p className="text-xs text-gray-500 text-center">
          This roadmap is empty
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg h-full flex flex-col">
      <div className="flex-1 py-2">
        {displayedEpics.map((epic, index) => {
          const featureCount = epic.features?.length || 0;
          const isLast = index === displayedEpics.length - 1;
          return (
            <div
              key={epic.id}
              className="flex items-start gap-3 px-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex flex-col items-center shrink-0 pt-1">
                <div className="w-2 h-2 rounded-full bg-primary" />
                {!isLast && <div className="w-0.5 h-5 bg-gray-200 mt-1" />}
              </div>
              <div className="flex items-start justify-between flex-1 min-w-0 pb-1">
                <span className="text-sm font-medium text-gray-900 truncate pt-0.5">
                  {epic.title}
                </span>
                <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full whitespace-nowrap ml-2">
                  {featureCount} {featureCount === 1 ? "feature" : "features"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      {remainingCount > 0 && (
        <div className="py-2 px-3 text-center border-t border-gray-100">
          <span className="text-xs text-gray-500">
            +{remainingCount} more {remainingCount === 1 ? "epic" : "epics"}
          </span>
        </div>
      )}
    </div>
  );
};

const mockProfessionalTemplates = [
  {
    id: "temp-1",
    title: "E-Commerce MVP Launch",
    category: "Web Application",
    milestones: "4 Milestones",
    budget: "$15k - $25k",
    tag: "Premium",
    author: {
      name: "Sarah Jenkins",
      role: "Lead Product Manager",
      avatar: "https://i.pravatar.cc/150?u=sarah",
    },
    preview: {
      id: "mock-1",
      name: "E-Commerce MVP",
      description: "Complete roadmap for launching a scalable e-commerce platform.",
      status: "published",
      epics: [
        { id: "e1", title: "User Authentication", position: 1, features: [1, 2, 3] },
        { id: "e2", title: "Product Catalog", position: 2, features: [1, 2, 3, 4] },
        { id: "e3", title: "Shopping Cart", position: 3, features: [1, 2] },
        { id: "e4", title: "Payment Integration", position: 4, features: [1, 2, 3] },
      ]
    } as unknown as RoadmapPreview
  },
  {
    id: "temp-2",
    title: "SaaS Onboarding Flow",
    category: "SaaS Product",
    milestones: "3 Milestones",
    budget: "$8k - $12k",
    tag: "Popular",
    author: {
      name: "David Chen",
      role: "UX Strategist",
      avatar: "https://i.pravatar.cc/150?u=david",
    },
    preview: {
      id: "mock-2",
      name: "SaaS Onboarding Flow",
      description: "Optimize user activation and retention with this onboarding plan.",
      status: "published",
      epics: [
        { id: "e1", title: "Welcome Screen & Survey", position: 1, features: [1, 2] },
        { id: "e2", title: "Interactive Product Tour", position: 2, features: [1, 2, 3, 4] },
        { id: "e3", title: "Activation Email Sequence", position: 3, features: [1, 2, 3] },
      ]
    } as unknown as RoadmapPreview
  },
  {
    id: "temp-3",
    title: "Healthcare iOS App",
    category: "Mobile App",
    milestones: "6 Milestones",
    budget: "$30k - $50k",
    tag: "Pro",
    author: {
      name: "Elena Rodriguez",
      role: "Senior iOS Developer",
      avatar: "https://i.pravatar.cc/150?u=elena",
    },
    preview: {
      id: "mock-3",
      name: "Healthcare iOS App",
      description: "HIPAA-compliant mobile application roadmap.",
      status: "published",
      epics: [
        { id: "e1", title: "Secure Auth (HIPAA)", position: 1, features: [1, 2, 3] },
        { id: "e2", title: "Patient Dashboard", position: 2, features: [1, 2] },
        { id: "e3", title: "Appointment Scheduling", position: 3, features: [1, 2, 3, 4] },
        { id: "e4", title: "Telehealth Video SDK", position: 4, features: [1, 2, 3, 4, 5] },
        { id: "e5", title: "Medical Records", position: 5, features: [1, 2] },
      ]
    } as unknown as RoadmapPreview
  },
  {
    id: "temp-4",
    title: "Financial Dashboard API",
    category: "API Service",
    milestones: "3 Milestones",
    budget: "$12k - $18k",
    tag: "New",
    author: {
      name: "Marcus Johnson",
      role: "Backend Architect",
      avatar: "https://i.pravatar.cc/150?u=marcus",
    },
    preview: {
      id: "mock-4",
      name: "Financial Dashboard API",
      description: "Scalable microservices architecture for fintech.",
      status: "published",
      epics: [
        { id: "e1", title: "Data Ingestion Pipeline", position: 1, features: [1, 2, 3] },
        { id: "e2", title: "Real-time Analytics Engine", position: 2, features: [1, 2, 3, 4] },
        { id: "e3", title: "GraphQL API Layer", position: 3, features: [1, 2, 3] },
      ]
    } as unknown as RoadmapPreview
  }
];

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
        const roadmaps = await getRoadmapsPreview();

        // Transform roadmaps to template format
        const transformedTemplates: Template[] = roadmaps.map(
          (roadmap: RoadmapPreview, index: number) => ({
            id: roadmap.id,
            title: roadmap.name,
            category: roadmap.description || "Project Roadmap",
            milestones: "View plan",
            budget: "Custom",
            tag:
              index === 0
                ? "Active"
                : roadmap.status === "completed"
                  ? "Completed"
                  : "Draft",
            preview: roadmap,
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
    <div className="mt-24 space-y-24">
      {/* User Roadmaps Section */}
      <div>
        <div className="flex items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mr-4 whitespace-nowrap">Your Roadmaps</h2>
          <div className="flex-1 h-px bg-gray-200"></div>
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
          <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-gray-200">
            <p className="text-gray-600 text-lg">
              No roadmaps yet. Create your first roadmap to get started!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {templates.map((template) => (
              <Link
                key={template.id}
                to="/project/$projectId/roadmap/$roadmapId"
                params={{ projectId: template.preview.project_id || "n", roadmapId: template.id }}
                className="group relative bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:border-primary hover:shadow-xl transition-all block"
              >
                <div className="aspect-4/3 overflow-hidden bg-linear-to-br from-blue-50 to-indigo-50 p-4">
                  <EpicOverview preview={template.preview} />
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">
                      {template.title}
                    </h3>
                    <span className="px-2 py-0.5 bg-primary text-white text-xs font-semibold rounded-full">
                      {template.tag}
                    </span>
                  </div>
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

      {/* Professional Templates Section */}
      <div>
        <div className="flex flex-col mb-8">
          <div className="flex items-center">
            <h2 className="text-2xl font-bold text-gray-900 mr-4 whitespace-nowrap">Templates by Professional Consultants</h2>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>
          <p className="text-base text-gray-600 mt-2">
            Kickstart your project by borrowing complete roadmaps from industry-leading experts.
          </p>
        </div>
        
        <ProjectTypes />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {mockProfessionalTemplates.map((template) => (
            <div
              key={template.id}
              className="group relative bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:border-[#c68c53] hover:shadow-xl transition-all block cursor-pointer"
            >
              <div className="aspect-4/3 overflow-hidden bg-linear-to-br from-[#f0f7f9] to-[#ffffff] p-4 relative">
                <EpicOverview preview={template.preview} />
                
                {/* Consultant Badge Overlay */}
                <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-sm rounded-lg p-2 flex items-center gap-2 shadow-sm border border-gray-100">
                  <img src={template.author.avatar} alt={template.author.name} className="w-8 h-8 rounded-full object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-gray-900 truncate">{template.author.name}</p>
                    <p className="text-[10px] text-gray-500 truncate">{template.author.role}</p>
                  </div>
                </div>
              </div>
              <div className="p-4 pt-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">
                    {template.title}
                  </h3>
                  <span className="px-2 py-0.5 bg-[#0f4c5c] text-white text-xs font-semibold rounded-full">
                    {template.tag}
                  </span>
                </div>
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
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

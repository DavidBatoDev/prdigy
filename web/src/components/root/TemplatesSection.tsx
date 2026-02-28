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
  const MAX_EPICS = 3;

  const allEpics = [...(preview.epics || [])].sort(
    (a, b) => a.position - b.position,
  );

  const displayedEpics = allEpics.slice(0, MAX_EPICS);
  const remainingCount = allEpics.length - MAX_EPICS;

  if (allEpics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-4 px-2">
        <div className="bg-gray-100 rounded-full p-2 mb-2">
          <Inbox className="w-4 h-4 text-gray-400" />
        </div>
        <p className="text-xs font-medium text-gray-600 mb-0.5">No epics</p>
        <p className="text-[10px] text-gray-500 text-center leading-tight">
          Empty roadmap
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
                className="flex items-start gap-2 px-2 hover:bg-gray-50 transition-colors"
              >
                <div className="flex flex-col items-center shrink-0 pt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {!isLast && <div className="w-px h-4 bg-gray-200 mt-1" />}
                </div>
                <div className="flex items-start justify-between flex-1 min-w-0 pb-1">
                  <span className="text-xs font-medium text-gray-900 truncate">
                    {epic.title}
                  </span>
                  <span className="text-[9px] text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded-full whitespace-nowrap ml-1 shrink-0">
                    {featureCount} {featureCount === 1 ? "feat" : "feats"}
                  </span>
                </div>
              </div>
          );
        })}
      </div>
      {remainingCount > 0 && (
        <div className="py-1 px-2 text-center border-t border-gray-100 mt-auto">
          <span className="text-[10px] text-gray-500">
            +{remainingCount} more
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
  },
  {
    id: "temp-5",
    title: "AI Chatbot Integration",
    category: "AI & Machine Learning",
    milestones: "4 Milestones",
    budget: "$15k - $22k",
    tag: "Trending",
    author: {
      name: "Alex Rivera",
      role: "AI Integration Specialist",
      avatar: "https://i.pravatar.cc/150?u=alex",
    },
    preview: {
      id: "mock-5",
      name: "AI Chatbot Integration",
      description: "Embed LLM-powered support agents into existing platforms.",
      status: "published",
      epics: [
        { id: "e1", title: "Model Fine-tuning", position: 1, features: [1, 2, 3] },
        { id: "e2", title: "Knowledge Base Sync", position: 2, features: [1, 2] },
        { id: "e3", title: "Chat Widget UI", position: 3, features: [1, 2, 3, 4] },
        { id: "e4", title: "Deployment & Monitoring", position: 4, features: [1, 2] },
      ]
    } as unknown as RoadmapPreview
  },
  {
    id: "temp-6",
    title: "NFT Marketplace",
    category: "Web3 & Blockchain",
    milestones: "5 Milestones",
    budget: "$40k - $60k",
    tag: "Pro",
    author: {
      name: "Liam O'Connor",
      role: "Smart Contract Engineer",
      avatar: "https://i.pravatar.cc/150?u=liam",
    },
    preview: {
      id: "mock-6",
      name: "NFT Marketplace",
      description: "End-to-end decentralized application for minting and trading.",
      status: "published",
      epics: [
        { id: "e1", title: "Smart Contract Audits", position: 1, features: [1, 2, 3] },
        { id: "e2", title: "Wallet Integation", position: 2, features: [1, 2, 3, 4] },
        { id: "e3", title: "Minting Engine", position: 3, features: [1, 2] },
      ]
    } as unknown as RoadmapPreview
  },
  {
    id: "temp-7",
    title: "Brand Strategy Refresh",
    category: "Marketing",
    milestones: "3 Milestones",
    budget: "$10k - $15k",
    tag: "Popular",
    author: {
      name: "Chloe Evans",
      role: "Creative Director",
      avatar: "https://i.pravatar.cc/150?u=chloe",
    },
    preview: {
      id: "mock-7",
      name: "Brand Strategy Refresh",
      description: "Comprehensive brand identity overhaul and market positioning.",
      status: "published",
      epics: [
        { id: "e1", title: "Market Research", position: 1, features: [1, 2, 3] },
        { id: "e2", title: "Visual Identity System", position: 2, features: [1, 2, 3, 4, 5] },
        { id: "e3", title: "Guidelines Production", position: 3, features: [1, 2] },
      ]
    } as unknown as RoadmapPreview
  },
  {
    id: "temp-8",
    title: "B2B Lead Gen Funnel",
    category: "Growth Marketing",
    milestones: "4 Milestones",
    budget: "$5k - $9k",
    tag: "Essentials",
    author: {
      name: "James Wilson",
      role: "Growth Marketer",
      avatar: "https://i.pravatar.cc/150?u=james",
    },
    preview: {
      id: "mock-8",
      name: "B2B Lead Gen Funnel",
      description: "Automated inbound marketing funnel for B2B services.",
      status: "published",
      epics: [
        { id: "e1", title: "Landing Page Optimization", position: 1, features: [1, 2] },
        { id: "e2", title: "Lead Magnet Creation", position: 2, features: [1, 2, 3] },
        { id: "e3", title: "CRM Automation", position: 3, features: [1, 2] },
        { id: "e4", title: "Reporting Dashboard", position: 4, features: [1, 2, 3] },
      ]
    } as unknown as RoadmapPreview
  },
  {
    id: "temp-9",
    title: "Security Compliance Audit",
    category: "Cybersecurity",
    milestones: "3 Milestones",
    budget: "$20k - $30k",
    tag: "Enterprise",
    author: {
      name: "Sophia Patel",
      role: "CISO",
      avatar: "https://i.pravatar.cc/150?u=sophia",
    },
    preview: {
      id: "mock-9",
      name: "Security Compliance Audit",
      description: "SOC2 and ISO27001 readiness assessment roadmap.",
      status: "published",
      epics: [
        { id: "e1", title: "Gap Analysis", position: 1, features: [1, 2, 3, 4] },
        { id: "e2", title: "Policy Remediation", position: 2, features: [1, 2, 3] },
        { id: "e3", title: "Penetration Testing", position: 3, features: [1, 2] },
      ]
    } as unknown as RoadmapPreview
  },
  {
    id: "temp-10",
    title: "SEO Migration Strategy",
    category: "SEO & Content",
    milestones: "3 Milestones",
    budget: "$6k - $10k",
    tag: "Trending",
    author: {
      name: "Daniel Lee",
      role: "SEO Specialist",
      avatar: "https://i.pravatar.cc/150?u=daniel",
    },
    preview: {
      id: "mock-10",
      name: "SEO Migration Strategy",
      description: "Risk-free organic traffic migration for platform changes.",
      status: "published",
      epics: [
        { id: "e1", title: "Pre-migration Audit", position: 1, features: [1, 2, 3] },
        { id: "e2", title: "301 Redirect Mapping", position: 2, features: [1, 2, 3, 4] },
        { id: "e3", title: "Post-launch Monitoring", position: 3, features: [1, 2] },
      ]
    } as unknown as RoadmapPreview
  },
  {
    id: "temp-11",
    title: "React Native App Prep",
    category: "Mobile App",
    milestones: "5 Milestones",
    budget: "$25k - $35k",
    tag: "Pro",
    author: {
      name: "Aisha Taylor",
      role: "Cross-platform Dev",
      avatar: "https://i.pravatar.cc/150?u=aisha",
    },
    preview: {
      id: "mock-11",
      name: "React Native App Prep",
      description: "Architecture and setup for a cross-platform mobile app.",
      status: "published",
      epics: [
        { id: "e1", title: "Project Initialization", position: 1, features: [1, 2] },
        { id: "e2", title: "Navigation Setup", position: 2, features: [1, 2, 3] },
        { id: "e3", title: "State Management", position: 3, features: [1, 2, 3, 4] },
        { id: "e4", title: "UI Component Library", position: 4, features: [1, 2, 3] },
      ]
    } as unknown as RoadmapPreview
  },
  {
    id: "temp-12",
    title: "Data Warehouse Setup",
    category: "Data Engineering",
    milestones: "4 Milestones",
    budget: "$35k - $50k",
    tag: "Enterprise",
    author: {
      name: "Vikram Singh",
      role: "Data Architect",
      avatar: "https://i.pravatar.cc/150?u=vikram",
    },
    preview: {
      id: "mock-12",
      name: "Data Warehouse Setup",
      description: "Cloud data warehouse implementation using Snowflake/dbt.",
      status: "published",
      epics: [
        { id: "e1", title: "Infrastructure as Code", position: 1, features: [1, 2, 3] },
        { id: "e2", title: "ELT Pipeline Design", position: 2, features: [1, 2, 3, 4] },
        { id: "e3", title: "dbt Model Architecture", position: 3, features: [1, 2] },
        { id: "e4", title: "BI Tool Integration", position: 4, features: [1, 2, 3] },
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
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {mockProfessionalTemplates.map((template) => (
            <div
              key={template.id}
              className="group relative bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:border-[#c68c53] hover:shadow-xl transition-all block cursor-pointer"
            >
              <div className="aspect-4/3 overflow-hidden bg-linear-to-br from-[#f0f7f9] to-[#ffffff] p-2 relative">
                <EpicOverview preview={template.preview} />
                
                {/* Consultant Badge Overlay */}
                <div className="absolute bottom-2 left-2 right-2 bg-white/95 backdrop-blur-sm rounded-lg p-1.5 flex items-center gap-2 shadow-sm border border-gray-100">
                  <img src={template.author.avatar} alt={template.author.name} className="w-5 h-5 rounded-full object-cover shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold text-gray-900 truncate leading-none">{template.author.name}</p>
                    <p className="text-[8px] text-gray-500 truncate leading-tight mt-0.5">{template.author.role}</p>
                  </div>
                </div>
              </div>
              <div className="p-3 pt-4">
                <div className="flex items-center justify-between mb-1.5 gap-2">
                  <h3 className="font-semibold text-gray-900 text-xs truncate">
                    {template.title}
                  </h3>
                  <span className="px-1.5 py-0.5 bg-[#0f4c5c] text-white text-[9px] font-semibold rounded-full shrink-0">
                    {template.tag}
                  </span>
                </div>
                <p className="text-[10px] text-gray-600 mb-2 truncate">
                  {template.category}
                </p>
                <div className="flex items-center justify-between text-[10px] text-gray-500">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    {template.milestones}
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-2.5 h-2.5" />
                    {template.budget}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {templates.map((template) => (
              <Link
                key={template.id}
                to="/project/$projectId/roadmap/$roadmapId"
                params={{ projectId: template.preview.project_id || "n", roadmapId: template.id }}
                className="group relative bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:border-primary hover:shadow-xl transition-all block"
              >
                <div className="aspect-4/3 overflow-hidden bg-linear-to-br from-blue-50 to-indigo-50 p-2">
                  <EpicOverview preview={template.preview} />
                </div>
                <div className="p-3">
                  <div className="flex items-center justify-between mb-1.5 gap-2">
                    <h3 className="font-semibold text-gray-900 text-xs truncate">
                      {template.title}
                    </h3>
                    <span className="px-1.5 py-0.5 bg-primary text-white text-[9px] font-semibold rounded-full shrink-0">
                      {template.tag}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-600 mb-2 truncate">
                    {template.category}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-gray-500">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      {template.milestones}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-2.5 h-2.5" />
                      {template.budget}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

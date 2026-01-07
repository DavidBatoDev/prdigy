import { CheckCircle2, DollarSign } from "lucide-react";

interface Template {
  title: string;
  category: string;
  milestones: string;
  budget: string;
  image: string;
  tag: string;
}

const templates: Template[] = [
  {
    title: "E-commerce Platform",
    category: "Online Store · 8-12 weeks",
    milestones: "15 milestones",
    budget: "$15k - $25k",
    image:
      "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=300&fit=crop",
    tag: "Popular",
  },
  {
    title: "SaaS Dashboard",
    category: "Web Application · 10-14 weeks",
    milestones: "18 milestones",
    budget: "$20k - $35k",
    image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop",
    tag: "Featured",
  },
  {
    title: "Mobile Banking App",
    category: "Fintech · 12-16 weeks",
    milestones: "22 milestones",
    budget: "$30k - $50k",
    image:
      "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400&h=300&fit=crop",
    tag: "New",
  },
  {
    title: "Booking Platform",
    category: "Marketplace · 10-12 weeks",
    milestones: "16 milestones",
    budget: "$18k - $30k",
    image:
      "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=400&h=300&fit=crop",
    tag: "Trending",
  },
];

export const TemplatesSection = () => {
  return (
    <div className="mt-24">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          Example Project Roadmaps
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          See real examples of AI-generated roadmaps with timelines, milestones,
          and budget estimates
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {templates.map((template) => (
          <div
            key={template.title}
            className="group relative bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:border-primary hover:shadow-xl transition-all cursor-pointer"
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
              <p className="text-sm text-gray-600 mb-3">{template.category}</p>
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
  );
};

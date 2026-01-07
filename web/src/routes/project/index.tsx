import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Header } from "@/components/root/Header";
import { RootFooter } from "@/components/root/RootFooter";
import { Button } from "@/ui/button";
import { Upload } from "lucide-react";

export const Route = createFileRoute("/project/")({
  component: ProjectPage,
});

type ProjectForm = {
  title: string;
  summary: string;
  category: string;
  budget: string;
  timeline: string;
  attachment: File | null;
};

function ProjectPage() {
  const [form, setForm] = useState<ProjectForm>({
    title: "",
    summary: "",
    category: "",
    budget: "",
    timeline: "",
    attachment: null,
  });

  const updateField = <K extends keyof ProjectForm>(key: K, value: ProjectForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    updateField("attachment", file);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // TODO: Connect to API
    console.log("Submitting project", form);
  };

  return (
    <div className="min-h-screen bg-[#f6f7f8]">
      <Header />

      <main className="pt-28 pb-20">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-sm p-10">
            <div className="mb-10">
              <p className="text-sm font-semibold text-primary mb-2">Project Intake</p>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Share your project in one step</h1>
              <p className="text-gray-600 text-lg">
                Capture the essentials and get matched to a consultant-led team. No multi-step wizard—just a focused brief.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Project title</label>
                  <input
                    value={form.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g., Launch a B2B SaaS MVP for procurement"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => updateField("category", e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">Select a category</option>
                    <option value="saas">SaaS / Platforms</option>
                    <option value="mobile">Mobile Apps</option>
                    <option value="ecommerce">E-commerce</option>
                    <option value="ai">AI / Data</option>
                    <option value="fintech">Fintech</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">What do you want to build?</label>
                <textarea
                  value={form.summary}
                  onChange={(e) => updateField("summary", e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 h-32 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Describe the problem, users, success criteria, and any constraints."
                  required
                />
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Budget range</label>
                  <select
                    value={form.budget}
                    onChange={(e) => updateField("budget", e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">Select budget</option>
                    <option value="<10k">Under $10k</option>
                    <option value="10-25k">$10k - $25k</option>
                    <option value="25-50k">$25k - $50k</option>
                    <option value="50-100k">$50k - $100k</option>
                    <option value=">100k">Above $100k</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Timeline preference</label>
                  <select
                    value={form.timeline}
                    onChange={(e) => updateField("timeline", e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">Select timeline</option>
                    <option value="asap">ASAP</option>
                    <option value="0-3">0 - 3 months</option>
                    <option value="3-6">3 - 6 months</option>
                    <option value="6-12">6 - 12 months</option>
                    <option value=">12">12+ months</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Attach brief (optional)</label>
                  <label className="w-full h-[52px] flex items-center justify-between px-4 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary/60 transition-colors">
                    <span className="text-gray-600 text-sm truncate">
                      {form.attachment ? form.attachment.name : "Upload PDF, DOCX, or ZIP"}
                    </span>
                    <Upload className="w-5 h-5 text-gray-500" />
                    <input type="file" accept=".pdf,.doc,.docx,.zip" className="hidden" onChange={handleFile} />
                  </label>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 pt-4">
                <Button type="submit" variant="contained" colorScheme="primary" className="px-6 py-3 text-base">
                  Submit Project
                </Button>
                <Button type="button" variant="outlined" colorScheme="primary" className="px-6 py-3 text-base" onClick={() => setForm({
                  title: "",
                  summary: "",
                  category: "",
                  budget: "",
                  timeline: "",
                  attachment: null,
                })}>
                  Clear Form
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>

      <RootFooter />
    </div>
  );
}

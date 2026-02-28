import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/root/Header";
import { HeroSection } from "@/components/root/HeroSection";
import { ProjectTypes } from "@/components/root/ProjectTypes";
import { TemplatesSection } from "@/components/root/TemplatesSection";
import { CTASection } from "@/components/root/CTASection";
import { RootFooter } from "@/components/root/RootFooter";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="pt-20 pb-20">
        <div className="container mx-auto px-6 lg:px-12">
          <HeroSection />
          {/* <ProjectTypes /> */}
          <TemplatesSection />
          <CTASection />
        </div>
      </main>

      <RootFooter />
    </div>
  );
}

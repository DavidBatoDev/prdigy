import { createFileRoute } from "@tanstack/react-router";
import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import About from "@/components/landing/About";
import Stats from "@/components/landing/Stats";
import Services from "@/components/landing/Services";
import References from "@/components/landing/References";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  return (
    <div className="text-center">
      <Header />
      <Hero />
      <About />
      <Stats />
      <Services />
      <References />
      <CTA />
      <Footer />
    </div>
  );
}

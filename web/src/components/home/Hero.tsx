import { ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/authStore";

export function Hero() {
  const { profile } = useAuthStore();
  const persona = profile?.active_persona || "client";
  const isLoading = !profile;

  // Design configuration mapping
  const content = {
    client: {
      title: "Turn your vision into reality.",
      description:
        "Don't let your idea stay on a napkin. Match with an expert Consultant today to architect your roadmap.",
      buttonText: "Post a Project Vision",
      buttonLink: "/client/project-posting",
      dataTutorial: "post-project-btn",
      // Design tokens
      bgColor: "#FFEBD6", // Peach
      waveColor: "#FF85A3", // Pink
      blobColors: ["#ff993326", "#fdba74", "#fbcfe8"], // Orange/Pink variants
      buttonBg: "#e72074",
      buttonHoverBg: "#d01a67",
      artSrc: "/svgs/art/9@2x.svg",
    },
    freelancer: {
      title: "Propose your skills to expert Consultants.",
      description:
        " showcase your expertise and join high-impact projects led by verified Consultants.",
      buttonText: "Find Consultants",
      buttonLink: "/browse-consultants",
      dataTutorial: "browse-consultants-btn",
      // Design tokens
      bgColor: "#E0F2FE", // Light Blue
      waveColor: "#38BDF8", // Sky Blue
      blobColors: ["#0ea5e926", "#7dd3fc", "#c7d2fe"], // Sky/Indigo variants
      buttonBg: "#0284C7", // Sky 600
      buttonHoverBg: "#0369a1", // Sky 700
      artSrc: "/svgs/art/9@2x.svg", // We can use the same art or a placeholder if a specific one isn't available
    },
    consultant: {
      title: "Share your expertise with the world.",
      description:
        "Help clients shape their vision and build successful products with your guidance.",
      buttonText: "Browse Opportunities",
      buttonLink: "/projects",
      dataTutorial: "browse-opportunities-btn",
      // Design tokens
      bgColor: "#DCFCE7", // Light Green
      waveColor: "#4ADE80", // Green
      blobColors: ["#22c55e26", "#86efac", "#a7f3d0"], // Green/Emerald variants
      buttonBg: "#059669", // Emerald 600
      buttonHoverBg: "#047857", // Emerald 700
      artSrc: "/svgs/art/9@2x.svg",
    },
    admin: {
      title: "Turn your vision into reality.",
      description:
        "Don't let your idea stay on a napkin. Match with an expert Consultant today to architect your roadmap.",
      buttonText: "Post a Project Vision",
      buttonLink: "/client/project-posting",
      dataTutorial: "post-project-btn",
      // Design tokens
      bgColor: "#FFEBD6",
      waveColor: "#FF85A3",
      blobColors: ["#ff993326", "#fdba74", "#fbcfe8"],
      buttonBg: "#e72074",
      buttonHoverBg: "#d01a67",
      artSrc: "/svgs/art/9@2x.svg",
    },
  };

  const currentContent = content[persona as keyof typeof content] || content.client;

  if (isLoading) {
    return (
      <div className="relative bg-[#f6f7f8] rounded-xl overflow-hidden h-[275px] animate-pulse">
        <div className="relative z-10 flex items-center h-full px-12">
          {/* Skeleton Container */}
          <div className="max-w-[583px] w-full">
            {/* Title Skeleton */}
            <div className="h-12 bg-gray-200 rounded-md w-3/4 mb-4" />
            
            {/* Description Skeleton */}
            <div className="space-y-2 mb-8">
              <div className="h-5 bg-gray-200 rounded-md w-full" />
              <div className="h-5 bg-gray-200 rounded-md w-2/3" />
            </div>
            
            {/* Button Skeleton */}
            <div className="h-10 bg-gray-200 rounded-md w-48" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="relative rounded-xl overflow-hidden h-[275px] transition-colors duration-500"
      style={{ backgroundColor: currentContent.bgColor }}
    >
      {/* Right SVG Art */}
      <img
        src={currentContent.artSrc}
        alt="decoration"
        className="absolute right-0 top-0 h-full object-cover opacity-80"
      />

      {/* Decorative wave at bottom */}
      <svg
        className="absolute bottom-0 left-0 w-full h-[120px]"
        viewBox="0 0 1000 200"
        preserveAspectRatio="none"
      >
        <path
          d="M0,90 Q10,80 700,200 T1000,100 L1000,200 L0,200 Z"
          fill={currentContent.waveColor}
          opacity="0.6"
        />
      </svg>
      {/* <svg xmlns="http://www.w3.org/2000/svg" width="883" height="84" viewBox="0 0 883 84" fill="none">
        <path d="M1003.12 96.0718C899.726 126.693 727.115 74.4768 354.482 66.3786C50.7173 66.3786 35.402 45.3647 -59.8132 0.000109838L-182.347 8.06927L-194.094 117.206L1097.71 213.103L1109.46 103.966L1003.12 96.0718Z" fill="#FF85A3"/>
    </svg> */}

      <div className="absolute inset-0 opacity-100">
        <div className="absolute top-[-50px] left-[-194px] w-[883px] h-[275px]">
          {/* Decorative circles */}
          <div
            className="absolute w-[174px] h-[145px] rounded-full blur-3xl opacity-90 transition-colors duration-500"
            style={{ 
              top: "0px", 
              left: "101px",
              backgroundColor: currentContent.blobColors[0] 
            }}
          />
          <div
            className="absolute w-[174px] h-[145px] rounded-full blur-3xl opacity-40 transition-colors duration-500"
            style={{ 
              top: "207px", 
              left: "145px",
              backgroundColor: currentContent.blobColors[1]
            }}
          />
          <div
            className="absolute w-[174px] h-[145px] rounded-full blur-3xl opacity-40 transition-colors duration-500"
            style={{ 
              top: "-31px", 
              right: "0px",
              backgroundColor: currentContent.blobColors[2]
            }}
          />
        </div>
      </div>

      <div className="relative z-10 flex items-center h-full px-12">
        <div className="max-w-[583px]">
          <h1 className="text-[48px] leading-[40px] font-normal text-[#333438] mb-4">
            {currentContent.title}
          </h1>
          <p className="text-[16px] leading-[24px] text-[#61636c] mb-8">
            {currentContent.description}
          </p>
          <Link
            to={currentContent.buttonLink}
            data-tutorial={currentContent.dataTutorial}
            className="text-white px-6 py-2 rounded flex items-center gap-2 shadow-md transition-all w-fit"
            style={{ 
              backgroundColor: currentContent.buttonBg,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = currentContent.buttonHoverBg;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = currentContent.buttonBg;
            }}
          >
            {currentContent.buttonText}
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

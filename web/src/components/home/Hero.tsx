import { ArrowRight } from "lucide-react";

export function Hero() {
  return (
    <div className="relative bg-[#FFEBD6] rounded-xl overflow-hidden h-[275px]">
      {/* Right SVG Art */}
      <img
        src="/svgs/art/9@2x.svg"
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
          fill="#FF85A3"
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
            className="absolute w-[174px] h-[145px] bg-[#ff993326] rounded-full blur-3xl opacity-90"
            style={{ top: "0px", left: "101px" }}
          />
          <div
            className="absolute w-[174px] h-[145px] bg-orange-300 rounded-full blur-3xl opacity-40"
            style={{ top: "207px", left: "145px" }}
          />
          <div
            className="absolute w-[174px] h-[145px] bg-pink-200 rounded-full blur-3xl opacity-40"
            style={{ top: "-31px", right: "0px" }}
          />
        </div>
      </div>

      <div className="relative z-10 flex items-center h-full px-12">
        <div className="max-w-[583px]">
          <h1 className="text-[48px] leading-[40px] font-normal text-[#333438] mb-4">
            Turn your vision into reality.
          </h1>
          <p className="text-[16px] leading-[24px] text-[#61636c] mb-8">
            Don't let your idea stay on a napkin. Match with an expert
            Consultant today to architect your roadmap.
          </p>
          <a 
            href="/client/project-posting"
            className="bg-[#e72074] hover:bg-[#d01a67] text-white px-6 py-2 rounded flex items-center gap-2 shadow-md transition-colors w-fit"
          >
            Post a Project Vision
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </div>
    </div>
  );
}

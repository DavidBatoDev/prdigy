import { Bell, CheckCircle, Star } from "lucide-react";

export function ActivityOverview() {
  return (
    <div className="w-[65%]">
      <h2 className="text-[20px] font-semibold text-[#333438] mb-2">
        Activity Overview
      </h2>
      <div className="grid grid-cols-3 gap-6 h-[280px]">
        <ActivityCard
          icon={<Bell className="w-8 h-8 text-white" />}
          title="Active Projects"
          value="3"
          change="+1"
          changeText="than last month"
        />
        <ActivityCard
          icon={<CheckCircle className="w-8 h-8 text-white" />}
          title="Completed"
          value="5"
          change="+3"
          changeText="than last month"
        />
        <ActivityCard
          icon={<Star className="w-8 h-8 text-white" />}
          title="Success Rate"
          value="98%"
          change="+28"
          changeText="than last month"
        />
      </div>
    </div>
  );
}

function ActivityCard({
  icon,
  title,
  value,
  change,
  changeText,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  change: string;
  changeText: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 text-center relative overflow-hidden h-full flex flex-col justify-center">
      <div className="absolute bottom-0 left-0 right-0 h-[80%] opacity-10">
        <svg
          viewBox="0 0 1080 240"
          className="w-full h-full absolute bottom-0"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop
                offset="0%"
                style={{ stopColor: "#ff9933", stopOpacity: 0 }}
              />
              <stop
                offset="100%"
                style={{ stopColor: "#ff9933", stopOpacity: 1 }}
              />
            </linearGradient>
          </defs>
          <path
            d="M0,120 Q270,180 540,120 T1080,120 L1080,240 L0,240 Z"
            fill="url(#waveGradient)"
          />
        </svg>
      </div>

      <div className="relative z-10 space-y-2">
        <div className="flex justify-center">
          <div className="bg-[#e72074] rounded-lg p-3 flex items-center justify-center">
            {icon}
          </div>
        </div>
        <div>
          <p className="text-[14px] text-black mb-1">{title}</p>
          <p className="text-[48px] leading-[40px] text-black font-normal">
            {value}
          </p>
        </div>
        <div className="bg-white rounded-[10px] px-2 inline-flex items-center gap-1 text-[12px]">
          <span className="text-[#43a047] font-bold">{change}</span>
          <span className="text-[#92969f]">{changeText}</span>
        </div>
      </div>
    </div>
  );
}

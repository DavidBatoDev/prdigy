import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";

export function CalendarWidget() {
  const { profile } = useAuthStore();
  const persona = profile?.active_persona || "client";

  return (
    <div 
      className="bg-white rounded-xl shadow-sm overflow-hidden" 
      data-theme={persona}
    >
      <div 
        className="text-white text-center py-3"
        style={{ backgroundColor: "var(--secondary)" }}
      >
        <h3 className="text-[20px] font-semibold">MY CALENDAR</h3>
      </div>

      <div className="bg-[#f6f7f8] p-8">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-[18px] font-bold text-black">September 2025</h4>
          <div className="flex gap-3">
            <ChevronLeft className="w-6 h-6 cursor-pointer text-black" />
            <ChevronRight className="w-6 h-6 cursor-pointer text-black" />
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-0 text-center text-[18px] mb-4">
          {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
            <div
              key={i}
              className="w-[42px] h-[42px] flex items-center justify-center text-black"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-0 text-center text-[18px]">
          {[31, 1, 2, 3, 4, 5, 6].map((date, i) => (
            <div
              key={i}
              className={`w-[42px] h-[42px] flex items-center justify-center ${
                date === 3 ? "text-white rounded-[5px]" : "text-black"
              } ${date === 31 ? "opacity-40" : ""}`}
              style={date === 3 ? { backgroundColor: "var(--secondary)" } : {}}
            >
              {date}
            </div>
          ))}
        </div>
      </div>

      {/* Agenda */}
      <div className="bg-white p-8 max-h-[219px] overflow-y-auto hide-scrollbar">
        <div className="space-y-4">
          <div>
            <p 
              className="text-[16px] font-semibold mb-3"
              style={{ color: "var(--secondary)" }}
            >
              TODAY, SEPT. 3
            </p>
            <div className="space-y-2 text-[14px]">
              <AgendaItem
                time="10:00 AM"
                title="Weekly Roadmap Update w/ Consultant"
              />
              <AgendaItem
                time="12:00 PM"
                title="Review Wireframes for Mobile App"
              />
              <AgendaItem
                time="04:30 PM"
                title="Action: Fund Escrow for Phase 3"
              />
              <AgendaItem time="05:00 PM" title="Project Beta Launch 🚀" />
            </div>
          </div>

          <div>
            <p 
              className="text-[16px] font-normal"
              style={{ color: "var(--secondary)" }}
            >
              SEPTEMBER 4
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AgendaItem({ time, title }: { time: string; title: string }) {
  return (
    <div className="flex items-center gap-4 py-2 border-b border-gray-200">
      <span className="text-[16px] text-[#333438] w-[70px] flex-shrink-0">
        {time}
      </span>
      <div className="flex items-center gap-3 flex-1">
        <div className="w-[16px] h-[16px] rounded-full bg-gray-300 flex-shrink-0" />
        <span className="text-[14px] text-[#333438]">{title}</span>
      </div>
    </div>
  );
}

import { Calendar, Clock } from "lucide-react";

export function ProjectsGrid() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-[18px] h-[18px] rounded-full bg-[#333438] flex items-center justify-center">
            <div className="w-[8px] h-[8px] rounded-full bg-white" />
          </div>
          <h2 className="text-[20px] font-semibold text-[#333438]">
            MY PROJECTS AS A CLIENT
          </h2>
        </div>
        <button className="text-[20px] font-semibold text-[#333438] hover:text-[#ff9933]">
          View All →
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Add New Project Card */}
        {/* <div className="bg-white rounded-xl shadow-sm h-[385px] flex items-center justify-center hover:bg-gray-50 cursor-pointer transition-colors">
          <Plus className="w-24 h-24 text-gray-300" strokeWidth={1.5} />
        </div> */}

        {/* Project Card 1 */}
        <ProjectCard
          number={1}
          status="On Track"
          statusColor="#4caf50"
          title="Simple Website Build"
          client="Acme Corp"
          progress={30}
          progressColor="#4caf50"
          nextUp="Visual Design"
          dueDate="Sept 3, 2025"
        />

        {/* Project Card 2 */}
        <ProjectCard
          number={2}
          status="Completed"
          statusColor="#03a9f4"
          title="Simple Website Build"
          client="Acme Corp"
          progress={100}
          progressColor="#03a9f4"
          nextUp="All Work Items Completed"
          dueDate={null}
        />

        {/* Project Card 3 */}
        <ProjectCard
          number={3}
          status="Under Review"
          statusColor="#9c27b0"
          title="Simple Website Build"
          client="Acme Corp"
          progress={30}
          progressColor="#9c27b0"
          nextUp="Visual Design"
          dueDate="Sept 3, 2025"
        />

        {/* Project Card 4 */}
        <ProjectCard
          number={4}
          status="Action Needed"
          statusColor="#ff9800"
          title="Simple Website Build"
          client="Acme Corp"
          progress={30}
          progressColor="#ff9800"
          nextUp="Visual Design"
          dueDate="Sept 3, 2025"
        />

        {/* Project Card 5 */}
        <ProjectCard
          number={5}
          status="At Risk/Late"
          statusColor="#f44336"
          title="Simple Website Build"
          client="Acme Corp"
          progress={100}
          progressColor="#f44336"
          nextUp="All Work Items Completed"
          dueDate={null}
        />
      </div>
    </div>
  );
}

function ProjectCard({
  number,
  status,
  statusColor,
  title,
  client,
  progress,
  progressColor,
  nextUp,
  dueDate,
}: {
  number: number;
  status: string;
  statusColor: string;
  title: string;
  client: string;
  progress: number;
  progressColor: string;
  nextUp: string;
  dueDate: string | null;
}) {
  return (
    <div
      className="bg-linear-to-b from-white from-98% to-transparent rounded-xl shadow-sm p-4 h-[385px] flex flex-col"
      style={{
        backgroundImage: `linear-gradient(to bottom, white 98%, ${statusColor}20)`,
      }}
    >
      <div className="flex-1 space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[16px] font-semibold text-[#61636c]">
              #{number}
            </span>
            <div className="w-px h-[25px] bg-[#92969f]" />
            <div className="flex items-center gap-1">
              <div
                className="w-[12px] h-[12px] rounded-full flex items-center justify-center"
                style={{ backgroundColor: statusColor }}
              >
                <div className="w-[6px] h-[6px] rounded-full bg-white" />
              </div>
              <span className="text-[14px] text-[#92969f]">{status}</span>
            </div>
          </div>

          <h3 className="text-[16px] font-bold text-[#333438] mb-1">{title}</h3>
          <p className="text-[14px]">
            <span className="font-semibold text-[#61636c]">Client:</span>
            <span className="text-[#61636c]"> {client}</span>
          </p>
        </div>

        {/* Progress */}
        <div>
          <div className="flex items-center justify-between text-[12px] text-[#92969f] mb-2">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-[8px] bg-[#c4c7cc] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${progress}%`, backgroundColor: progressColor }}
            />
          </div>
        </div>

        {/* Next Up */}
        <div className="flex gap-2">
          <Clock className="w-[18px] h-[18px] text-[#92969f] shrink-0 mt-0.5" />
          <div className="space-y-2">
            <div>
              <p className="text-[14px] font-semibold text-[#61636c]">
                NEXT UP
              </p>
              <p className="text-[14px] text-black">• {nextUp}</p>
            </div>
            {dueDate && (
              <div className="bg-[#f6f7f8] border border-[#92969f] rounded-[5px] px-2 py-0.5 inline-flex items-center gap-1">
                <Calendar className="w-[18px] h-[18px] text-[#92969f]" />
                <span className="text-[12px] text-[#92969f]">{dueDate}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-[#92969f]">
        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            <div className="w-[40px] h-[40px] rounded-full bg-[#bdbdbd] border-2 border-white flex items-center justify-center text-white text-[14px] font-semibold">
              FF
            </div>
            <div className="w-[40px] h-[40px] rounded-full bg-[#bdbdbd] flex items-center justify-center text-white text-[14px] font-semibold">
              +3
            </div>
          </div>
          <button className="text-[14px] font-semibold text-[#333438] hover:text-[#ff9933] uppercase">
            View Project →
          </button>
        </div>
      </div>
    </div>
  );
}

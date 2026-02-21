import { Calendar, Clock, Loader2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { projectService } from "@/services/project.service";

export function ProjectsGrid() {

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectService.list(),
  });

  return (
    <div data-tutorial="projects-grid">
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
        {isLoading ? (
          <div className="col-span-2 flex items-center justify-center h-[385px]">
            <Loader2 className="w-8 h-8 animate-spin text-[#ff9933]" />
          </div>
        ) : projects.length === 0 ? (
          <div className="col-span-2 flex flex-col items-center justify-center h-[385px] bg-white rounded-xl shadow-sm text-center px-6">
            <div className="w-16 h-16 bg-[#ff9933]/10 rounded-full flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 text-[#ff9933]" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-500">Create your first project to get started tracking milestones and tasks.</p>
          </div>
        ) : (
          projects.slice(0, 2).map((project, index) => {
            // Map status to color
            let statusColor = "#9c27b0"; // Default purple
            let displayStatus = "In Progress";
            
            if (project.status === "completed") {
              statusColor = "#03a9f4";
              displayStatus = "Completed";
            } else if (project.status === "active") {
              statusColor = "#4caf50";
              displayStatus = "On Track";
            } else if (project.status === "draft") {
              statusColor = "#f59e0b";
              displayStatus = "Draft";
            }

            return (
              <ProjectCard
                key={project.id}
                number={index + 1}
                projectId={project.id}
                status={displayStatus}
                statusColor={statusColor}
                title={project.title}
                client="Unknown Client" // TODO: Fetch client details
                progress={project.status === "completed" ? 100 : 0} // Default mock data
                progressColor={statusColor}
                nextUp={project.brief ? "Review Brief" : "Create Brief"} // Default mock data
                dueDate={project.custom_start_date || project.start_date || null}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

function ProjectCard({
  number,
  projectId,
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
  projectId: string;
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
          <Link
            to="/project/$projectId/overview"
            params={{ projectId }}
            className="text-[14px] font-semibold text-[#333438] hover:text-[#ff9933] uppercase transition-colors"
          >
            View Project →
          </Link>
        </div>
      </div>
    </div>
  );
}

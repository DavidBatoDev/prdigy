import type { Project } from "@/services/project.service";
import { PersonCard } from "./PersonCard";

export function PrincipalsCard({ project }: { project: Project }) {
  const client = project.client;
  const consultant = project.consultant;

  const clientName =
    client?.display_name || client?.email || "No client assigned";
  const consultantName =
    consultant?.display_name || consultant?.email || "No consultant assigned";

  const samePrincipal =
    !!client &&
    !!consultant &&
    ((Boolean(client.id) &&
      Boolean(consultant.id) &&
      client.id === consultant.id) ||
      (Boolean(client.email) &&
        Boolean(consultant.email) &&
        client.email!.toLowerCase() === consultant.email!.toLowerCase()));

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center gap-2 mb-3.5">
        <span className="w-1 h-4 rounded-full bg-[#ff9933]" />
        <p className="text-[12px] font-bold text-gray-700 tracking-wide">
          Project Principals
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {samePrincipal ? (
          <PersonCard
            name={clientName}
            email={client?.email || consultant?.email}
            avatarUrl={client?.avatar_url || consultant?.avatar_url}
            badge="Client + Consultant"
            badgeClass="bg-gray-100 text-gray-500 border border-gray-200"
          />
        ) : (
          <>
            <PersonCard
              name={clientName}
              email={client?.email}
              avatarUrl={client?.avatar_url}
              badge="Client"
              badgeClass="bg-gray-100 text-gray-500 border border-gray-200"
            />
            <PersonCard
              name={consultantName}
              email={consultant?.email}
              avatarUrl={consultant?.avatar_url}
              badge="Consultant"
              badgeClass="bg-gray-100 text-gray-500 border border-gray-200"
            />
          </>
        )}
      </div>
    </div>
  );
}

export function ActivityFeed() {
  return (
    <div>
      <h3 className="text-[20px] font-semibold text-black mb-3 py-3">
        ACTIVITY
      </h3>
      <div className="bg-white rounded-xl shadow-sm p-6 max-h-[481px] overflow-y-auto hide-scrollbar">
        <div className="space-y-4">
          <div>
            <p className="text-[16px] font-bold text-black mb-3">Today</p>
            <div className="space-y-3">
              <ActivityFeedItem
                project="Project Alpha"
                title="Searching for Consultant"
                subtitle="System is matching them"
              />
              <ActivityFeedItem
                project="SaaS Dashboard"
                title="Roadmap Ready for Review"
                subtitle="Click to approve & fund"
              />
              <ActivityFeedItem
                project="Mobile App"
                title="Team Staffing"
                subtitle="Currently hiring freelancers"
              />
            </div>
          </div>

          <div>
            <p className="text-[16px] font-bold text-black mb-3">This Week</p>
            <div className="space-y-3">
              <ActivityFeedItem
                project="Project Alpha"
                title="Searching for Consultant"
                subtitle="System is matching them"
              />
              <ActivityFeedItem
                project="SaaS Dashboard"
                title="Roadmap Ready for Review"
                subtitle="Click to approve & fund"
              />
              <ActivityFeedItem
                project="Mobile App"
                title="Team Staffing"
                subtitle="Currently hiring freelancers"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivityFeedItem({
  project,
  title,
  subtitle,
}: {
  project: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="bg-[#f6f7f8] rounded-xl shadow-sm p-2 flex items-center gap-4">
      <span className="text-[16px] text-[#333438] min-w-[100px]">
        {project}
      </span>
      <div className="w-px h-[39px] bg-gray-300" />
      <div className="flex-1">
        <p className="text-[14px] text-black">{title}</p>
        <p className="text-[14px] text-[#92969f]">{subtitle}</p>
      </div>
    </div>
  );
}

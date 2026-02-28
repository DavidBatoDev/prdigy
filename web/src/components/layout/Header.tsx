import { useRouterState } from "@tanstack/react-router";
import DashboardHeader from "./DashboardHeader";
import { ProjectHeader } from "../project/ProjectHeader";

const Header = () => {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const validPaths = [
    "/dashboard",
    "/project",
    "/profile",
    "/consultant",
    "/client/project-posting",
  ];

  if (!validPaths.some(path => currentPath.startsWith(path))) {
    return null;
  }

  let content = <DashboardHeader />;

  if (currentPath.startsWith("/project")) {
    content = <ProjectHeader />;
  } else if (currentPath.startsWith("/dashboard")) {
    content = <DashboardHeader />;
  }
  // Any other routes can default to DashboardHeader
  
  return (
    <header 
      className="fixed top-0 left-0 right-0 h-14 bg-white/90 backdrop-blur-sm border-b border-[#EAEAEA] z-50 flex items-center justify-center transition-all duration-300"
    >
      {content}
    </header>
  );
};

export default Header;

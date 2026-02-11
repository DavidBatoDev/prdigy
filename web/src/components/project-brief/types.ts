export type ProjectState = "idea" | "sketches" | "design" | "codebase";

export interface FormData {
  // Step 1
  title: string;
  category: string;
  description: string;
  problemSolving: string;
  projectState: ProjectState;
  
  // Step 2
  skills: string[];
  customSkills: string[];
  duration: string;
}

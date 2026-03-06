import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  timezone: string;
  language: string;
  currency_code: string;
  created_at: string;
}

interface ProjectContextType {
  projects: Project[];
  currentProject: Project | null;
  setCurrentProject: (project: Project) => void;
  loading: boolean;
  refetchProjects: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    if (!user) {
      setProjects([]);
      setCurrentProject(null);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("status", "active")
      .order("name");

    if (!error && data) {
      setProjects(data as Project[]);
      if (!currentProject && data.length > 0) {
        setCurrentProject(data[0] as Project);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProjects();
  }, [user]);

  return (
    <ProjectContext.Provider
      value={{
        projects,
        currentProject,
        setCurrentProject,
        loading,
        refetchProjects: fetchProjects,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProject must be inside ProjectProvider");
  return ctx;
}

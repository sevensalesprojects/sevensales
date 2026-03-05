import { createContext, useContext, ReactNode } from "react";
import { useProject } from "@/contexts/ProjectContext";

export interface Expert {
  id: string;
  name: string;
  initials: string;
  color: string;
}

const projectColors = [
  "hsl(175, 80%, 36%)",
  "hsl(205, 80%, 50%)",
  "hsl(38, 92%, 50%)",
  "hsl(280, 65%, 55%)",
  "hsl(340, 75%, 55%)",
  "hsl(150, 60%, 40%)",
  "hsl(20, 80%, 50%)",
];

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

interface ExpertContextType {
  currentExpert: Expert;
  setCurrentExpert: (expert: Expert) => void;
  experts: Expert[];
}

const ExpertContext = createContext<ExpertContextType | null>(null);

export function ExpertProvider({ children }: { children: ReactNode }) {
  const { projects, currentProject, setCurrentProject } = useProject();

  const experts: Expert[] = projects.map((p, i) => ({
    id: p.id,
    name: p.name,
    initials: getInitials(p.name),
    color: projectColors[i % projectColors.length],
  }));

  const currentExpert: Expert = currentProject
    ? {
        id: currentProject.id,
        name: currentProject.name,
        initials: getInitials(currentProject.name),
        color: projectColors[projects.indexOf(currentProject) % projectColors.length],
      }
    : { id: "", name: "Sem Projeto", initials: "SP", color: projectColors[0] };

  const setCurrentExpert = (expert: Expert) => {
    const project = projects.find((p) => p.id === expert.id);
    if (project) setCurrentProject(project);
  };

  return (
    <ExpertContext.Provider value={{ currentExpert, setCurrentExpert, experts }}>
      {children}
    </ExpertContext.Provider>
  );
}

export function useExpert() {
  const ctx = useContext(ExpertContext);
  if (!ctx) throw new Error("useExpert must be inside ExpertProvider");
  return ctx;
}

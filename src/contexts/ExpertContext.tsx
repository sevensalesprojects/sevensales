import { createContext, useContext, useState, ReactNode } from "react";

export interface Expert {
  id: string;
  name: string;
  initials: string;
  color: string;
}

const experts: Expert[] = [
  { id: "1", name: "Expert Fábio", initials: "EF", color: "hsl(175, 80%, 36%)" },
  { id: "2", name: "Expert Leonardo", initials: "EL", color: "hsl(205, 80%, 50%)" },
  { id: "3", name: "Expert Josias", initials: "EJ", color: "hsl(38, 92%, 50%)" },
  { id: "4", name: "Expert Tiago Leão", initials: "TL", color: "hsl(280, 65%, 55%)" },
  { id: "5", name: "Expert Will", initials: "EW", color: "hsl(340, 75%, 55%)" },
];

interface ExpertContextType {
  currentExpert: Expert;
  setCurrentExpert: (expert: Expert) => void;
  experts: Expert[];
}

const ExpertContext = createContext<ExpertContextType | null>(null);

export function ExpertProvider({ children }: { children: ReactNode }) {
  const [currentExpert, setCurrentExpert] = useState<Expert>(experts[0]);

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

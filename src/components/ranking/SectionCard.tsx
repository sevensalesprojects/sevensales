import React from "react";

export function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-lg">
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border">
        {icon}
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <div className="p-0">{children}</div>
    </div>
  );
}

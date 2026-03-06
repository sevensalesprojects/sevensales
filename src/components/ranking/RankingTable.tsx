import React from "react";

export function RankingTable({ columns, data }: { columns: { key: string; label: string; icon?: React.ReactNode }[]; data: Record<string, any>[] }) {
  if (data.length === 0) {
    return <div className="text-center py-12 text-muted-foreground text-sm">Sem dados para o período selecionado</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            {columns.map(col => (
              <th key={col.key} className="text-left py-3 px-4 font-medium text-muted-foreground whitespace-nowrap">
                <span className="flex items-center gap-1.5">{col.icon}{col.label}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
              {columns.map(col => (
                <td key={col.key} className="py-3 px-4 whitespace-nowrap">
                  {col.key === "position" ? (
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${i === 0 ? "bg-yellow-100 text-yellow-700" : i === 1 ? "bg-gray-100 text-gray-600" : i === 2 ? "bg-orange-100 text-orange-600" : "bg-muted text-muted-foreground"}`}>
                      {i + 1}
                    </span>
                  ) : (
                    <span className={i === 0 ? "font-semibold text-foreground" : "text-foreground"}>{row[col.key]}</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

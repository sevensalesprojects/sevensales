import {
  LayoutDashboard,
  Users,
  Kanban,
  MessageSquare,
  Plug,
  Settings,
  UserCog,
  FolderKanban,
  ChevronDown,
  Search,
  Bell,
  Handshake,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useExpert } from "@/contexts/ExpertContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Leads", url: "/leads", icon: Users },
  { title: "Conversas", url: "/conversations", icon: MessageSquare },
  { title: "Funis", url: "/funnels", icon: Kanban },
  { title: "SDRs", url: "/sdrs", icon: UserCog },
  { title: "Closers", url: "/closers", icon: Handshake },
  { title: "Integrações", url: "/integrations", icon: Plug },
  { title: "Usuários", url: "/users", icon: FolderKanban },
  { title: "Configurações", url: "/settings", icon: Settings },
];

export function CRMSidebar() {
  const { currentExpert, setCurrentExpert, experts } = useExpert();

  return (
    <aside className="w-60 shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="h-14 flex items-center px-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-xs font-bold">V</span>
          </div>
          <span className="text-sidebar-accent-foreground font-semibold text-sm tracking-tight">VendaFlow</span>
        </div>
      </div>

      {/* Expert Selector */}
      <div className="px-3 py-3 border-b border-sidebar-border">
        <DropdownMenu>
          <DropdownMenuTrigger className="w-full flex items-center gap-2.5 px-2 py-2 rounded-md hover:bg-sidebar-accent transition-colors text-left">
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold shrink-0"
              style={{ backgroundColor: currentExpert.color, color: '#fff' }}
            >
              {currentExpert.initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-sidebar-accent-foreground truncate">{currentExpert.name}</p>
              <p className="text-[10px] text-sidebar-foreground">Projeto ativo</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-sidebar-foreground shrink-0" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            {experts.map((expert) => (
              <DropdownMenuItem key={expert.id} onClick={() => setCurrentExpert(expert)}>
                <div
                  className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold mr-2"
                  style={{ backgroundColor: expert.color, color: '#fff' }}
                >
                  {expert.initials}
                </div>
                {expert.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            end={item.url === "/"}
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
          >
            <item.icon className="w-4 h-4 shrink-0" />
            <span>{item.title}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-3 border-t border-sidebar-border">
        <div className="flex items-center gap-2.5 px-2.5">
          <div className="w-7 h-7 rounded-full bg-sidebar-accent flex items-center justify-center">
            <span className="text-[10px] font-medium text-sidebar-accent-foreground">AD</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-sidebar-accent-foreground truncate">Admin</p>
            <p className="text-[10px] text-sidebar-foreground">admin@vendaflow.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function TopBar() {
  return (
    <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar leads, conversas..."
            className="h-9 w-64 rounded-md border border-input bg-muted/50 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button className="w-9 h-9 rounded-md flex items-center justify-center hover:bg-muted transition-colors relative">
          <Bell className="w-4 h-4 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
        </button>
      </div>
    </header>
  );
}

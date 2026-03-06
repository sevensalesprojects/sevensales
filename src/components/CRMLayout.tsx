import { useState } from "react";
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
  LogOut,
  Menu,
  X,
  ClipboardList,
  Trophy,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useProject } from "@/contexts/ProjectContext";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useLocation } from "react-router-dom";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Leads", url: "/leads", icon: Users },
  { title: "Conversas", url: "/conversations", icon: MessageSquare },
  { title: "Funis", url: "/funnels", icon: Kanban },
  { title: "SDRs", url: "/sdrs", icon: UserCog },
  { title: "Closers", url: "/closers", icon: Handshake },
  { title: "Ranking", url: "/ranking", icon: Trophy },
  { title: "Onboarding", url: "/onboarding", icon: ClipboardList },
  { title: "Integrações", url: "/integrations", icon: Plug },
  { title: "Usuários", url: "/users", icon: FolderKanban },
  { title: "Configurações", url: "/settings", icon: Settings },
];

const bottomNavItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Leads", url: "/leads", icon: Users },
  { title: "Conversas", url: "/conversations", icon: MessageSquare },
  { title: "Funis", url: "/funnels", icon: Kanban },
  { title: "Mais", url: "__more__", icon: Menu },
];

const projectColors = [
  "hsl(175, 80%, 36%)",
  "hsl(205, 80%, 50%)",
  "hsl(38, 92%, 50%)",
  "hsl(280, 65%, 55%)",
  "hsl(340, 75%, 55%)",
  "hsl(150, 60%, 40%)",
  "hsl(20, 80%, 50%)",
];

function getProjectInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

function getProjectColor(index: number) {
  return projectColors[index % projectColors.length];
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { projects, currentProject, setCurrentProject } = useProject();
  const { profile, signOut, roles } = useAuth();

  const roleLabel = roles.includes("admin_master")
    ? "Admin Master"
    : roles.includes("admin")
    ? "Admin"
    : roles.includes("sdr")
    ? "SDR"
    : roles.includes("closer")
    ? "Closer"
    : "Usuário";

  return (
    <>
      {/* Logo */}
      <div className="h-14 flex items-center px-5 border-b border-sidebar-border justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-xs font-bold">V</span>
          </div>
          <span className="text-sidebar-accent-foreground font-semibold text-sm tracking-tight">VendaFlow</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-sidebar-accent">
            <X className="w-5 h-5 text-sidebar-foreground" />
          </button>
        )}
      </div>

      {/* Project Selector */}
      <div className="px-3 py-3 border-b border-sidebar-border">
        <DropdownMenu>
          <DropdownMenuTrigger className="w-full flex items-center gap-2.5 px-2 py-2 rounded-md hover:bg-sidebar-accent transition-colors text-left">
            {currentProject ? (
              <>
                <div
                  className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ backgroundColor: getProjectColor(projects.indexOf(currentProject)), color: '#fff' }}
                >
                  {getProjectInitials(currentProject.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-sidebar-accent-foreground truncate">{currentProject.name}</p>
                  <p className="text-[10px] text-sidebar-foreground">Projeto ativo</p>
                </div>
              </>
            ) : (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-sidebar-accent-foreground">Nenhum projeto</p>
                <p className="text-[10px] text-sidebar-foreground">Crie um projeto</p>
              </div>
            )}
            <ChevronDown className="w-3.5 h-3.5 text-sidebar-foreground shrink-0" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            {projects.length === 0 && (
              <DropdownMenuItem disabled>Nenhum projeto disponível</DropdownMenuItem>
            )}
            {projects.map((project, i) => (
              <DropdownMenuItem key={project.id} onClick={() => { setCurrentProject(project); onClose?.(); }}>
                <div
                  className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold mr-2"
                  style={{ backgroundColor: getProjectColor(i), color: '#fff' }}
                >
                  {getProjectInitials(project.name)}
                </div>
                {project.name}
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
            onClick={onClose}
          >
            <item.icon className="w-4 h-4 shrink-0" />
            <span>{item.title}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom - User */}
      <div className="px-3 py-3 border-t border-sidebar-border">
        <DropdownMenu>
          <DropdownMenuTrigger className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md hover:bg-sidebar-accent transition-colors">
            <div className="w-7 h-7 rounded-full bg-sidebar-accent flex items-center justify-center">
              <span className="text-[10px] font-medium text-sidebar-accent-foreground">
                {profile?.full_name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-medium text-sidebar-accent-foreground truncate">
                {profile?.full_name || "Usuário"}
              </p>
              <p className="text-[10px] text-sidebar-foreground">{roleLabel}</p>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem disabled className="text-xs text-muted-foreground">
              {profile?.email}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}

export function CRMSidebar() {
  const isMobile = useIsMobile();

  if (isMobile) return null;

  return (
    <aside className="w-60 shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col h-screen sticky top-0">
      <SidebarContent />
    </aside>
  );
}

export function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-foreground/40 z-50" onClick={onClose} />
      <aside className="fixed left-0 top-0 bottom-0 w-72 bg-sidebar z-50 flex flex-col animate-slide-in-left">
        <SidebarContent onClose={onClose} />
      </aside>
    </>
  );
}

export function BottomNav() {
  const isMobile = useIsMobile();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (!isMobile) return null;

  return (
    <>
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border flex items-center justify-around h-14 safe-area-bottom">
        {bottomNavItems.map((item) => {
          if (item.url === "__more__") {
            return (
              <button
                key="more"
                onClick={() => setDrawerOpen(true)}
                className="flex flex-col items-center gap-0.5 px-2 py-1 text-muted-foreground"
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px]">{item.title}</span>
              </button>
            );
          }
          const isActive = item.url === "/" ? location.pathname === "/" : location.pathname.startsWith(item.url);
          return (
            <NavLink
              key={item.url}
              to={item.url}
              end={item.url === "/"}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`}
              activeClassName=""
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.title}</span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
}

export function TopBar() {
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { currentProject } = useProject();

  return (
    <>
      {isMobile && <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />}
      <header className="h-14 border-b border-border flex items-center justify-between px-4 md:px-6 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
          {isMobile && (
            <button onClick={() => setDrawerOpen(true)} className="w-9 h-9 rounded-md flex items-center justify-center hover:bg-muted transition-colors mr-1">
              <Menu className="w-5 h-5 text-foreground" />
            </button>
          )}
          {isMobile ? (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
                <span className="text-primary-foreground text-[10px] font-bold">V</span>
              </div>
              <span className="text-sm font-semibold text-foreground truncate max-w-[140px]">
                {currentProject?.name || "VendaFlow"}
              </span>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar leads, conversas..."
                className="h-9 w-64 rounded-md border border-input bg-muted/50 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isMobile && (
            <button className="w-9 h-9 rounded-md flex items-center justify-center hover:bg-muted transition-colors">
              <Search className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
          <button className="w-9 h-9 rounded-md flex items-center justify-center hover:bg-muted transition-colors relative">
            <Bell className="w-4 h-4 text-muted-foreground" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
          </button>
        </div>
      </header>
    </>
  );
}

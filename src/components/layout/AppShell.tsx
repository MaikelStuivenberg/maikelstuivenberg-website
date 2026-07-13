import { NavLink, Outlet } from "react-router-dom";
import { navItems } from "@/components/layout/nav-items";
import { cn } from "@/lib/utils";

export function AppShell() {
  return (
    <div className="min-h-screen">
      <header className="px-4 pt-8 text-center sm:px-8">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
          Maikelstuivenberg.nl
        </h1>
        <nav className="mt-6 flex flex-wrap justify-center gap-2" aria-label="Main">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "rounded-md px-4 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent text-white no-underline"
                    : "text-foreground no-underline hover:bg-accent/10",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto mt-6 max-w-[1000px] border-t-2 border-accent-muted px-5 py-8 sm:px-20">
        <Outlet />
      </main>
    </div>
  );
}

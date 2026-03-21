import { Link, useLocation } from "react-router-dom";
import { navLinks } from "../data/nav-data";
import { cn } from "../lib/utils";


export default function NavBar() {
  const location = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex h-16 md:h-20 items-center justify-between border-b bg-background/80 px-6 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
          FA
        </div>
        <span className="text-xl font-bold tracking-tight">FeedbackApp</span>
      </div>

      <div className="hidden md:flex items-center gap-6">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.href;
          
          return (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {link.title}
            </Link>
          );
        })}
      </div>

      {/* Mobile Nav Toggle could go here */}
      <div className="md:hidden">
        {/* Placeholder for mobile menu button */}
      </div>
    </nav>
  );
}

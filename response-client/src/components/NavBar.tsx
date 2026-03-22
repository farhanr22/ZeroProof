import { Link, useLocation } from "react-router-dom";
import { navLinks } from "../data/nav-data";
import { cn } from "../lib/utils";
import { Github } from "lucide-react";

export default function NavBar() {
  const location = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex h-16 md:h-20 items-center justify-between border-b bg-background/80 px-6 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <span className="text-xl font-bold tracking-tight">ZeroProof</span>
      </div>

      <div className="flex items-center gap-6">
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

        <a 
          href="https://github.com/farhanr22/ZeroProof/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center justify-center rounded-md p-2 text-black transition-colors hover:bg-accent hover:text-accent-foreground"
          title="View on GitHub"
        >
          <Github className="h-5 w-5" />
          <span className="sr-only">GitHub</span>
        </a>

        {/* Mobile Nav Toggle could go here */}
        <div className="md:hidden">
          {/* Placeholder for mobile menu button */}
        </div>
      </div>
    </nav>
  );
}

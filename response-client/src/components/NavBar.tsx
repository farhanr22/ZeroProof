import { Link } from "react-router-dom";
import { Github } from "lucide-react";
import logo from "../assets/logo.svg";

export default function NavBar() {
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex h-[55px] sm:h-[65px] items-center justify-between border-b"
      style={{ backgroundColor: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(12px)', borderColor: '#E2E8F0' }}
    >
      <div className="flex items-center justify-between w-full px-4 md:px-6 ">

        <Link to="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
          <img src={logo} alt="ZeroProof Logo" className="w-8 h-8" />
          <span
            className="font-bold text-[1.25rem] md:text-[1.5rem]"
            style={{ fontFamily: '"IBM Plex Mono", monospace', color: '#3B82F6', letterSpacing: '-0.02em', lineHeight: 1 }}
          >
            {/* make the client text even lighter */}
            ZeroProof <span className="text-slate-400" >Client</span>
          </span>
        </Link>

        <div className="flex items-center h-full">
          <a
            href="https://github.com/farhanr22/ZeroProof/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center p-2 text-[#0F172A] opacity-70 transition-opacity hover:opacity-100"
            title="View on GitHub"
          >
            <Github className="h-5 w-5 md:h-6 md:w-6" />
            <span className="sr-only">GitHub</span>
          </a>
        </div>

      </div>
    </nav>
  );
}

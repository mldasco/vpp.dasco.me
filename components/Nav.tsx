"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/",        label: "Dashboard" },
  { href: "/history", label: "History"   },
  { href: "/config",  label: "Config"    },
  { href: "/status",  label: "Status"    },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <nav className="border-b border-white/10 bg-[#0d1117]/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex items-center h-14 gap-4 overflow-x-auto scrollbar-none">
        <span className="font-semibold text-emerald-400 tracking-tight whitespace-nowrap shrink-0">
          ⚡ VPP · Dasco.me
        </span>
        <div className="flex gap-1 shrink-0">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-3 py-1.5 rounded text-sm transition-colors whitespace-nowrap ${
                pathname === href
                  ? "bg-white/10 text-white"
                  : "text-white/50 hover:text-white hover:bg-white/5"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2 shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-white/40 hidden sm:inline">DEMO MODE</span>
        </div>
      </div>
    </nav>
  );
}

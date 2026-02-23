import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { BrainCircuit, PlusCircle } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", icon: BrainCircuit, label: "Review" },
    { href: "/upload", icon: PlusCircle, label: "Add Notes" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      {/* Header */}
      <header className="sticky top-0 z-10 w-full glass-panel border-b border-border/40 px-6 py-4 flex justify-center items-center">
        <h1 className="text-xl font-bold font-display tracking-tight text-primary">
          Spaced<span className="text-muted-foreground/60 font-light">Rep</span>
        </h1>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 py-8 pb-32 flex flex-col">
        <motion.div
          key={location}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="flex-1 flex flex-col"
        >
          {children}
        </motion.div>
      </main>

      {/* Bottom Navigation for PWA / Mobile-first feel */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 glass-panel pb-safe">
        <div className="flex justify-around items-center h-16 max-w-md mx-auto px-6">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center justify-center w-16 h-12 rounded-xl active-press",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className={cn("w-6 h-6", isActive && "stroke-[2.5px]")} />
                <span className="text-[10px] font-medium mt-1">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -top-3 w-1 h-1 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

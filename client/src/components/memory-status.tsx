import { useMemoryStatus } from "@/hooks/use-questions";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export function MemoryStatus() {
  const { data: status, isLoading } = useMemoryStatus();

  if (isLoading) {
    return (
      <div className="h-12 w-full max-w-sm mx-auto flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!status) return null;

  const total = status.safe + status.unstable;
  const safePercentage = total === 0 ? 100 : (status.safe / total) * 100;
  
  return (
    <div className="w-full max-w-sm mx-auto flex flex-col space-y-3">
      <div className="flex justify-between items-end px-1">
        <div className="flex flex-col">
          <span className="text-3xl font-display font-bold text-foreground tracking-tight">
            {Math.round(safePercentage)}%
          </span>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Memory Retention
          </span>
        </div>
        <div className="text-right flex flex-col">
          <span className="text-sm font-medium text-foreground">
            {total} Concepts
          </span>
          <span className="text-xs text-muted-foreground">
            <span className="text-[#e25d36] font-semibold">{status.unstable}</span> at risk
          </span>
        </div>
      </div>

      <div className="h-3 w-full bg-secondary rounded-full overflow-hidden flex">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${safePercentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full bg-[#1db954] rounded-r-full"
        />
        {total > 0 && status.unstable > 0 && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${100 - safePercentage}%` }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
            className="h-full bg-[#e25d36]"
          />
        )}
      </div>
    </div>
  );
}

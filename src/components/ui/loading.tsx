
import { cn } from "@/lib/utils";

interface LoadingProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Loading({ className, size = "md" }: LoadingProps) {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-6 h-6 border-2",
    lg: "w-8 h-8 border-3"
  };

  return (
    <div className="flex justify-center items-center">
      <div 
        className={cn(
          "border-t-primary animate-spin rounded-full",
          sizeClasses[size],
          className
        )}
      />
    </div>
  );
}

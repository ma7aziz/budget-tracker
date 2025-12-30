import { ReactNode } from "react";

export interface ProgressBarProps {
  current: number;
  max: number;
  label?: string;
  showPercentage?: boolean;
  variant?: "default" | "warning" | "danger";
  className?: string;
}

export function ProgressBar({
  current,
  max,
  label,
  showPercentage = true,
  variant = "default",
  className = "",
}: ProgressBarProps) {
  const percentage = max > 0 ? Math.min((current / max) * 100, 100) : 0;
  
  const colorClasses = {
    default: "bg-primary-600",
    warning: "bg-yellow-500",
    danger: "bg-red-600",
  };
  
  const bgColorClasses = {
    default: "bg-primary-100",
    warning: "bg-yellow-100",
    danger: "bg-red-100",
  };
  
  return (
    <div className={`w-full ${className}`}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between mb-1 text-sm">
          {label && <span className="font-medium text-gray-700">{label}</span>}
          {showPercentage && (
            <span className="text-gray-600">{percentage.toFixed(0)}%</span>
          )}
        </div>
      )}
      <div className={`w-full h-2 rounded-full overflow-hidden ${bgColorClasses[variant]}`}>
        <div
          className={`h-full transition-all duration-300 ${colorClasses[variant]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

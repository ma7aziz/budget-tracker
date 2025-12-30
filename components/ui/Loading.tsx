export function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };
  
  return (
    <div className="flex items-center justify-center">
      <div
        className={`${sizeClasses[size]} border-4 border-gray-200 border-t-primary-600 rounded-full animate-spin`}
      />
    </div>
  );
}

export function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <LoadingSpinner size="lg" />
      <p className="text-gray-600">Loading...</p>
    </div>
  );
}

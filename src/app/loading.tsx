import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center">
      <div className="relative flex items-center justify-center mb-4">
        {/* Outer glowing ring */}
        <div className="absolute inset-0 bg-saffron/20 rounded-full blur-xl animate-pulse" />
        {/* Spinner */}
        <Loader2 size={36} className="text-saffron animate-spin relative z-10" />
      </div>
      <p className="text-sm text-gray-400 font-medium animate-pulse">
        कृपया प्रतीक्षा करा...
      </p>
    </div>
  );
}

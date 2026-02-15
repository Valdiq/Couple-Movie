import React, { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export default function StarRating({ rating = 0, onRatingChange, size = "sm", readonly = false }) {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeClasses = {
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-8 h-8"
  };

  const handleMouseMove = (e, index) => {
    if (readonly) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const isHalf = (e.clientX - rect.left) / rect.width < 0.5;
    setHoverRating(index + (isHalf ? 0.5 : 1));
  };

  const handleClick = (newRating) => {
    if (readonly) return;
    // Allows unsetting the rating by clicking the same star again
    if (newRating === rating) {
      onRatingChange(0);
    } else {
      onRatingChange(newRating);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div 
        className="flex"
        onMouseLeave={() => !readonly && setHoverRating(0)}
      >
        {[...Array(5)].map((_, i) => {
          const starValue = i + 1;
          const displayRating = hoverRating || rating;
          let fillClass = "fill-transparent";
          if (displayRating >= starValue) {
            fillClass = "fill-yellow-400";
          } else if (displayRating >= starValue - 0.5) {
            fillClass = "fill-yellow-400/50"; // Use a semi-transparent fill for half-stars
          }
          
          return (
            <div
              key={i}
              className={cn("relative", readonly ? "cursor-default" : "cursor-pointer")}
              onMouseMove={(e) => handleMouseMove(e, i)}
              onClick={() => !readonly && handleClick(hoverRating)}
            >
              <Star
                className={cn(sizeClasses[size], "text-yellow-400 transition-colors", fillClass)}
              />
            </div>
          );
        })}
      </div>
      {rating > 0 && (
        <span className="text-slate-400 text-sm font-medium tabular-nums">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
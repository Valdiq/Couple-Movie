import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ToggleGroup = React.forwardRef(({ 
  className, 
  children, 
  type = "single", 
  value, 
  onValueChange, 
  ...props 
}, ref) => {
  const handleItemClick = (itemValue) => {
    if (type === "single") {
      onValueChange?.(value === itemValue ? null : itemValue);
    }
  };

  return (
    <div 
      ref={ref} 
      className={cn("flex items-center gap-1", className)} 
      {...props}
    >
      {React.Children.map(children, (child) => 
        React.cloneElement(child, { 
          isSelected: value === child.props.value,
          onClick: () => handleItemClick(child.props.value)
        })
      )}
    </div>
  );
});

ToggleGroup.displayName = "ToggleGroup";

const ToggleGroupItem = React.forwardRef(({ 
  className, 
  children, 
  value, 
  isSelected, 
  onClick,
  ...props 
}, ref) => {
  return (
    <Button
      ref={ref}
      variant={isSelected ? "default" : "outline"}
      size="sm"
      className={cn(
        "transition-all",
        isSelected 
          ? "bg-slate-700 text-slate-100 border-slate-600" 
          : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-slate-200",
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </Button>
  );
});

ToggleGroupItem.displayName = "ToggleGroupItem";

export { ToggleGroup, ToggleGroupItem };
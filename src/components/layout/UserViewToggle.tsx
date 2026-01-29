import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { getUserViewMode, setUserViewMode } from "@/lib/userViewMode";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface UserViewToggleProps {
  collapsed?: boolean;
}

export function UserViewToggle({ collapsed = false }: UserViewToggleProps) {
  const [isUserView, setIsUserView] = useState(getUserViewMode());

  useEffect(() => {
    const handleModeChange = (event: CustomEvent<boolean>) => {
      setIsUserView(event.detail);
    };

    window.addEventListener('userViewModeChange', handleModeChange as EventListener);
    return () => {
      window.removeEventListener('userViewModeChange', handleModeChange as EventListener);
    };
  }, []);

  const handleToggle = (checked: boolean) => {
    setUserViewMode(checked);
    setIsUserView(checked);
  };

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button 
            onClick={() => handleToggle(!isUserView)}
            className={`flex items-center justify-center p-2 rounded-md transition-colors ${
              isUserView 
                ? "bg-blue-500/20 text-blue-500 hover:bg-blue-500/30" 
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {isUserView ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>{isUserView ? "User View ON" : "User View OFF"}</p>
          <p className="text-xs text-muted-foreground">See as regular user</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-colors ${
      isUserView 
        ? "bg-blue-500/10 border border-blue-500/30" 
        : "bg-muted/50 border border-border"
    }`}>
      <div className="flex items-center gap-2">
        {isUserView ? (
          <Eye className="h-4 w-4 text-blue-500 flex-shrink-0" />
        ) : (
          <EyeOff className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        )}
        <Label 
          htmlFor="user-view-toggle" 
          className={`text-xs font-medium cursor-pointer ${
            isUserView ? "text-blue-500" : "text-muted-foreground"
          }`}
        >
          {isUserView ? "User View ON" : "User View"}
        </Label>
      </div>
      <Switch
        id="user-view-toggle"
        checked={isUserView}
        onCheckedChange={handleToggle}
        className="data-[state=checked]:bg-blue-500"
      />
    </div>
  );
}

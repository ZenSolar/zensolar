import { useState, useEffect } from "react";
import { UserPlus, UserCheck } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { getNewUserViewMode, setNewUserViewMode } from "@/lib/userViewMode";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface UserViewToggleProps {
  collapsed?: boolean;
}

export function UserViewToggle({ collapsed = false }: UserViewToggleProps) {
  const [isNewUserView, setIsNewUserView] = useState(getNewUserViewMode());

  useEffect(() => {
    const handleModeChange = (event: CustomEvent<boolean>) => {
      setIsNewUserView(event.detail);
    };

    window.addEventListener('newUserViewModeChange', handleModeChange as EventListener);
    return () => {
      window.removeEventListener('newUserViewModeChange', handleModeChange as EventListener);
    };
  }, []);

  const handleToggle = (checked: boolean) => {
    setNewUserViewMode(checked);
    setIsNewUserView(checked);
  };

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button 
            onClick={() => handleToggle(!isNewUserView)}
            className={`flex items-center justify-center p-2 rounded-md transition-colors ${
              isNewUserView 
                ? "bg-blue-500/20 text-blue-500 hover:bg-blue-500/30" 
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {isNewUserView ? <UserPlus className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>{isNewUserView ? "New User View ON" : "New User View OFF"}</p>
          <p className="text-xs text-muted-foreground">Preview as new user</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-colors ${
      isNewUserView 
        ? "bg-blue-500/10 border border-blue-500/30" 
        : "bg-muted/50 border border-border"
    }`}>
      <div className="flex items-center gap-2">
        {isNewUserView ? (
          <UserPlus className="h-4 w-4 text-blue-500 flex-shrink-0" />
        ) : (
          <UserCheck className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        )}
        <Label 
          htmlFor="new-user-view-toggle" 
          className={`text-xs font-medium cursor-pointer ${
            isNewUserView ? "text-blue-500" : "text-muted-foreground"
          }`}
        >
          {isNewUserView ? "New User View ON" : "New User View"}
        </Label>
      </div>
      <Switch
        id="new-user-view-toggle"
        checked={isNewUserView}
        onCheckedChange={handleToggle}
        className="data-[state=checked]:bg-blue-500"
      />
    </div>
  );
}

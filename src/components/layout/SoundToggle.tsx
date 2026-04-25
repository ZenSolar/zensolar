import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSoundPreference } from "@/hooks/useSoundPreference";

/** Header sound toggle — mirrors ThemeToggle styling for visual consistency. */
export function SoundToggle() {
  const { soundEnabled, toggleSound } = useSoundPreference();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9 [&_svg]:size-5"
      onClick={toggleSound}
      aria-label={soundEnabled ? "Mute ambient sound" : "Enable ambient sound"}
      title={soundEnabled ? "Sound on" : "Sound off"}
    >
      {soundEnabled ? (
        <Volume2 className="text-foreground" />
      ) : (
        <VolumeX className="text-muted-foreground" />
      )}
      <span className="sr-only">Toggle sound</span>
    </Button>
  );
}

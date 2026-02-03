import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useRef } from 'react';
import mintingDemo from '@/assets/minting-flow-demo.mp4';

export function AppDemoSection() {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const restartVideo = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* Section Header */}
      <div className="text-center space-y-3">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Badge 
            variant="outline" 
            className="px-3 py-1 border-primary/40 bg-primary/10 text-primary font-medium"
          >
            <Play className="h-3 w-3 mr-1.5" />
            See It In Action
          </Badge>
        </motion.div>
        <motion.h2 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl md:text-3xl font-bold text-foreground"
        >
          Watch How It Works
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto"
        >
          See the complete flow from connecting your solar system to earning your first rewards.
        </motion.p>
      </div>

      {/* Video Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-card to-muted/20">
          {/* Browser Chrome */}
          <div className="bg-muted/50 border-b border-border px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-destructive/60" />
              <div className="h-3 w-3 rounded-full bg-accent/60" />
              <div className="h-3 w-3 rounded-full bg-secondary/60" />
            </div>
            <div className="flex-1 mx-8">
              <div className="bg-background/50 rounded-full px-4 py-1 text-xs text-muted-foreground text-center max-w-xs mx-auto">
                zensolar.app/dashboard
              </div>
            </div>
            <div className="w-16" />
          </div>

          <CardContent className="p-0 relative">
            {/* Video */}
            <video
              ref={videoRef}
              src={mintingDemo}
              className="w-full aspect-video object-cover"
              onEnded={handleVideoEnded}
              playsInline
              muted
            />

            {/* Play Overlay */}
            {!isPlaying && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/30 flex items-center justify-center cursor-pointer"
                onClick={togglePlay}
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-6 rounded-full bg-primary shadow-2xl shadow-primary/30"
                >
                  <Play className="h-10 w-10 text-primary-foreground fill-primary-foreground" />
                </motion.div>
              </motion.div>
            )}

            {/* Controls */}
            <div className="absolute bottom-4 right-4 flex items-center gap-2">
              <Button
                size="icon"
                variant="secondary"
                className="h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
                onClick={togglePlay}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              <Button
                size="icon"
                variant="secondary"
                className="h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
                onClick={restartVideo}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Caption */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center text-sm text-muted-foreground"
      >
        💡 This demo shows the NFT minting flow—you'll see similar experiences throughout the app.
      </motion.p>
    </motion.section>
  );
}

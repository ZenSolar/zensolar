import type React from 'react';
import { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate, PanInfo } from 'framer-motion';
import { EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SwipeableActivityFieldProps {
  children: React.ReactNode;
  onHide: () => void;
  disabled?: boolean;
}

export function SwipeableActivityField({ 
  children, 
  onHide,
  disabled = false 
}: SwipeableActivityFieldProps) {
  const [isDragging, setIsDragging] = useState(false);
  const constraintsRef = useRef<HTMLDivElement>(null);
  
  const x = useMotionValue(0);
  const hideButtonOpacity = useTransform(x, [-100, -50, 0], [1, 0.5, 0]);
  const hideButtonScale = useTransform(x, [-100, -50, 0], [1, 0.8, 0.6]);
  
  const handleDragEnd = (_: any, info: PanInfo) => {
    setIsDragging(false);
    
    // If swiped left more than threshold, trigger hide
    if (info.offset.x < -80) {
      // Animate out then trigger hide
      animate(x, -300, { duration: 0.2 }).then(() => {
        onHide();
      });
    } else {
      // Snap back
      animate(x, 0, { type: 'spring', stiffness: 500, damping: 30 });
    }
  };

  if (disabled) {
    return <>{children}</>;
  }

  return (
    <div ref={constraintsRef} className="relative overflow-hidden rounded-xl">
      {/* Hide action background */}
      <motion.div 
        className="absolute inset-y-0 right-0 flex items-center justify-end pr-4 bg-gradient-to-l from-destructive/20 to-transparent"
        style={{ 
          opacity: hideButtonOpacity,
          width: '100px',
        }}
      >
        <motion.div
          style={{ scale: hideButtonScale }}
          className="flex items-center gap-2 text-destructive"
        >
          <EyeOff className="h-5 w-5" />
          <span className="text-sm font-medium">Hide</span>
        </motion.div>
      </motion.div>

      {/* Swipeable content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -100, right: 0 }}
        dragElastic={0.1}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className={cn(
          "relative bg-card touch-pan-y",
          isDragging && "cursor-grabbing"
        )}
      >
        {children}
      </motion.div>
    </div>
  );
}

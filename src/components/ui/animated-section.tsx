import { motion, HTMLMotionProps } from 'framer-motion';
import { ReactNode } from 'react';

interface AnimatedSectionProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  delay?: number;
}

const fadeInUp = {
  hidden: { 
    opacity: 0, 
    y: 20 
  },
  visible: { 
    opacity: 1, 
    y: 0 
  }
};

export function AnimatedSection({ 
  children, 
  delay = 0, 
  className,
  ...props 
}: AnimatedSectionProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      transition={{ 
        duration: 0.4, 
        delay,
        ease: [0.25, 0.1, 0.25, 1]
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedContainer({ 
  children, 
  className,
  ...props 
}: AnimatedSectionProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.1
          }
        }
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedItem({ 
  children, 
  className,
  ...props 
}: Omit<AnimatedSectionProps, 'delay'>) {
  return (
    <motion.div
      variants={fadeInUp}
      transition={{ 
        duration: 0.4,
        ease: [0.25, 0.1, 0.25, 1]
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

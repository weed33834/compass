"use client";

import { type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { pageTransition, scrollTransition } from "@/lib/animations";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const reduceMotion = !!useReducedMotion();
  return (
    <motion.div
      className={cn(className)}
      variants={reduceMotion ? undefined : pageTransition}
      initial="initial"
      animate="enter"
      exit="exit"
    >
      {children}
    </motion.div>
  );
}

export { pageTransition, scrollTransition };

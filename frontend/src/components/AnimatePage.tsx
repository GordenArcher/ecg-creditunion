import { motion, AnimatePresence } from "framer-motion";
import React from "react";

interface Props {
  currentScreen?: string | undefined;
  children: React.ReactNode;
}

const AnimatePage = ({ currentScreen, children }: Props) => {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="relative w-full max-w-md">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScreen}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AnimatePage;

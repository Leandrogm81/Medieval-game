import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { PlusCircle } from 'lucide-react';

interface ToastContainerProps {
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toast }) => (
  <AnimatePresence>
    {toast && (
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-lg shadow-2xl border flex items-center gap-2 backdrop-blur-md ${
          toast.type === 'success'
            ? 'bg-green-900/90 border-green-500 text-green-100'
            : toast.type === 'error'
              ? 'bg-red-900/90 border-red-500 text-red-100'
              : 'bg-blue-900/90 border-blue-500 text-blue-100'
        }`}
      >
        {toast.type === 'success' && (
          <div className="p-1 bg-green-500 rounded-full">
            <PlusCircle size={12} className="text-green-900" />
          </div>
        )}
        <span className="text-xs font-bold medieval-text">{toast.message}</span>
      </motion.div>
    )}
  </AnimatePresence>
);

'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn } from "@/lib/utils";

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  options: Array<{
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    className?: string;
  }>;
}

export function ContextMenu({ x, y, onClose, options }: ContextMenuProps) {
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Adjust coordinates if menu goes off screen
  const [adjustedCoords, setAdjustedCoords] = React.useState({ left: x, top: y });

  React.useEffect(() => {
    if (menuRef.current) {
      const menuWidth = menuRef.current.offsetWidth;
      const menuHeight = menuRef.current.offsetHeight;
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      let newLeft = x;
      let newTop = y;

      if (x + menuWidth > windowWidth) {
        newLeft = windowWidth - menuWidth - 8;
      }
      if (y + menuHeight > windowHeight) {
        newTop = windowHeight - menuHeight - 8;
      }

      setAdjustedCoords({ left: newLeft, top: newTop });
    }
  }, [x, y]);

  if (typeof window === 'undefined') return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[9998] bg-transparent"
        onClick={onClose}
        onContextMenu={(e) => {
          e.preventDefault();
          onClose();
        }}
      />
      <div
        ref={menuRef}
        style={{ top: adjustedCoords.top, left: adjustedCoords.left }}
        className={cn(
          "fixed z-[9999] min-w-[210px] overflow-hidden rounded-2xl border p-1.5 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100",
          "border-neutral-200/50 bg-white/75 text-neutral-800 shadow-neutral-400/20",
          "dark:border-neutral-800/65 dark:bg-black/75 dark:text-neutral-200 dark:shadow-black/50"
        )}
      >
        {options.map((option, idx) => (
          <button
            key={idx}
            onClick={(e) => {
              e.stopPropagation();
              option.onClick();
              onClose();
            }}
            className={cn(
              "w-full text-left px-3.5 py-2 text-xs font-semibold rounded-xl flex items-center gap-2.5 transition-all duration-150",
              "hover:bg-[#0078d7]/10 hover:text-[#0078d7]",
              "dark:hover:bg-blue-500/20 dark:hover:text-blue-400",
              option.className || ""
            )}
          >
            {option.icon && (
              <span className="h-4 w-4 flex items-center justify-center shrink-0 opacity-80">
                {option.icon}
              </span>
            )}
            <span>{option.label}</span>
          </button>
        ))}
      </div>
    </>,
    document.body
  );
}

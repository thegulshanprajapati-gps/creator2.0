'use client';

import * as React from 'react';

interface DragSelectionLayerProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  onSelectionChange: (selectedIndexes: number[]) => void;
  itemsCount: number;
  selector: string; // CSS selector of items (e.g. '.asset-card')
}

export function DragSelectionLayer({
  containerRef,
  onSelectionChange,
  itemsCount,
  selector,
}: DragSelectionLayerProps) {
  const [dragBox, setDragBox] = React.useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const startPos = React.useRef<{ x: number; y: number } | null>(null);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseDown = (e: MouseEvent) => {
      // Prevent drag-select starting on interactive elements
      if (
        (e.target as HTMLElement).closest('button') ||
        (e.target as HTMLElement).closest('input') ||
        (e.target as HTMLElement).closest('a') ||
        (e.target as HTMLElement).closest('[role="dialog"]')
      ) {
        return;
      }

      const rect = container.getBoundingClientRect();
      const startX = e.clientX - rect.left + container.scrollLeft;
      const startY = e.clientY - rect.top + container.scrollTop;

      startPos.current = { x: startX, y: startY };

      // Clear existing drag state on initial click
      setDragBox({ x: startX, y: startY, w: 0, h: 0 });
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!startPos.current) return;

      const rect = container.getBoundingClientRect();
      const currentX = e.clientX - rect.left + container.scrollLeft;
      const currentY = e.clientY - rect.top + container.scrollTop;

      const x = Math.min(startPos.current.x, currentX);
      const y = Math.min(startPos.current.y, currentY);
      const w = Math.abs(startPos.current.x - currentX);
      const h = Math.abs(startPos.current.y - currentY);

      setDragBox({ x, y, w, h });

      // Determine overlapping nodes
      const elements = container.querySelectorAll(selector);
      const selected: number[] = [];

      // Rectangles overlap formula
      elements.forEach((el, index) => {
        const elHtml = el as HTMLElement;
        const elLeft = elHtml.offsetLeft;
        const elTop = elHtml.offsetTop;
        const elWidth = elHtml.offsetWidth;
        const elHeight = elHtml.offsetHeight;

        const isOverlapping =
          x < elLeft + elWidth &&
          x + w > elLeft &&
          y < elTop + elHeight &&
          y + h > elTop;

        if (isOverlapping) {
          selected.push(index);
        }
      });

      onSelectionChange(selected);
    };

    const handleMouseUp = () => {
      startPos.current = null;
      setDragBox(null);
    };

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [containerRef, onSelectionChange, selector, itemsCount]);

  if (!dragBox || dragBox.w < 5 || dragBox.h < 5) return null;

  return (
    <div
      style={{
        left: dragBox.x,
        top: dragBox.y,
        width: dragBox.w,
        height: dragBox.h,
      }}
      className="absolute pointer-events-none border border-amber-500 bg-amber-500/10 dark:border-yellow-400 dark:bg-yellow-400/10 rounded-sm z-50"
    />
  );
}

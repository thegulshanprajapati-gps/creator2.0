'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './dialog';
import { Button } from './button';

type ConfirmOptions = {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
};

type ConfirmContextType = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolveRef, setResolveRef] = useState<{ resolve: (value: boolean) => void } | null>(null);

  const confirm = (opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setOptions(opts);
      setResolveRef({ resolve });
      setIsOpen(true);
    });
  };

  const handleClose = (value: boolean) => {
    setIsOpen(false);
    if (resolveRef) {
      resolveRef.resolve(value);
    }
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(false); }}>
        <DialogContent className="rounded-3xl border border-primary/10 max-w-sm p-6 shadow-2xl bg-background animate-in fade-in zoom-in-95 duration-200">
          <DialogHeader className="text-left">
            <DialogTitle className="text-xl font-headline font-bold text-foreground">
              {options?.title || 'Are you sure?'}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-2">
              {options?.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              className="rounded-xl px-4 py-2 border-border text-foreground hover:bg-muted font-bold text-sm"
            >
              {options?.cancelText || 'Cancel'}
            </Button>
            <Button
              type="button"
              onClick={() => handleClose(true)}
              className="rounded-xl px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/95 shadow-md font-bold text-sm"
            >
              {options?.confirmText || 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
}

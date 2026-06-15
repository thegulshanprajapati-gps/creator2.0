'use client';

import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCMS } from "@/components/cms-provider";

interface SavingOverlayProps {
  isVisible: boolean;
  status: 'saving' | 'success' | 'error';
  progress: number;
  title?: string;
  description?: string;
  successTitle?: string;
  successDescription?: string;
  errorTitle?: string;
  errorDescription?: string;
  onClose?: () => void;
}

export function SavingOverlay({
  isVisible,
  status,
  progress,
  title = "Saving Changes",
  description = "Updating database blocks...",
  successTitle = "Successfully Saved!",
  successDescription = "All configurations successfully synchronized.",
  errorTitle = "Save Failed",
  errorDescription = "An error occurred while writing to the database.",
  onClose
}: SavingOverlayProps) {
  const { settings } = useCMS();
  const instagram = settings?.instagram_url || "";
  const youtube = settings?.youtube_url || "";
  const whatsapp = settings?.whatsapp_url || "";
  const hasSocials = instagram || youtube || whatsapp;

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="saving-overlay-container fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <Card className="rounded-[2.5rem] border-primary/10 shadow-2xl bg-background p-10 max-w-md w-full flex flex-col items-center space-y-6 animate-in zoom-in-95 duration-350">
            {status === 'saving' && (
              <div className="flex flex-col items-center space-y-6 w-full">
                <div className="relative flex items-center justify-center">
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}>
                    <Loader2 className="h-16 w-16 text-primary opacity-20" />
                  </motion.div>
                  <span className="absolute text-sm font-bold text-primary">{Math.round(progress)}%</span>
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-headline font-bold text-foreground">{title}</h3>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
                <div className="w-full bg-muted rounded-full h-3.5 overflow-hidden border">
                  <div 
                    className="bg-primary h-full rounded-full transition-all duration-300 ease-out" 
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {status === 'success' && (
              <div className="flex flex-col items-center space-y-5 text-center w-full">
                <div className="h-16 w-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 shadow-inner">
                  <CheckCircle2 className="h-10 w-10 animate-bounce" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-headline font-bold text-foreground">{successTitle}</h3>
                  <p className="text-sm text-muted-foreground">{successDescription}</p>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="flex flex-col items-center space-y-5 text-center w-full">
                <div className="h-16 w-16 bg-destructive/10 rounded-full flex items-center justify-center text-destructive shadow-inner">
                  <XCircle className="h-10 w-10 animate-pulse" />
                </div>
                <div className="space-y-2 w-full">
                  <h3 className="text-2xl font-headline font-bold text-foreground">{errorTitle}</h3>
                  <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 p-4 rounded-2xl break-words font-mono max-h-32 overflow-y-auto w-full">
                    {errorDescription}
                  </p>
                </div>
                {onClose && (
                  <Button 
                    onClick={onClose}
                    className="bg-primary w-full h-12 rounded-xl font-bold mt-2"
                  >
                    Dismiss
                  </Button>
                )}
              </div>
            )}
            {hasSocials && (
              <div className="flex items-center justify-center gap-4 pt-4 border-t w-full text-muted-foreground">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mr-1">Join Us:</span>
                {instagram && (
                  <a href={instagram} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                    <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                    </svg>
                  </a>
                )}
                {youtube && (
                  <a href={youtube} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                    <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                      <path d="M23.498 6.163a3.003 3.003 0 00-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.508a3.003 3.003 0 00-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 002.11 2.11c1.871.508 9.388.508 9.388.508s7.517 0 9.388-.508a3.003 3.003 0 002.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                  </a>
                )}
                {whatsapp && (
                  <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                    <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  </a>
                )}
              </div>
            )}
          </Card>
        </div>
      )}
    </AnimatePresence>
  );
}

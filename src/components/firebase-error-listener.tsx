'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handlePermissionError = (error: FirestorePermissionError) => {
      // In development, Next.js handles the error overlay for uncaught exceptions.
      // We throw it to trigger that overlay for better debugging of Security Rules.
      if (process.env.NODE_ENV === 'development') {
        throw error;
      } else {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "You don't have permission to perform this action.",
        });
      }
    };

    errorEmitter.on('permission-error', handlePermissionError);
    return () => {
      errorEmitter.off('permission-error', handlePermissionError);
    };
  }, [toast]);

  return null;
}

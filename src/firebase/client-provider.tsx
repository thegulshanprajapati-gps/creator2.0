
'use client';

import React, { useMemo } from 'react';
import { FirebaseProvider } from './provider';
import { FirebaseErrorListener } from '@/components/firebase-error-listener';
import { initializeFirebase } from './index';

/**
 * FirebaseClientProvider handles the initialization of the Firebase Client SDK
 * exclusively on the client side. This prevents hydration mismatches and
 * "Module not found" or serialization errors when importing Firebase in
 * Next.js Server Components.
 */
export function FirebaseClientProvider({ 
  children, 
}: { 
  children: React.ReactNode;
}) {
  // Use useMemo to ensure initializeFirebase is only called once per client lifecycle.
  const { firebaseApp, firestore, auth } = useMemo(() => initializeFirebase(), []);

  return (
    <FirebaseProvider firebaseApp={firebaseApp} firestore={firestore} auth={auth}>
      <FirebaseErrorListener />
      {children}
    </FirebaseProvider>
  );
}

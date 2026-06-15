'use client';

import { useEffect, useState } from 'react';
import { 
  onSnapshot, 
  Query, 
  DocumentData,
  FirestoreError,
  query as firestoreQuery
} from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export function useCollection<T = DocumentData>(q: Query<T> | null) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestorePermissionError | null>(null);

  useEffect(() => {
    if (!q) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as T));
        setData(items);
        setLoading(false);
      },
      async (serverError: FirestoreError) => {
        const permissionError = new FirestorePermissionError({
          path: (q as { _query?: { path?: { toString(): string } } })._query?.path?.toString() || 'unknown',
          operation: 'list',
        });
        setError(permissionError);
        errorEmitter.emit('permission-error', permissionError);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [q]);

  return { data, loading, error };
}

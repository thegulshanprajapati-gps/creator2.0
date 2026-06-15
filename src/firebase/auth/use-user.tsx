'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { useAuth } from '../provider';
import { doc, getDoc, getFirestore } from 'firebase/firestore';

export type UserRole = 'student' | 'instructor' | 'moderator' | 'admin' | 'super_admin';

export interface ExtendedUser extends FirebaseUser {
  role?: UserRole;
  enrolledCourses?: string[];
}

export function useUser() {
  const auth = useAuth();
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) return;

    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch custom role from Firestore
        const db = getFirestore();
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUser({
            ...firebaseUser,
            role: userData.role || 'student',
            enrolledCourses: userData.enrolledCourses || [],
          } as ExtendedUser);
        } else {
          setUser(firebaseUser as ExtendedUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
  }, [auth]);

  return { user, loading };
}

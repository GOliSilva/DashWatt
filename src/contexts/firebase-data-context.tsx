'use client';

import * as React from 'react';
import { firebaseDb } from '@/lib/firebase/client';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

export type Project = {
  id: string;
  name: string;
  area?: string;
  tipo?: string;
  value?: number;
  status?: string;
  health?: string;
  start?: any;
  end?: any;
  next?: string;
  createdAt?: any;
  updatedAt?: any;
  responsible?: string;
  description?: string;
  client?: string;
  manager?: string;
  managerId?: string;
};

export type Member = {
  id: string;
  name: string;
  email?: string;
  role?: string;
  sector?: string;
  cpf?: string;
  activity?: string;
  status?: string;
  isLeadership?: boolean;
  createdAt?: any;
  updatedAt?: any;
};

type FirebaseDataContextType = {
  projects: Project[];
  members: Member[];
  isLoading: boolean;
  error: string | null;
};

const FirebaseDataContext = React.createContext<FirebaseDataContextType | undefined>(undefined);

export function FirebaseDataProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [members, setMembers] = React.useState<Member[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!firebaseDb) {
      setError('Firebase não inicializado');
      setIsLoading(false);
      return;
    }

    let projectsUnsubscribe: (() => void) | undefined;
    let membersUnsubscribe: (() => void) | undefined;

    try {
      // Subscribe to projects collection
      const projectsQuery = query(
        collection(firebaseDb, 'projects'),
        orderBy('createdAt', 'desc')
      );
      
      projectsUnsubscribe = onSnapshot(
        projectsQuery,
        (snapshot) => {
          const projectsData: Project[] = [];
          snapshot.forEach((doc) => {
            projectsData.push({
              id: doc.id,
              ...doc.data()
            } as Project);
          });
          setProjects(projectsData);
          setIsLoading(false);
        },
        (err) => {
          console.error('Erro ao escutar projetos:', err);
          setError(err.message);
          setIsLoading(false);
        }
      );

      // Subscribe to members collection
      const membersQuery = query(
        collection(firebaseDb, 'members'),
        orderBy('createdAt', 'desc')
      );
      
      membersUnsubscribe = onSnapshot(
        membersQuery,
        (snapshot) => {
          const membersData: Member[] = [];
          snapshot.forEach((doc) => {
            membersData.push({
              id: doc.id,
              ...doc.data()
            } as Member);
          });
          setMembers(membersData);
        },
        (err) => {
          console.error('Erro ao escutar membros:', err);
          setError(err.message);
        }
      );
    } catch (err: any) {
      console.error('Erro ao configurar listeners:', err);
      setError(err.message);
      setIsLoading(false);
    }

    // Cleanup function
    return () => {
      if (projectsUnsubscribe) projectsUnsubscribe();
      if (membersUnsubscribe) membersUnsubscribe();
    };
  }, []);

  return (
    <FirebaseDataContext.Provider value={{ projects, members, isLoading, error }}>
      {children}
    </FirebaseDataContext.Provider>
  );
}

export function useFirebaseData() {
  const context = React.useContext(FirebaseDataContext);
  if (context === undefined) {
    throw new Error('useFirebaseData must be used within a FirebaseDataProvider');
  }
  return context;
}

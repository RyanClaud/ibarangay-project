'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import type { User, Resident, DocumentRequest, DocumentRequestStatus } from '@/lib/types';
import { documentRequests as initialDocumentRequests, residents as initialResidents, findUserByCredential, users } from '@/lib/data';

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  login: (credential: string) => User | undefined;
  logout: () => void;
  residents: Resident[];
  setResidents: (residents: Resident[]) => void;
  documentRequests: DocumentRequest[];
  setDocumentRequests: (requests: DocumentRequest[]) => void;
  addDocumentRequest: (request: Omit<DocumentRequest, 'id' | 'trackingNumber' | 'requestDate' | 'status'>) => void;
  updateDocumentRequestStatus: (id: string, status: DocumentRequestStatus) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Find the admin user from the mock data to use as the default.
const defaultUser = users.find(u => u.role === 'Admin');

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(defaultUser || null);
  const [residents, setResidents] = useState<Resident[]>(initialResidents);
  const [documentRequests, setDocumentRequests] = useState<DocumentRequest[]>(initialDocumentRequests);

  const login = (credential: string) => {
    const user = findUserByCredential(credential);
    if (user) {
      setCurrentUser(user);
    }
    return user;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const addDocumentRequest = (request: Omit<DocumentRequest, 'id' | 'trackingNumber' | 'requestDate' | 'status'>) => {
    const newIdNumber = Math.max(...documentRequests.map(r => parseInt(r.id.replace('DOC', ''))), 0) + 1;
    const newRequest: DocumentRequest = {
        ...request,
        id: `DOC${String(newIdNumber).padStart(3, '0')}`,
        requestDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        status: 'Pending',
        trackingNumber: `IBGY-${new Date().getFullYear().toString().slice(2)}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${new Date().getDate().toString().padStart(2, '0')}${String(newIdNumber).padStart(3, '0')}`,
    };
    setDocumentRequests(prev => [newRequest, ...prev]);
  };

  const updateDocumentRequestStatus = (id: string, status: DocumentRequestStatus) => {
    setDocumentRequests(prev => 
      prev.map(req => 
        req.id === id ? { ...req, status } : req
      )
    );
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      setCurrentUser,
      login,
      logout,
      residents,
      setResidents,
      documentRequests,
      setDocumentRequests,
      addDocumentRequest,
      updateDocumentRequestStatus,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

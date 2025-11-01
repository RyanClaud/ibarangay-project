'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import type { User, Resident, DocumentRequest, DocumentRequestStatus, Role } from '@/lib/types';
import { documentRequests as initialDocumentRequests, residents as initialResidents, findUserByCredential, users as initialUsers } from '@/lib/data';

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  login: (credential: string) => User | undefined;
  logout: () => void;
  residents: Resident[];
  setResidents: (residents: Resident[]) => void;
  addResident: (resident: Omit<Resident, 'id' | 'userId' | 'avatarUrl'>) => void;
  documentRequests: DocumentRequest[];
  setDocumentRequests: (requests: DocumentRequest[]) => void;
  addDocumentRequest: (request: Omit<DocumentRequest, 'id' | 'trackingNumber' | 'requestDate' | 'status'>) => void;
  updateDocumentRequestStatus: (id: string, status: DocumentRequestStatus) => void;
  users: User[];
  addUser: (user: Omit<User, 'id' | 'avatarUrl'>) => void;
  updateUser: (user: User) => void;
  deleteUser: (userId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Find the admin user from the mock data to use as the default.
const defaultUser = initialUsers.find(u => u.role === 'Admin');

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(defaultUser || null);
  const [residents, setResidents] = useState<Resident[]>(initialResidents);
  const [documentRequests, setDocumentRequests] = useState<DocumentRequest[]>(initialDocumentRequests);
  const [users, setUsers] = useState<User[]>(initialUsers);

  const login = (credential: string) => {
    const user = findUserByCredential(credential, users, residents);
    if (user) {
      setCurrentUser(user);
    }
    return user;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const addResident = (newResidentData: Omit<Resident, 'id' | 'userId' | 'avatarUrl'>) => {
    const newIdNumber = Math.max(...residents.map(r => parseInt(r.id.replace('RES', ''))), 0) + 1;
    const newUserIdNumber = Math.max(...residents.map(r => parseInt(r.userId.replace('R-', ''))), 1000) + 1;

    const newResident: Resident = {
      ...newResidentData,
      id: `RES${String(newIdNumber).padStart(3, '0')}`,
      userId: `R-${newUserIdNumber}`,
      avatarUrl: `https://picsum.photos/seed/${newIdNumber}/100/100`,
    };
    setResidents(prev => [newResident, ...prev]);
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

  const addUser = (user: Omit<User, 'id' | 'avatarUrl'>) => {
    const newIdNumber = Math.max(...users.map(u => parseInt(u.id.replace('USR', ''))), 0) + 1;
    const newUser: User = {
      ...user,
      id: `USR${String(newIdNumber).padStart(3, '0')}`,
      avatarUrl: `https://picsum.photos/seed/${newIdNumber + 10}/100/100`,
    };
    setUsers(prev => [newUser, ...prev]);
  };

  const updateUser = (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    setResidents(prev => prev.map(r => r.id === updatedUser.residentId ? { ...r, firstName: updatedUser.name.split(' ')[0], lastName: updatedUser.name.split(' ')[1] || '' } : r));
  };

  const deleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      setCurrentUser,
      login,
      logout,
      residents,
      setResidents,
      addResident,
      documentRequests,
      setDocumentRequests,
      addDocumentRequest,
      updateDocumentRequestStatus,
      users,
      addUser,
      updateUser,
      deleteUser,
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

import type { User, Resident, DocumentRequest, Role, DocumentRequestStatus } from './types';

// This file now primarily serves to provide initial user data for login checks
// and a function to find a user. The actual data will come from Firestore.

export const users: User[] = [
  { id: 'USR001', name: 'Admin User', email: 'admin@ibarangay.com', avatarUrl: 'https://picsum.photos/seed/1/100/100', role: 'Admin' },
  { id: 'USR002', name: 'Amado Magtibay', email: 'captain@ibarangay.com', avatarUrl: 'https://picsum.photos/seed/2/100/100', role: 'Barangay Captain' },
  { id: 'USR003', name: 'Maria Clara', email: 'secretary@ibarangay.com', avatarUrl: 'https://picsum.photos/seed/3/100/100', role: 'Secretary' },
  { id: 'USR004', name: 'Jose Rizal', email: 'treasurer@ibarangay.com', avatarUrl: 'https://picsum.photos/seed/4/100/100', role: 'Treasurer' },
];

// This function now only needs to check against staff users for initial login,
// or against the already-loaded list of all users.
export const findUserByCredential = (credential: string, allUsers: User[]): User | undefined => {
  return allUsers.find(u => 
    u.email.toLowerCase() === credential.toLowerCase() || 
    (u.role === 'Resident' && u.userId?.toLowerCase() === credential.toLowerCase())
  );
}

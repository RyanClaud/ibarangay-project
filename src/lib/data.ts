import type { User, Resident, DocumentRequest, Role, DocumentRequestStatus } from './types';

// This file now primarily serves to provide initial user data for login checks
// and a function to find a user. The actual data will come from Firestore.

export const users: User[] = [
  { id: 'USR001', name: 'Admin User', email: 'admin@ibarangay.com', avatarUrl: 'https://picsum.photos/seed/1/100/100', role: 'Admin' },
  { id: 'USR002', name: 'Amado Magtibay', email: 'captain@ibarangay.com', avatarUrl: 'https://picsum.photos/seed/2/100/100', role: 'Barangay Captain' },
  { id: 'USR003', name: 'Maria Clara', email: 'secretary@ibarangay.com', avatarUrl: 'https://picsum.photos/seed/3/100/100', role: 'Secretary' },
  { id: 'USR004', name: 'Jose Rizal', email: 'treasurer@ibarangay.com', avatarUrl: 'https://picsum.photos/seed/4/100/100', role: 'Treasurer' },
];

export const findUserByCredential = (credential: string, allUsers: User[], allResidents: Resident[]): User | undefined => {
  if (credential.startsWith('R-')) {
    const resident = allResidents.find(r => r.userId === credential);
    if (!resident) return undefined;
    
    let user = allUsers.find(u => u.residentId === resident.id);
    if (!user) {
      // This part is for mock-only, in a real app user accounts would be formally created
      user = {
        id: `USR-${resident.id}`,
        name: `${resident.firstName} ${resident.lastName}`,
        email: `${resident.lastName.toLowerCase()}@ibarangay.com`,
        avatarUrl: resident.avatarUrl,
        role: 'Resident',
        residentId: resident.id,
      };
    }
    return user;
  }
  return allUsers.find(u => u.email.toLowerCase() === credential.toLowerCase());
}

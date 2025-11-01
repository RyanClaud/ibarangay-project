import type { User, Resident, DocumentRequest, Role, DocumentRequestStatus } from './types';

export const users: User[] = [
  { id: 'USR001', name: 'Admin User', email: 'admin@ibarangay.com', avatarUrl: 'https://picsum.photos/seed/1/100/100', role: 'Admin' },
  { id: 'USR002', name: 'Juan Dela Cruz', email: 'captain@ibarangay.com', avatarUrl: 'https://picsum.photos/seed/2/100/100', role: 'Barangay Captain' },
  { id: 'USR003', name: 'Maria Clara', email: 'secretary@ibarangay.com', avatarUrl: 'https://picsum.photos/seed/3/100/100', role: 'Secretary' },
  { id: 'USR004', name: 'Jose Rizal', email: 'treasurer@ibarangay.com', avatarUrl: 'https://picsum.photos/seed/4/100/100', role: 'Treasurer' },
  { id: 'USR005', name: 'Andres Bonifacio', email: 'resident@ibarangay.com', avatarUrl: 'https://picsum.photos/seed/5/100/100', role: 'Resident' },
];

export const residents: Resident[] = [
  { id: 'RES001', userId: 'R-1001', firstName: 'Andres', lastName: 'Bonifacio', address: '123 Rizal St, Brgy. 1', birthdate: '1990-01-15', householdNumber: 'HH-001', avatarUrl: 'https://picsum.photos/seed/5/100/100' },
  { id: 'RES002', userId: 'R-1002', firstName: 'Gabriela', lastName: 'Silang', address: '456 Mabini St, Brgy. 1', birthdate: '1992-03-20', householdNumber: 'HH-002', avatarUrl: 'https://picsum.photos/seed/6/100/100' },
  { id: 'RES003', userId: 'R-1003', firstName: 'Apolinario', lastName: 'Mabini', address: '789 Luna St, Brgy. 2', birthdate: '1985-07-22', householdNumber: 'HH-003', avatarUrl: 'https://picsum.photos/seed/7/100/100' },
  { id: 'RES004', userId: 'R-1004', firstName: 'Melchora', lastName: 'Aquino', address: '101 Bonifacio St, Brgy. 2', birthdate: '1988-11-30', householdNumber: 'HH-004', avatarUrl: 'https://picsum.photos/seed/8/100/100' },
  { id: 'RES005', userId: 'R-1005', firstName: 'Emilio', lastName: 'Aguinaldo', address: '212 Jacinto St, Brgy. 3', birthdate: '1995-05-10', householdNumber: 'HH-005', avatarUrl: 'https://picsum.photos/seed/9/100/100' },
];

const statuses: DocumentRequestStatus[] = ["Pending", "Approved", "Paid", "Released", "Rejected"];

export const documentRequests: DocumentRequest[] = [
  { id: 'DOC001', residentId: 'RES001', residentName: 'Andres Bonifacio', documentType: 'Barangay Clearance', requestDate: '2024-07-20', status: 'Released', trackingNumber: 'IBGY-240720001', amount: 50.00 },
  { id: 'DOC002', residentId: 'RES002', residentName: 'Gabriela Silang', documentType: 'Certificate of Residency', requestDate: '2024-07-19', status: 'Approved', trackingNumber: 'IBGY-240719002', amount: 75.00 },
  { id: 'DOC003', residentId: 'RES003', residentName: 'Apolinario Mabini', documentType: 'Certificate of Indigency', requestDate: '2024-07-18', status: 'Paid', trackingNumber: 'IBGY-240718001', amount: 0.00 },
  { id: 'DOC004', residentId: 'RES004', residentName: 'Melchora Aquino', documentType: 'Barangay Clearance', requestDate: '2024-07-21', status: 'Pending', trackingNumber: 'IBGY-240721001', amount: 50.00 },
  { id: 'DOC005', residentId: 'RES005', residentName: 'Emilio Aguinaldo', documentType: 'Certificate of Residency', requestDate: '2024-07-21', status: 'Rejected', trackingNumber: 'IBGY-240721002', amount: 75.00 },
  { id: 'DOC006', residentId: 'RES001', residentName: 'Andres Bonifacio', documentType: 'Certificate of Residency', requestDate: '2024-06-15', status: 'Released', trackingNumber: 'IBGY-240615001', amount: 75.00 },
  { id: 'DOC007', residentId: 'RES002', residentName: 'Gabriela Silang', documentType: 'Barangay Clearance', requestDate: '2024-06-25', status: 'Released', trackingNumber: 'IBGY-240625001', amount: 50.00 },
  { id: 'DOC008', residentId: 'RES003', residentName: 'Apolinario Mabini', documentType: 'Barangay Clearance', requestDate: '2024-05-10', status: 'Released', trackingNumber: 'IBGY-240510001', amount: 50.00 },
];

export const getLoggedInUser = (role: Role = 'Admin'): User => {
  const user = users.find(u => u.role === role);
  return user || users[0];
};

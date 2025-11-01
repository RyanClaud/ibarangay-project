export type Role = "Admin" | "Barangay Captain" | "Secretary" | "Treasurer" | "Resident";

export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: Role;
};

export type Resident = {
  id: string;
  userId: string;
  firstName: string;
  lastName:string;
  address: string;
  birthdate: string;
  householdNumber: string;
  avatarUrl: string;
};

export type DocumentType = "Barangay Clearance" | "Certificate of Residency" | "Certificate of Indigency";

export type DocumentRequestStatus = "Pending" | "Approved" | "Released" | "Rejected" | "Paid";

export type DocumentRequest = {
  id: string;
  residentId: string;
  residentName: string;
  documentType: DocumentType;
  requestDate: string;
  status: DocumentRequestStatus;
  trackingNumber: string;
  amount: number;
};

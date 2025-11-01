export type Role = "Admin" | "Barangay Captain" | "Secretary" | "Treasurer" | "Resident";

export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: Role;
  residentId?: string; // Link user to a resident profile
};

export type Resident = {
  id: string;
  userId: string;
  firstName: string;
  lastName:string;
  purok: string;
  address: string;
  birthdate: string;
  householdNumber: string;
  avatarUrl: string;
  email: string;
};

export type DocumentType = "Barangay Clearance" | "Certificate of Residency" | "Certificate of Indigency" | "Business Permit" | "Good Moral Character Certificate" | "Solo Parent Certificate";

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

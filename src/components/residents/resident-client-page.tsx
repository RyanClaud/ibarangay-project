"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FileDown, MoreHorizontal, PlusCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Resident } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { AddResidentDialog } from "./add-resident-dialog";
import { EditResidentDialog } from "./edit-resident-dialog";
import { DeleteResidentDialog } from "./delete-resident-dialog";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/contexts/app-context";

export function ResidentClientPage() {
  const { residents, addResident, updateResident } = useAppContext();
  const [filter, setFilter] = React.useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [residentToEdit, setResidentToEdit] = React.useState<Resident | null>(null);
  const [residentToDelete, setResidentToDelete] = React.useState<Resident | null>(null);
  const router = useRouter();

  const filteredData = (residents || []).filter(
    (resident) =>
      resident.firstName.toLowerCase().includes(filter.toLowerCase()) ||
      resident.lastName.toLowerCase().includes(filter.toLowerCase()) ||
      resident.userId.toLowerCase().includes(filter.toLowerCase())
  ).sort((a, b) => {
    // Assuming IDs are sortable strings like 'RES001', 'RES002'
    return b.id.localeCompare(a.id);
  });

  const handleAddResident = (newResident: Omit<Resident, 'id' | 'avatarUrl' | 'userId' | 'address'>) => {
    addResident(newResident);
  };

  const handleUpdateResident = (updatedResident: Resident) => {
    updateResident(updatedResident);
    setResidentToEdit(null);
  };

  const handleDeleteResident = (residentId: string) => {
    // A 'deleteResident' function should be called from context here
    console.log("Delete resident not implemented yet");
    setResidentToDelete(null);
  };
  
  const handleViewProfile = (residentId: string) => {
    router.push(`/residents/${residentId}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Input
          placeholder="Filter by name or User ID..."
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          className="max-w-sm"
        />
        <div className="flex gap-2">
          <Button variant="outline">
            <FileDown />
            Export
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <PlusCircle />
            Add Resident
          </Button>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Birthdate</TableHead>
              <TableHead>Household No.</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length ? (
              filteredData.map((resident) => (
                <TableRow key={resident.id}>
                  <TableCell className="font-medium">{resident.userId}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={resident.avatarUrl} alt={resident.firstName} />
                        <AvatarFallback>
                          {resident.firstName?.[0]}
                          {resident.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="font-medium">{resident.firstName} {resident.lastName}</div>
                    </div>
                  </TableCell>
                  <TableCell>{resident.address}</TableCell>
                  <TableCell>{resident.birthdate}</TableCell>
                  <TableCell>{resident.householdNumber}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => setResidentToEdit(resident)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleViewProfile(resident.id)}>View Profile</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => setResidentToDelete(resident)}>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <AddResidentDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAddResident={handleAddResident}
      />
      {residentToEdit && (
        <EditResidentDialog
          isOpen={!!residentToEdit}
          onClose={() => setResidentToEdit(null)}
          onUpdateResident={handleUpdateResident}
          resident={residentToEdit}
        />
      )}
      {residentToDelete && (
        <DeleteResidentDialog
          isOpen={!!residentToDelete}
          onClose={() => setResidentToDelete(null)}
          onConfirm={() => handleDeleteResident(residentToDelete.id)}
          residentName={`${residentToDelete.firstName} ${residentToDelete.lastName}`}
        />
      )}
    </div>
  );
}

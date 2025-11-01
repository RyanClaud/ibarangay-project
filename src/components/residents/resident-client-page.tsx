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

interface ResidentClientPageProps {
  data: Resident[];
}

export function ResidentClientPage({ data: initialData }: ResidentClientPageProps) {
  const [data, setData] = React.useState(initialData);
  const [filter, setFilter] = React.useState("");

  const filteredData = data.filter(
    (resident) =>
      resident.firstName.toLowerCase().includes(filter.toLowerCase()) ||
      resident.lastName.toLowerCase().includes(filter.toLowerCase()) ||
      resident.userId.toLowerCase().includes(filter.toLowerCase())
  );

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
          <Button>
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
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>View Profile</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
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
    </div>
  );
}

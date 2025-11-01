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
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DocumentRequest, DocumentRequestStatus } from "@/lib/types";
import { Badge } from "../ui/badge";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DocumentRequestClientPageProps {
  data: DocumentRequest[];
}

const statusColors: Record<DocumentRequestStatus, string> = {
  Pending: "bg-amber-100 text-amber-800 border-amber-200",
  Approved: "bg-sky-100 text-sky-800 border-sky-200",
  Paid: "bg-blue-100 text-blue-800 border-blue-200",
  Released: "bg-green-100 text-green-800 border-green-200",
  Rejected: "bg-red-100 text-red-800 border-red-200",
};

const TABS: DocumentRequestStatus[] = ["Pending", "Approved", "Paid", "Released", "Rejected"];

export function DocumentRequestClientPage({ data: initialData }: DocumentRequestClientPageProps) {
  const [data, setData] = React.useState(initialData);
  const [filter, setFilter] = React.useState("");
  const [activeTab, setActiveTab] = React.useState<DocumentRequestStatus | 'All'>('Pending');

  const filteredData = data.filter(
    (request) =>
      (request.residentName.toLowerCase().includes(filter.toLowerCase()) ||
      request.trackingNumber.toLowerCase().includes(filter.toLowerCase())) &&
      (activeTab === 'All' || request.status === activeTab)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Input
          placeholder="Filter by name or tracking no..."
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          className="max-w-sm"
        />
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6">
            <TabsTrigger value="All">All</TabsTrigger>
          {TABS.map(tab => (
            <TabsTrigger key={tab} value={tab}>{tab}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tracking No.</TableHead>
              <TableHead>Resident Name</TableHead>
              <TableHead>Document</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length ? (
              filteredData.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.trackingNumber}</TableCell>
                  <TableCell>{request.residentName}</TableCell>
                  <TableCell>{request.documentType}</TableCell>
                  <TableCell>{request.requestDate}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("font-semibold", statusColors[request.status])}>
                      {request.status}
                    </Badge>
                  </TableCell>
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
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Approve</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Reject</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No requests found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

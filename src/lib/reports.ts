'use client';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import type { Resident, DocumentRequest } from './types';

// -------- UTILITY FUNCTIONS --------

const saveAsExcel = (buffer: any, fileName: string) => {
    const data = new Blob([buffer], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

const generatePdf = (title: string, head: any[], body: any[], fileName: string) => {
    const doc = new jsPDF();
    doc.text(title, 14, 15);
    autoTable(doc, { head, body, startY: 20 });
    doc.save(fileName);
};

const generateExcel = (worksheet: XLSX.WorkSheet, fileName: string) => {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    saveAsExcel(wbout, fileName);
};


// -------- RESIDENT MASTERLIST --------

const residentHeaders = ['User ID', 'Name', 'Address', 'Birthdate', 'Household No.'];

const formatResidentData = (residents: Resident[]) => {
    return residents.map(r => [
        r.userId,
        `${r.firstName} ${r.lastName}`,
        r.address,
        r.birthdate,
        r.householdNumber
    ]);
};

export const exportResidentMasterlist = (formatType: 'pdf' | 'excel', residents: Resident[]) => {
    const data = formatResidentData(residents);
    const fileName = `Resident_Masterlist_${format(new Date(), 'yyyy-MM-dd')}`;
    
    if (formatType === 'pdf') {
        generatePdf('Resident Masterlist', [residentHeaders], data, `${fileName}.pdf`);
    } else {
        const worksheet = XLSX.utils.aoa_to_sheet([residentHeaders, ...data]);
        generateExcel(worksheet, `${fileName}.xlsx`);
    }
};


// -------- MONTHLY REVENUE REPORT --------

const revenueHeaders = ['Month', 'Total Revenue'];

const formatRevenueData = (requests: DocumentRequest[]) => {
    const monthlyRevenue: { [key: string]: number } = {};
    
    requests
        .filter(req => req.status === 'Released' || req.status === 'Paid')
        .forEach(req => {
            const month = format(new Date(req.requestDate), 'yyyy-MM');
            if (!monthlyRevenue[month]) {
                monthlyRevenue[month] = 0;
            }
            monthlyRevenue[month] += req.amount;
        });

    return Object.entries(monthlyRevenue).map(([month, total]) => [
        month,
        `₱${total.toFixed(2)}`
    ]).sort((a,b) => a[0].localeCompare(b[0]));
};

export const exportMonthlyRevenue = (formatType: 'pdf' | 'excel', requests: DocumentRequest[]) => {
    const data = formatRevenueData(requests);
    const fileName = `Monthly_Revenue_Report_${format(new Date(), 'yyyy-MM-dd')}`;

    if (formatType === 'pdf') {
        generatePdf('Monthly Revenue Report', [revenueHeaders], data, `${fileName}.pdf`);
    } else {
        const worksheet = XLSX.utils.aoa_to_sheet([revenueHeaders, ...data]);
        generateExcel(worksheet, `${fileName}.xlsx`);
    }
};


// -------- DOCUMENT ISSUANCE REPORT --------

const issuanceHeaders = ['Tracking No.', 'Resident Name', 'Document', 'Date', 'Status', 'Amount'];

const formatIssuanceData = (requests: DocumentRequest[]) => {
    return requests.map(req => [
        req.trackingNumber,
        req.residentName,
        req.documentType,
        req.requestDate,
        req.status,
        `₱${req.amount.toFixed(2)}`
    ]);
};

export const exportDocumentIssuance = (formatType: 'pdf' | 'excel', requests: DocumentRequest[]) => {
    const data = formatIssuanceData(requests);
    const fileName = `Document_Issuance_Report_${format(new Date(), 'yyyy-MM-dd')}`;
    
    if (formatType === 'pdf') {
        generatePdf('Document Issuance Report', [issuanceHeaders], data, `${fileName}.pdf`);
    } else {
        const worksheet = XLSX.utils.aoa_to_sheet([issuanceHeaders, ...data]);
        generateExcel(worksheet, `${fileName}.xlsx`);
    }
};

'use client';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import type { Resident, DocumentRequest } from './types';

// -------- UTILITY FUNCTIONS --------

<<<<<<< HEAD
const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', { style: 'currency', currency: 'PHP' });
};

=======
>>>>>>> 6c232461fb2b050965cc4b24accfb5c51a747356
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

<<<<<<< HEAD
export const generatePdf = (title: string, head: any[], body: any[], fileName: string) => {
=======
const generatePdf = (title: string, head: any[], body: any[], fileName: string) => {
>>>>>>> 6c232461fb2b050965cc4b24accfb5c51a747356
    const doc = new jsPDF();
    doc.text(title, 14, 15);
    autoTable(doc, { head, body, startY: 20 });
    doc.save(fileName);
};

<<<<<<< HEAD
export const generateExcel = (data: any[][], fileName: string) => {
    const worksheet = XLSX.utils.aoa_to_sheet(data);
=======
const generateExcel = (worksheet: XLSX.WorkSheet, fileName: string) => {
>>>>>>> 6c232461fb2b050965cc4b24accfb5c51a747356
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
<<<<<<< HEAD
        generateExcel([residentHeaders, ...data], `${fileName}.xlsx`);
=======
        const worksheet = XLSX.utils.aoa_to_sheet([residentHeaders, ...data]);
        generateExcel(worksheet, `${fileName}.xlsx`);
>>>>>>> 6c232461fb2b050965cc4b24accfb5c51a747356
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
<<<<<<< HEAD
        formatCurrency(total)
=======
        `₱${total.toFixed(2)}`
>>>>>>> 6c232461fb2b050965cc4b24accfb5c51a747356
    ]).sort((a,b) => a[0].localeCompare(b[0]));
};

export const exportMonthlyRevenue = (formatType: 'pdf' | 'excel', requests: DocumentRequest[]) => {
    const data = formatRevenueData(requests);
    const fileName = `Monthly_Revenue_Report_${format(new Date(), 'yyyy-MM-dd')}`;

    if (formatType === 'pdf') {
        generatePdf('Monthly Revenue Report', [revenueHeaders], data, `${fileName}.pdf`);
    } else {
<<<<<<< HEAD
        generateExcel([revenueHeaders, ...data], `${fileName}.xlsx`);
=======
        const worksheet = XLSX.utils.aoa_to_sheet([revenueHeaders, ...data]);
        generateExcel(worksheet, `${fileName}.xlsx`);
>>>>>>> 6c232461fb2b050965cc4b24accfb5c51a747356
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
<<<<<<< HEAD
        formatCurrency(req.amount)
=======
        `₱${req.amount.toFixed(2)}`
>>>>>>> 6c232461fb2b050965cc4b24accfb5c51a747356
    ]);
};

export const exportDocumentIssuance = (formatType: 'pdf' | 'excel', requests: DocumentRequest[]) => {
    const data = formatIssuanceData(requests);
    const fileName = `Document_Issuance_Report_${format(new Date(), 'yyyy-MM-dd')}`;
    
    if (formatType === 'pdf') {
        generatePdf('Document Issuance Report', [issuanceHeaders], data, `${fileName}.pdf`);
    } else {
<<<<<<< HEAD
        generateExcel([issuanceHeaders, ...data], `${fileName}.xlsx`);
=======
        const worksheet = XLSX.utils.aoa_to_sheet([issuanceHeaders, ...data]);
        generateExcel(worksheet, `${fileName}.xlsx`);
>>>>>>> 6c232461fb2b050965cc4b24accfb5c51a747356
    }
};

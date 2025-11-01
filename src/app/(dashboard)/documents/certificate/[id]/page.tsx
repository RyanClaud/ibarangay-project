'use client';

import { useParams, notFound, useRouter } from "next/navigation";
import { useAppContext } from "@/contexts/app-context";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import type { DocumentRequest, Resident } from "@/lib/types";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Logo } from "@/components/logo";
import { toast } from "@/hooks/use-toast";
import { useMemo } from "react";

export default function CertificatePage() {
  const { id } = useParams();
  const { documentRequests, residents, currentUser, isDataLoading, updateDocumentRequestStatus } = useAppContext();
  const router = useRouter();

  // Find the specific request from the list
  const request: DocumentRequest | undefined = useMemo(() => 
    (documentRequests || []).find(r => r.id === id), 
    [documentRequests, id]
  );
  
  // Find the associated resident. For residents, it's their own data. For staff, it's from the snapshot or main list.
  const resident = useMemo(() => {
    if (!request) return null;
    // For staff, the snapshot is the source of truth for the certificate.
    if (currentUser?.role !== 'Resident') {
      return request.residentSnapshot;
    }
    // For a resident viewing their own certificate, find their profile in the main residents list.
    return (residents || []).find(res => res.id === request.residentId);
  }, [request, residents, currentUser]);


  // Show loader if context data is not yet available
  if (isDataLoading || !currentUser) {
    return (
        <div className="flex h-full w-full items-center justify-center p-8">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
    );
  }

  // If the request isn't found, or if the resident data for the cert can't be determined.
  if (!request || !resident) {
    return notFound();
  }

  const handleDownload = () => {
    const certificateElement = document.getElementById('certificate');
    if (certificateElement) {
        const noPrintElements = certificateElement.querySelectorAll('.no-print-capture');
        noPrintElements.forEach(el => el.classList.add('hidden'));

        html2canvas(certificateElement, {
            scale: 3, // Increased scale for better PDF quality
            useCORS: true,
        }).then((canvas) => {
            noPrintElements.forEach(el => el.classList.remove('hidden'));

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'in',
                format: 'letter' // Standard 8.5x11 inches
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            const canvasAspectRatio = canvasWidth / canvasHeight;
            const pdfAspectRatio = pdfWidth / pdfHeight;

            let renderWidth, renderHeight;

            // Fit the image to the page, maintaining aspect ratio
            if (canvasAspectRatio > pdfAspectRatio) {
                renderWidth = pdfWidth;
                renderHeight = pdfWidth / canvasAspectRatio;
            } else {
                renderHeight = pdfHeight;
                renderWidth = pdfHeight * canvasAspectRatio;
            }

            // Center the image on the page
            const xOffset = (pdfWidth - renderWidth) / 2;
            const yOffset = (pdfHeight - renderHeight) / 2;

            pdf.addImage(imgData, 'PNG', xOffset, yOffset, renderWidth, renderHeight);
            pdf.save(`${request.documentType.replace(/ /g, '_')}-${resident.lastName}.pdf`);
            
            if (request.status !== 'Released') {
                updateDocumentRequestStatus(request.id, 'Released');
                toast({
                    title: "Document Released",
                    description: "The request status has been updated to 'Released'."
                });
            }
        });
    }
  };


  const getAge = (birthdate: string) => {
    const today = new Date();
    const birthDate = new Date(birthdate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
  };

  return (
    <>
        <div className="p-4 sm:p-6 md:p-8 space-y-4 bg-background no-print">
            <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2"/>
                Back
            </Button>
            <h1 className="text-2xl font-bold font-headline">Certificate Preview</h1>
            <p className="text-muted-foreground">This is a preview of the certificate. Click the download button to get a PDF copy.</p>
        </div>
        <div className="bg-white text-black max-w-4xl mx-auto p-10 border-4 border-primary shadow-2xl my-8 print:shadow-none print:border-none print:my-0 print:mx-0 print:max-w-full print:p-0 relative" id="certificate">
            <div className="absolute inset-0 flex items-center justify-center z-0 opacity-10">
                <Logo className="size-[400px]" />
            </div>
            <div className="relative z-10">
                <header className="text-center space-y-4">
                    <div className="flex justify-center items-center gap-4">
                        <Logo className="size-20" />
                        <div>
                            <p className="text-lg">Republic of the Philippines</p>
                            <p className="text-lg">Bongabong, Oriental Mindoro</p>
                            <h1 className="text-3xl font-bold">Barangay Mina De Oro</h1>
                        </div>
                        <div className="w-20"></div>
                    </div>
                    <Separator className="bg-primary h-1 my-4"/>
                    <h2 className="text-4xl font-headline font-bold uppercase tracking-widest">{request.documentType}</h2>
                </header>

                <main className="mt-12 text-lg leading-relaxed space-y-8">
                    <p className="font-semibold">TO WHOM IT MAY CONCERN:</p>
                    <p className="indent-8">
                        This is to certify that <span className="font-bold uppercase">{resident.firstName} {resident.lastName}</span>,
                        <span className="font-bold">{getAge(resident.birthdate)}</span> years old, is a bonafide resident of 
                        <span className="font-bold"> {resident.address}.</span>
                    </p>
                    
                    {request.documentType === 'Barangay Clearance' && (
                        <p className="indent-8">
                            This certification is being issued upon the request of the above-named person for whatever legal purpose it may serve. He/She is a person of good moral character and has no derogatory record on file in this office.
                        </p>
                    )}

                    {request.documentType === 'Certificate of Residency' && (
                        <p className="indent-8">
                            This certifies that the person whose name appears above has been a resident of this barangay for a period of time and is known to be of good moral character.
                        </p>
                    )}

                    {request.documentType === 'Certificate of Indigency' && (
                         <p className="indent-8">
                            This is to certify that the person whose name appears hereon is one of the bonafide residents of this barangay and that he/she belongs to an indigent family.
                        </p>
                    )}

                    {request.documentType === 'Business Permit' && (
                         <p className="indent-8">
                            This is to certify that a business under the name of the above person is operating within the jurisdiction of this barangay and has been granted this permit.
                        </p>
                    )}

                    {request.documentType === 'Good Moral Character Certificate' && (
                         <p className="indent-8">
                            This is to certify that the person named above is a resident of this barangay and is known to me to be of good moral character and a law-abiding citizen.
                        </p>
                    )}

                    {request.documentType === 'Solo Parent Certificate' && (
                         <p className="indent-8">
                            This is to certify that the person named above is a solo parent residing in this barangay, and is entitled to the benefits under Republic Act No. 8972, also known as the "Solo Parents' Welfare Act of 2000".
                        </p>
                    )}

                    <p className="indent-8">
                        Issued this <span className="font-bold">{new Date().toLocaleDateString('en-US', { day: 'numeric' })}</span> day of <span className="font-bold">{new Date().toLocaleDateString('en-US', { month: 'long' })}</span>, <span className="font-bold">{new Date().getFullYear()}</span> at the Office of the Punong Barangay, Barangay Mina De Oro, Bongabong, Oriental Mindoro, Philippines.
                    </p>
                </main>

                <footer className="mt-24 flex justify-end">
                    <div className="text-center w-64">
                         <div className="h-20 mb-4">
                            {/* Signature was here */}
                        </div>
                        <p className="font-bold uppercase border-t-2 border-black pt-2">AMADO MAGTIBAY</p>
                        <p>Punong Barangay</p>
                    </div>
                </footer>
            </div>
             <div className="absolute bottom-8 right-8 no-print no-print-capture z-20">
                <Button onClick={handleDownload} size="lg">
                    <Download className="mr-2" /> Download as PDF
                </Button>
            </div>
             <p className="absolute bottom-8 left-8 text-xs text-gray-400 no-print no-print-capture z-20">
                Tracking No: {request.trackingNumber} | Not a valid document without the official barangay seal.
            </p>
        </div>
    </>
  );
}

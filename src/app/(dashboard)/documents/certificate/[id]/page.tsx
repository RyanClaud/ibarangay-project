'use client';

import { useParams, notFound, useRouter } from "next/navigation";
import { useAppContext } from "@/contexts/app-context";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";
import { Logo } from "@/components/logo";
import { Separator } from "@/components/ui/separator";

export default function CertificatePage() {
  const { id } = useParams();
  const { documentRequests, residents } = useAppContext();
  const router = useRouter();

  const request = documentRequests.find(r => r.id === id);
  if (!request) {
    return notFound();
  }
  const resident = residents.find(r => r.id === request.residentId);
  if (!resident) {
    return notFound();
  }

  const handlePrint = () => {
    window.print();
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
        <div className="p-4 sm:p-6 md:p-8 space-y-4 bg-background print:hidden">
            <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2"/>
                Back
            </Button>
            <h1 className="text-2xl font-bold font-headline">Certificate Preview</h1>
            <p className="text-muted-foreground">This is a preview of the certificate. Click the print button to get a physical copy.</p>
        </div>
        <div className="bg-white text-black max-w-4xl mx-auto p-10 border-4 border-primary shadow-2xl my-8 print:shadow-none print:border-none print:my-0" id="certificate">
            <header className="text-center space-y-4">
                <div className="flex justify-center items-center gap-4">
                    <Logo className="size-20" />
                    <div>
                        <p className="text-lg">Republic of the Philippines</p>
                        <p className="text-lg">City of Manila</p>
                        <h1 className="text-3xl font-bold">Barangay 1, District 1</h1>
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
                    <span className="font-bold"> {resident.address}, City of Manila.</span>
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
                    Issued this <span className="font-bold">{new Date().toLocaleDateString('en-US', { day: 'numeric' })}</span> day of <span className="font-bold">{new Date().toLocaleDateString('en-US', { month: 'long' })}</span>, <span className="font-bold">{new Date().getFullYear()}</span> at the Office of the Punong Barangay, Barangay 1, District 1, City of Manila, Philippines.
                </p>
            </main>

            <footer className="mt-24 flex justify-end">
                <div className="text-center w-64">
                    <p className="font-bold uppercase border-t-2 border-black pt-2">Juan Dela Cruz</p>
                    <p>Punong Barangay</p>
                </div>
            </footer>
             <div className="absolute bottom-8 right-8 print:hidden">
                <Button onClick={handlePrint} size="lg">
                    <Printer className="mr-2" /> Print Certificate
                </Button>
            </div>
             <p className="absolute bottom-8 left-8 text-xs text-gray-400 print:hidden">
                Tracking No: {request.trackingNumber} | Not a valid document without the official barangay seal.
            </p>
        </div>
    </>
  );
}

// Letters & Documents - Offer Letter, Appointment Letter & Confirmation Letter System
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { BackButton } from "../ui/back-button";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { FileText, FileCheck, UserCheck, Info, X } from "lucide-react";
import { OfferLetterGenerator } from "./OfferLetterGenerator";
import { AppointmentLetterGenerator } from "./AppointmentLetterGenerator";
import { ConfirmationLetterSystem } from "./ConfirmationLetterSystem";

const INFO_BANNER_DISMISSED_KEY = "letters_documents_info_banner_dismissed";

export function LettersDocuments() {
  const [showInfoBanner, setShowInfoBanner] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem(INFO_BANNER_DISMISSED_KEY);
    if (!dismissed) {
      setShowInfoBanner(true);
    }
  }, []);

  const handleDismissBanner = () => {
    sessionStorage.setItem(INFO_BANNER_DISMISSED_KEY, "true");
    setShowInfoBanner(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Letters & Documents</h2>
          <p className="text-gray-600">Complete employee letter lifecycle management system</p>
        </div>
        <BackButton />
      </div>

      {/* Info Banner */}
      {showInfoBanner && (
        <Card className="border-2 border-blue-300 bg-blue-50">
          <CardContent className="p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <p className="text-sm text-blue-900">
                  All three tabs share the same employee data — offers accepted here appear automatically in the Appointment Letter tab.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismissBanner}
                className="h-6 w-6 p-0 hover:bg-blue-100"
              >
                <X className="w-4 h-4 text-blue-700" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="offer" className="space-y-6">
        <TabsList>
          <TabsTrigger value="offer">
            <FileText className="w-4 h-4 mr-2" />
            Offer Letter
          </TabsTrigger>
          <TabsTrigger value="appointment">
            <FileCheck className="w-4 h-4 mr-2" />
            Appointment Letter
          </TabsTrigger>
          <TabsTrigger value="confirmation">
            <UserCheck className="w-4 h-4 mr-2" />
            Confirmation Letter
          </TabsTrigger>
        </TabsList>

        {/* UNIFIED OFFER LETTER SYSTEM */}
        <TabsContent value="offer" className="space-y-6">
          <OfferLetterGenerator />
        </TabsContent>

        {/* APPOINTMENT LETTER */}
        <TabsContent value="appointment" className="space-y-6">
          <AppointmentLetterGenerator />
        </TabsContent>

        {/* CONFIRMATION LETTER SYSTEM */}
        <TabsContent value="confirmation" className="space-y-6">
          <ConfirmationLetterSystem />
        </TabsContent>
      </Tabs>
    </div>
  );
}
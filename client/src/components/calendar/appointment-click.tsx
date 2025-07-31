import { useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { AppointmentDetail } from "@/components/appointments/appointment-detail";

interface AppointmentClickHandlerProps {
  children: React.ReactNode;
  appointmentId: string;
}

export function AppointmentClickHandler({ children, appointmentId }: AppointmentClickHandlerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      <div onClick={handleClick} className="cursor-pointer">
        {children}
      </div>
      
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent className="w-[350px] sm:w-[450px] lg:w-[600px] overflow-y-auto h-full">
          {isOpen && (
            <AppointmentDetail
              appointmentId={appointmentId}
              onClose={handleClose}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
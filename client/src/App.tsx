import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/auth-context";
import { ThemeProvider } from "@/context/theme-context";
import { Sidebar } from "@/components/layout/sidebar";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import ResetPassword from "@/pages/reset-password";
import Dashboard from "@/pages/dashboard";
import Patients from "@/pages/patients";
import Calendar from "@/pages/calendar";
import Appointments from "@/pages/appointments";
import ClinicalNotes from "@/pages/clinical-notes";
import Billing from "@/pages/billing";
import Messages from "@/pages/messages";
import Reports from "@/pages/reports";
import Telehealth from "@/pages/telehealth";
import Settings from "@/pages/settings";
import PatientPortal from "@/pages/patient-portal";
import PublicBooking from "@/pages/public-booking";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div 
      className="min-h-screen flex transition-colors duration-300"
      style={{ 
        backgroundColor: `hsl(var(--background))`,
        color: `hsl(var(--foreground))`
      }}
    >
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      
      {/* Mobile Menu */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden fixed top-4 left-4 z-50 shadow-sm transition-colors duration-300"
            style={{
              backgroundColor: `hsl(var(--card))`,
              color: `hsl(var(--card-foreground))`
            }}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <Sidebar isMobile={true} />
        </SheetContent>
      </Sheet>
      
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}

function Router() {
  const { user } = useAuth();
  
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/reset-password" component={ResetPassword} />
      
      {/* Public booking route - no authentication required */}
      <Route path="/book/:bookingLink">
        {({ bookingLink }: { bookingLink: string }) => (
          <PublicBooking bookingLink={bookingLink} />
        )}
      </Route>
      
      <Route path="/patient-portal">
        <ProtectedRoute>
          <PatientPortal />
        </ProtectedRoute>
      </Route>
      <Route path="/">
        <ProtectedRoute>
          {user?.role === 'patient' ? <PatientPortal /> : <Dashboard />}
        </ProtectedRoute>
      </Route>
      <Route path="/patients">
        <ProtectedRoute>
          <Patients />
        </ProtectedRoute>
      </Route>
      <Route path="/calendar">
        <ProtectedRoute>
          <Calendar />
        </ProtectedRoute>
      </Route>
      <Route path="/appointments">
        <ProtectedRoute>
          <Appointments />
        </ProtectedRoute>
      </Route>
      <Route path="/clinical-notes">
        <ProtectedRoute>
          <ClinicalNotes />
        </ProtectedRoute>
      </Route>
      <Route path="/telehealth">
        <ProtectedRoute>
          <Telehealth />
        </ProtectedRoute>
      </Route>
      <Route path="/billing">
        <ProtectedRoute>
          <Billing />
        </ProtectedRoute>
      </Route>
      <Route path="/messages">
        <ProtectedRoute>
          <Messages />
        </ProtectedRoute>
      </Route>
      <Route path="/reports">
        <ProtectedRoute>
          <Reports />
        </ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

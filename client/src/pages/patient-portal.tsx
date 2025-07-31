import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  Clock, 
  CreditCard, 
  FileText, 
  MessageSquare, 
  Pill, 
  User, 
  Heart,
  Activity,
  Phone,
  Mail,
  MapPin,
  AlertCircle,
  CheckCircle,
  Video
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/context/auth-context';
import Header from '@/components/layout/header';
import PatientAppointments from '@/components/patient-portal/patient-appointments';
import PatientMedicalRecords from '@/components/patient-portal/patient-medical-records';
import PatientMessages from '@/components/patient-portal/patient-messages';
import PatientBilling from '@/components/patient-portal/patient-billing';
import PatientProfile from '@/components/patient-portal/patient-profile';

export default function PatientPortal() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch patient data
  const { data: patientData, isLoading } = useQuery({
    queryKey: ['/api/patient/dashboard'],
    enabled: !!user && user.role === 'patient'
  });

  const { data: upcomingAppointments } = useQuery({
    queryKey: ['/api/patient/appointments/upcoming'],
    enabled: !!user && user.role === 'patient'
  });

  const { data: recentResults } = useQuery({
    queryKey: ['/api/patient/test-results/recent'],
    enabled: !!user && user.role === 'patient'
  });

  const { data: unreadMessages } = useQuery({
    queryKey: ['/api/patient/messages/unread'],
    enabled: !!user && user.role === 'patient'
  });

  const { data: unpaidInvoices } = useQuery({
    queryKey: ['/api/patient/invoices/unpaid'],
    enabled: !!user && user.role === 'patient'
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Activity className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading your health portal...</p>
        </div>
      </div>
    );
  }

  const patient = patientData?.patient;
  
  return (
    <div className="flex flex-col h-full">
      <Header 
        title="My Health Portal" 
        subtitle={`Welcome back, ${user?.firstName}! Manage your healthcare journey.`}
      />
      
      <div className="flex-1 overflow-auto p-4 lg:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-flex">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="appointments" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Appointments</span>
            </TabsTrigger>
            <TabsTrigger value="records" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Records</span>
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Messages</span>
              {unreadMessages?.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 text-xs">
                  {unreadMessages.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              <span className="hidden sm:inline">Billing</span>
              {unpaidInvoices?.length > 0 && (
                <Badge variant="outline" className="ml-1 h-5 w-5 p-0 text-xs">
                  {unpaidInvoices.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Welcome Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-2xl">
                      Welcome, {user?.firstName}!
                    </CardTitle>
                    <CardDescription className="text-base">
                      Your health information and appointments in one place
                    </CardDescription>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <p>Patient ID: {patient?.id?.slice(-8)}</p>
                    <p>Last login: {user?.lastLoginAt ? format(new Date(user.lastLoginAt), 'MMM dd, hh:mm a') : 'First time'}</p>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="text-2xl font-bold">{upcomingAppointments?.length || 0}</p>
                      <p className="text-sm text-muted-foreground">Upcoming</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="text-2xl font-bold">{unreadMessages?.length || 0}</p>
                      <p className="text-sm text-muted-foreground">New Messages</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-8 w-8 text-purple-600" />
                    <div>
                      <p className="text-2xl font-bold">{recentResults?.length || 0}</p>
                      <p className="text-sm text-muted-foreground">New Results</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-8 w-8 text-orange-600" />
                    <div>
                      <p className="text-2xl font-bold">{unpaidInvoices?.length || 0}</p>
                      <p className="text-sm text-muted-foreground">Pending Bills</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Action Items */}
            {(upcomingAppointments?.length > 0 || unreadMessages?.length > 0 || unpaidInvoices?.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                    Action Items
                  </CardTitle>
                  <CardDescription>
                    Items that need your attention
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {upcomingAppointments?.slice(0, 2).map((appointment: any) => (
                    <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="font-medium">{appointment.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(appointment.appointmentDate), 'MMM dd, yyyy at hh:mm a')}
                          </p>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => setActiveTab('appointments')}>
                        View Details
                      </Button>
                    </div>
                  ))}

                  {unreadMessages?.slice(0, 2).map((message: any) => (
                    <div key={message.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="font-medium">{message.subject}</p>
                          <p className="text-sm text-muted-foreground">
                            From: {message.senderName}
                          </p>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => setActiveTab('messages')}>
                        Read Message
                      </Button>
                    </div>
                  ))}

                  {unpaidInvoices?.slice(0, 2).map((invoice: any) => (
                    <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-5 h-5 text-orange-600" />
                        <div>
                          <p className="font-medium">Invoice #{invoice.invoiceNumber}</p>
                          <p className="text-sm text-muted-foreground">
                            Amount: ${Number(invoice.total).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => setActiveTab('billing')}>
                        Pay Now
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Health Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Current Medications */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Pill className="w-5 h-5" />
                    Current Medications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {patient?.medications?.length > 0 ? (
                    <div className="space-y-2">
                      {patient.medications.slice(0, 3).map((medication: string, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <span className="font-medium">{medication}</span>
                          <Badge variant="outline">Active</Badge>
                        </div>
                      ))}
                      {patient.medications.length > 3 && (
                        <Button variant="ghost" size="sm" onClick={() => setActiveTab('profile')}>
                          View all {patient.medications.length} medications
                        </Button>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic">No current medications</p>
                  )}
                </CardContent>
              </Card>

              {/* Allergies */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Allergies & Medical Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {patient?.allergies?.length > 0 ? (
                    <div className="space-y-2">
                      {patient.allergies.slice(0, 3).map((allergy: string, index: number) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded">
                          <AlertCircle className="w-4 h-4 text-red-600" />
                          <span className="font-medium text-red-800">{allergy}</span>
                        </div>
                      ))}
                      {patient.allergies.length > 3 && (
                        <Button variant="ghost" size="sm" onClick={() => setActiveTab('profile')}>
                          View all {patient.allergies.length} allergies
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-green-800">No known allergies</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="appointments">
            <PatientAppointments />
          </TabsContent>

          <TabsContent value="records">
            <PatientMedicalRecords />
          </TabsContent>

          <TabsContent value="messages">
            <PatientMessages />
          </TabsContent>

          <TabsContent value="billing">
            <PatientBilling />
          </TabsContent>

          <TabsContent value="profile">
            <PatientProfile patient={patient} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
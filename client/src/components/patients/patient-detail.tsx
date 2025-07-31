import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin, 
  Heart, 
  AlertTriangle, 
  Pill,
  Shield,
  Edit,
  ArrowLeft
} from "lucide-react";
import { format } from "date-fns";

interface PatientDetailProps {
  patient: any;
  onEdit: () => void;
  onBack: () => void;
}

export function PatientDetail({ patient, onEdit, onBack }: PatientDetailProps) {
  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return "N/A";
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const getPatientInitials = () => {
    const firstName = patient?.user?.firstName || "";
    const lastName = patient?.user?.lastName || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Patients
          </Button>
        </div>
        <Button onClick={onEdit}>
          <Edit className="w-4 h-4 mr-2" />
          Edit Patient
        </Button>
      </div>

      {/* Patient Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground font-medium text-lg">
                {getPatientInitials()}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <CardTitle className="text-2xl">
                  {patient.user?.firstName} {patient.user?.lastName}
                </CardTitle>
                {patient.user?.isActive && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Active
                  </Badge>
                )}
              </div>
              <p className="text-slate-600 mt-1">
                Patient ID: {patient.id}
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-slate-600">Age</p>
                <p className="text-base">{calculateAge(patient.dateOfBirth)} years old</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Gender</p>
                <p className="text-base capitalize">{patient.gender || "Not specified"}</p>
              </div>
            </div>
            
            {patient.dateOfBirth && (
              <div>
                <p className="text-sm font-medium text-slate-600 flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  Date of Birth
                </p>
                <p className="text-base">{format(new Date(patient.dateOfBirth), "MMMM dd, yyyy")}</p>
              </div>
            )}

            <Separator />

            <div className="space-y-3">
              {patient.user?.email && (
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-slate-500" />
                  <span className="text-base">{patient.user.email}</span>
                </div>
              )}
              
              {patient.user?.phone && (
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-slate-500" />
                  <span className="text-base">{patient.user.phone}</span>
                </div>
              )}
              
              {patient.address && (
                <div className="flex items-start space-x-2">
                  <MapPin className="w-4 h-4 text-slate-500 mt-0.5" />
                  <span className="text-base">{patient.address}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact & Insurance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Emergency & Insurance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(patient.emergencyContact || patient.emergencyPhone) && (
              <div>
                <p className="text-sm font-medium text-slate-600 mb-2">Emergency Contact</p>
                <div className="space-y-2">
                  {patient.emergencyContact && (
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-slate-500" />
                      <span className="text-base">{patient.emergencyContact}</span>
                    </div>
                  )}
                  {patient.emergencyPhone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-slate-500" />
                      <span className="text-base">{patient.emergencyPhone}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(patient.insuranceProvider || patient.insuranceNumber) && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-2">Insurance Information</p>
                  <div className="space-y-2">
                    {patient.insuranceProvider && (
                      <div>
                        <p className="text-xs text-slate-500">Provider</p>
                        <p className="text-base">{patient.insuranceProvider}</p>
                      </div>
                    )}
                    {patient.insuranceNumber && (
                      <div>
                        <p className="text-xs text-slate-500">Policy Number</p>
                        <p className="text-base font-mono">{patient.insuranceNumber}</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Medical History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Heart className="w-5 h-5 mr-2" />
              Medical History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {patient.medicalHistory && patient.medicalHistory.length > 0 ? (
              <ul className="space-y-2">
                {patient.medicalHistory.map((item: string, index: number) => (
                  <li key={index} className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-slate-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-base">{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-500 italic">No medical history recorded</p>
            )}
          </CardContent>
        </Card>

        {/* Allergies */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Allergies
            </CardTitle>
          </CardHeader>
          <CardContent>
            {patient.allergies && patient.allergies.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {patient.allergies.map((allergy: string, index: number) => (
                  <Badge key={index} variant="destructive" className="bg-red-100 text-red-800">
                    {allergy}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 italic">No known allergies</p>
            )}
          </CardContent>
        </Card>

        {/* Current Medications */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Pill className="w-5 h-5 mr-2" />
              Current Medications
            </CardTitle>
          </CardHeader>
          <CardContent>
            {patient.medications && patient.medications.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {patient.medications.map((medication: string, index: number) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <p className="font-medium">{medication}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 italic">No current medications</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Registration Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between text-sm text-slate-500">
            <span>Patient registered: {format(new Date(patient.createdAt), "MMMM dd, yyyy 'at' hh:mm a")}</span>
            <span>Last updated: {format(new Date(patient.updatedAt), "MMMM dd, yyyy 'at' hh:mm a")}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
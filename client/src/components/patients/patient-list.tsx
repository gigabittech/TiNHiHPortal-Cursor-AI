import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Eye, Edit, Phone, Mail } from "lucide-react";
import { format } from "date-fns";

interface PatientListProps {
  onNewPatient: () => void;
  onEditPatient: (patient: any) => void;
  onViewPatient: (patient: any) => void;
}

export function PatientList({ onNewPatient, onEditPatient, onViewPatient }: PatientListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);
  const limit = 20;

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(0); // Reset to first page when searching
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: patientsData, isLoading } = useQuery({
    queryKey: ["/api/patients", { limit, offset: page * limit, search: debouncedSearch }],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: (page * limit).toString(),
        ...(debouncedSearch && { search: debouncedSearch }),
      });
      const response = await fetch(`/api/patients?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch patients");
      const data = await response.json();
      return {
        patients: Array.isArray(data) ? data : [],
        total: Array.isArray(data) ? data.length : 0,
        hasMore: Array.isArray(data) ? data.length === limit : false
      };
    },
  });

  const patients = patientsData?.patients || [];
  const hasMore = patientsData?.hasMore || false;

  const getPatientInitials = (patient: any) => {
    const firstName = patient?.user?.firstName || "";
    const lastName = patient?.user?.lastName || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

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

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-4 p-4 border rounded-lg">
                  <div className="w-12 h-12 bg-slate-300 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-300 rounded w-1/3"></div>
                    <div className="h-3 bg-slate-300 rounded w-1/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Patients</CardTitle>
          <Button onClick={onNewPatient}>
            <Plus className="w-4 h-4 mr-2" />
            New Patient
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder="Search patients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        {patients && patients.length > 0 ? (
          <div className="space-y-4">
            {patients.map((patient: any) => (
              <div key={patient.id} className="flex items-center space-x-4 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground font-medium text-sm">
                    {getPatientInitials(patient)}
                  </span>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-medium text-slate-900">
                      {patient.user?.firstName} {patient.user?.lastName}
                    </h3>
                    {patient.user?.isActive && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Active
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-slate-600 mt-1">
                    <span>Age: {calculateAge(patient.dateOfBirth)}</span>
                    {patient.gender && <span>• {patient.gender}</span>}
                    {patient.user?.email && (
                      <div className="flex items-center">
                        <Mail className="w-3 h-3 mr-1" />
                        {patient.user.email}
                      </div>
                    )}
                    {patient.user?.phone && (
                      <div className="flex items-center">
                        <Phone className="w-3 h-3 mr-1" />
                        {patient.user.phone}
                      </div>
                    )}
                  </div>
                  
                  {patient.insuranceProvider && (
                    <p className="text-sm text-slate-500 mt-1">
                      Insurance: {patient.insuranceProvider}
                    </p>
                  )}
                  
                  <p className="text-xs text-slate-400 mt-1">
                    Registered: {format(new Date(patient.createdAt), "MMM dd, yyyy")}
                  </p>
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onViewPatient(patient)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onEditPatient(patient)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            <div className="flex justify-between items-center pt-4">
              <Button 
                variant="outline" 
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
              >
                Previous
              </Button>
              <span className="text-sm text-slate-600">
                Page {page + 1}
              </span>
              <Button 
                variant="outline"
                onClick={() => setPage(page + 1)}
                disabled={!patients || patients.length < limit}
              >
                Next
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No patients found</h3>
            <p className="text-slate-600 mb-4">
              {debouncedSearch ? "Try adjusting your search terms" : "Get started by adding your first patient"}
            </p>
            <Button onClick={onNewPatient}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Patient
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

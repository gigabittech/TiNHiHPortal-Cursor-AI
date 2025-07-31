import { useState } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/layout/header";
import { PatientList } from "@/components/patients/patient-list";
import { PatientForm } from "@/components/patients/patient-form";
import { PatientDetail } from "@/components/patients/patient-detail";

export default function Patients() {
  const [location, setLocation] = useLocation();
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  // Check if we should show the form based on URL params
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const action = urlParams.get('action');

  const handleNewPatient = () => {
    setSelectedPatient(null);
    setShowForm(true);
    setLocation('/patients?action=new');
  };

  const handleEditPatient = (patient: any) => {
    setSelectedPatient(patient);
    setShowForm(true);
    setLocation(`/patients?action=edit&id=${patient.id}`);
  };

  const handleViewPatient = (patient: any) => {
    setSelectedPatient(patient);
    setShowDetail(true);
    setLocation(`/patients?action=view&id=${patient.id}`);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setShowDetail(false);
    setSelectedPatient(null);
    setLocation('/patients');
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setShowDetail(false);
    setSelectedPatient(null);
    setLocation('/patients');
  };

  const handleEditFromDetail = () => {
    setShowDetail(false);
    setShowForm(true);
    setLocation(`/patients?action=edit&id=${selectedPatient.id}`);
  };

  const handleBackFromDetail = () => {
    setShowDetail(false);
    setSelectedPatient(null);
    setLocation('/patients');
  };

  // Show detail view if action is view
  if (action === 'view' || showDetail) {
    return (
      <div className="flex flex-col h-full">
        <Header 
          title="Patient Details"
          subtitle={selectedPatient ? `${selectedPatient.user?.firstName} ${selectedPatient.user?.lastName}` : "Patient Information"}
        />
        
        <div className="flex-1 overflow-auto p-4 lg:p-6">
          <PatientDetail
            patient={selectedPatient}
            onEdit={handleEditFromDetail}
            onBack={handleBackFromDetail}
          />
        </div>
      </div>
    );
  }

  // Show form if action is specified or showForm is true
  if (action === 'new' || action === 'edit' || showForm) {
    return (
      <div className="flex flex-col h-full">
        <Header 
          title={selectedPatient ? "Edit Patient" : "New Patient"}
          subtitle={selectedPatient ? `Editing ${selectedPatient.user?.firstName} ${selectedPatient.user?.lastName}` : "Add a new patient to your practice"}
        />
        
        <div className="flex-1 overflow-auto p-4 lg:p-6">
          <PatientForm
            patient={selectedPatient}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Header 
        title="Patients" 
        subtitle="Manage your patient records and information"
        onQuickAction={handleNewPatient}
        quickActionLabel="New Patient"
      />
      
      <div className="flex-1 overflow-auto p-4 lg:p-6">
        <PatientList
          onNewPatient={handleNewPatient}
          onEditPatient={handleEditPatient}
          onViewPatient={handleViewPatient}
        />
      </div>
    </div>
  );
}

import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { SoapNotesForm } from "@/components/clinical/soap-notes-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader } from "@/components/ui/dialog";
import { Plus, FileText, Search, Edit, Eye } from "lucide-react";
import { api } from "@/lib/api";
import { format } from "date-fns";

export default function ClinicalNotes() {
  const [location, setLocation] = useLocation();
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState<any>(null);
  const [viewingNote, setViewingNote] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const action = urlParams.get('action');

  // Fetch clinical notes
  const { data: clinicalNotes, isLoading } = useQuery({
    queryKey: ["/api/clinical-notes", searchTerm, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      params.append("limit", "10");
      params.append("offset", ((currentPage - 1) * 10).toString());
      
      const response = await api.get(`/api/clinical-notes?${params.toString()}`);
      return response;
    },
  });

  const handleNewNote = () => {
    setShowForm(true);
    setEditingNote(null);
    setLocation('/clinical-notes?action=new');
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingNote(null);
    setLocation('/clinical-notes');
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingNote(null);
    setLocation('/clinical-notes');
  };

  const handleEditNote = (note: any) => {
    setEditingNote(note);
    setShowForm(true);
    setLocation('/clinical-notes?action=edit');
  };

  const handleViewNote = (note: any) => {
    setViewingNote(note);
  };

  if (action === 'new' || action === 'edit' || showForm) {
    return (
      <div className="flex flex-col h-full">
        <Header 
          title={editingNote ? "Edit Clinical Note" : "New Clinical Note"}
          subtitle="Document patient consultation and treatment"
        />
        
        <div className="flex-1 overflow-auto p-6">
          <SoapNotesForm
            note={editingNote}
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
        title="Clinical Notes" 
        subtitle="Review and create clinical documentation"
        onQuickAction={handleNewNote}
        quickActionLabel="New Note"
      />
      
      <div className="flex-1 overflow-auto p-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Clinical Notes</CardTitle>
              <Button onClick={handleNewNote}>
                <Plus className="w-4 h-4 mr-2" />
                New Note
              </Button>
            </div>
            
            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mx-auto"></div>
                <p className="text-slate-600 mt-2">Loading clinical notes...</p>
              </div>
            ) : !clinicalNotes || clinicalNotes.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No clinical notes yet</h3>
                <p className="text-slate-600 mb-4">Start documenting patient consultations and treatments</p>
                <Button onClick={handleNewNote}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Note
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {clinicalNotes.map((note: any) => (
                  <div key={note.id} className="border rounded-lg p-4 hover:bg-slate-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium text-slate-900">{note.title}</h3>
                          {note.appointment && (
                            <Badge variant="secondary" className="text-xs">
                              Linked to Appointment
                            </Badge>
                          )}
                        </div>
                        
                        <div className="text-sm text-slate-600 mb-2">
                          <span className="font-medium">Patient:</span> {note.patient?.user?.firstName} {note.patient?.user?.lastName}
                          <span className="mx-2">•</span>
                          <span className="font-medium">Practitioner:</span> Dr. {note.practitioner?.user?.firstName} {note.practitioner?.user?.lastName}
                        </div>
                        
                        <div className="text-sm text-slate-500">
                          {format(new Date(note.createdAt), "MMM dd, yyyy 'at' h:mm a")}
                        </div>
                        
                        {note.subjective && (
                          <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                            <span className="font-medium">S:</span> {note.subjective.substring(0, 100)}...
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewNote(note)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditNote(note)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* View Note Dialog */}
        <Dialog open={!!viewingNote} onOpenChange={(open) => !open && setViewingNote(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{viewingNote?.title}</DialogTitle>
              <DialogDescription>
                Clinical note created on {viewingNote && format(new Date(viewingNote.createdAt), "MMM dd, yyyy 'at' h:mm a")}
              </DialogDescription>
            </DialogHeader>
            
            {viewingNote && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Patient:</span> {viewingNote.patient?.user?.firstName} {viewingNote.patient?.user?.lastName}
                  </div>
                  <div>
                    <span className="font-medium">Practitioner:</span> Dr. {viewingNote.practitioner?.user?.firstName} {viewingNote.practitioner?.user?.lastName}
                  </div>
                </div>
                
                {viewingNote.appointment && (
                  <div className="text-sm">
                    <span className="font-medium">Related Appointment:</span> {viewingNote.appointment.title}
                  </div>
                )}
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-slate-900 mb-2">Subjective</h4>
                    <p className="text-slate-700 whitespace-pre-wrap">{viewingNote.subjective}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-slate-900 mb-2">Objective</h4>
                    <p className="text-slate-700 whitespace-pre-wrap">{viewingNote.objective}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-slate-900 mb-2">Assessment</h4>
                    <p className="text-slate-700 whitespace-pre-wrap">{viewingNote.assessment}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-slate-900 mb-2">Plan</h4>
                    <p className="text-slate-700 whitespace-pre-wrap">{viewingNote.plan}</p>
                  </div>
                  
                  {viewingNote.additionalNotes && (
                    <div>
                      <h4 className="font-medium text-slate-900 mb-2">Additional Notes</h4>
                      <p className="text-slate-700 whitespace-pre-wrap">{viewingNote.additionalNotes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText, Download, Eye, Calendar, User, Activity } from 'lucide-react';
import { format } from 'date-fns';

export default function PatientMedicalRecords() {
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  const { data: medicalRecords, isLoading } = useQuery({
    queryKey: ['/api/patient/medical-records'],
  });

  const { data: testResults } = useQuery({
    queryKey: ['/api/patient/test-results'],
  });

  const { data: clinicalNotes } = useQuery({
    queryKey: ['/api/patient/clinical-notes'],
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Medical Records</h2>
        <p className="text-muted-foreground">Access your medical history, test results, and clinical notes</p>
      </div>

      {/* Clinical Notes */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Recent Clinical Notes</h3>
        {clinicalNotes?.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No clinical notes available</p>
            </CardContent>
          </Card>
        ) : (
          clinicalNotes?.slice(0, 5).map((note: any) => (
            <Card key={note.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">{note.title}</h4>
                      <Badge variant="outline">Clinical Note</Badge>
                    </div>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(note.createdAt), 'MMM dd, yyyy')}
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Dr. {note.practitioner?.user?.firstName} {note.practitioner?.user?.lastName}
                      </div>
                      {note.subjective && (
                        <p className="mt-2">{note.subjective.substring(0, 100)}...</p>
                      )}
                    </div>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{note.title}</DialogTitle>
                        <DialogDescription>
                          Clinical note from {format(new Date(note.createdAt), 'MMMM dd, yyyy')}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-6">
                        {note.subjective && (
                          <div>
                            <h4 className="font-semibold mb-2">Subjective</h4>
                            <p className="text-sm">{note.subjective}</p>
                          </div>
                        )}
                        {note.objective && (
                          <div>
                            <h4 className="font-semibold mb-2">Objective</h4>
                            <p className="text-sm">{note.objective}</p>
                          </div>
                        )}
                        {note.assessment && (
                          <div>
                            <h4 className="font-semibold mb-2">Assessment</h4>
                            <p className="text-sm">{note.assessment}</p>
                          </div>
                        )}
                        {note.plan && (
                          <div>
                            <h4 className="font-semibold mb-2">Plan</h4>
                            <p className="text-sm">{note.plan}</p>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Test Results */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Test Results</h3>
        {testResults?.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No test results available</p>
            </CardContent>
          </Card>
        ) : (
          testResults?.slice(0, 5).map((result: any) => (
            <Card key={result.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">{result.testName}</h4>
                      <Badge variant={result.status === 'normal' ? 'default' : 'destructive'}>
                        {result.status}
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(result.testDate), 'MMM dd, yyyy')}
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {result.orderedBy}
                      </div>
                      {result.value && (
                        <p className="mt-2">Result: {result.value} {result.unit}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Document Library */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Document Library</h3>
        {medicalRecords?.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No documents available</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {medicalRecords?.map((doc: any) => (
              <Card key={doc.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-primary" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{doc.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(doc.createdAt), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
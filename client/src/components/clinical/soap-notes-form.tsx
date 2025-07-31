import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { useAuth } from "@/context/auth-context";

const soapNotesSchema = z.object({
  patientId: z.string().min(1, "Patient is required"),
  practitionerId: z.string().min(1, "Practitioner is required"),
  appointmentId: z.string().optional().nullable(),
  title: z.string().min(1, "Title is required"),
  subjective: z.string().min(1, "Subjective section is required"),
  objective: z.string().min(1, "Objective section is required"),
  assessment: z.string().min(1, "Assessment section is required"),
  plan: z.string().min(1, "Plan section is required"),
  additionalNotes: z.string().optional(),
});

type SoapNotesFormData = z.infer<typeof soapNotesSchema>;

interface SoapNotesFormProps {
  note?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function SoapNotesForm({ note, onSuccess, onCancel }: SoapNotesFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isEditing = !!note;

  const form = useForm<SoapNotesFormData>({
    resolver: zodResolver(soapNotesSchema),
    defaultValues: {
      patientId: note?.patientId || "",
      practitionerId: note?.practitionerId || "",
      appointmentId: note?.appointmentId || "",
      title: note?.title || "",
      subjective: note?.subjective || "",
      objective: note?.objective || "",
      assessment: note?.assessment || "",
      plan: note?.plan || "",
      additionalNotes: note?.additionalNotes || "",
    },
  });

  // Fetch patients for selection
  const { data: patients } = useQuery({
    queryKey: ["/api/patients"],
    queryFn: async () => {
      const response = await api.get("/api/patients?limit=100");
      return response;
    },
  });

  // Fetch practitioners for selection
  const { data: practitioners } = useQuery({
    queryKey: ["/api/practitioners"],
    queryFn: async () => {
      const response = await api.get("/api/practitioners?limit=100");
      return response;
    },
  });

  // Fetch appointments for the selected patient
  const selectedPatientId = form.watch("patientId");
  const { data: appointments } = useQuery({
    queryKey: ["/api/appointments", selectedPatientId],
    queryFn: async () => {
      if (!selectedPatientId) return [];
      const response = await api.get(`/api/appointments?patientId=${selectedPatientId}&limit=50`);
      return response;
    },
    enabled: !!selectedPatientId,
  });

  const createNoteMutation = useMutation({
    mutationFn: async (data: SoapNotesFormData) => {
      // Handle empty appointmentId
      const payload = {
        ...data,
        appointmentId: data.appointmentId || null,
      };
      return api.post("/api/clinical-notes", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clinical-notes"] });
      toast({
        title: "Success",
        description: "Clinical note created successfully",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create clinical note",
        variant: "destructive",
      });
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: async (data: SoapNotesFormData) => {
      // Handle empty appointmentId
      const payload = {
        ...data,
        appointmentId: data.appointmentId || null,
      };
      return api.put(`/api/clinical-notes/${note.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clinical-notes"] });
      toast({
        title: "Success",
        description: "Clinical note updated successfully",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update clinical note",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SoapNotesFormData) => {
    if (isEditing) {
      updateNoteMutation.mutate(data);
    } else {
      createNoteMutation.mutate(data);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Clinical Note" : "New SOAP Note"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="patientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Patient</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select patient" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {patients?.map((patient: any) => (
                          <SelectItem key={patient.id} value={patient.id}>
                            {patient.user?.firstName} {patient.user?.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="practitionerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Practitioner</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select practitioner" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {practitioners?.map((practitioner: any) => (
                          <SelectItem key={practitioner.id} value={practitioner.id}>
                            Dr. {practitioner.user?.firstName} {practitioner.user?.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Note title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="appointmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Related Appointment (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select appointment" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {appointments?.map((appointment: any) => (
                          <SelectItem key={appointment.id} value={appointment.id}>
                            {appointment.title} - {new Date(appointment.appointmentDate).toLocaleDateString()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-slate-900">SOAP Documentation</h3>
              
              <FormField
                control={form.control}
                name="subjective"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subjective</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Patient's chief complaint, history of present illness, symptoms..." 
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="objective"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Objective</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Physical examination findings, vital signs, test results..." 
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assessment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assessment</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Clinical diagnosis, impressions, differential diagnoses..." 
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="plan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plan</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Treatment plan, medications, follow-up instructions..." 
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="additionalNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Any additional observations or notes..." 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex space-x-4">
              <Button 
                type="submit" 
                disabled={createNoteMutation.isPending || updateNoteMutation.isPending}
              >
                {createNoteMutation.isPending || updateNoteMutation.isPending 
                  ? "Saving..." 
                  : isEditing ? "Update Note" : "Create Note"}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

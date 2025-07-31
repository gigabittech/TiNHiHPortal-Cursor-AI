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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

const invoiceSchema = z.object({
  patientId: z.string().min(1, "Patient is required"),
  practitionerId: z.string().min(1, "Practitioner is required"),
  appointmentId: z.string().optional().nullable(),
  amount: z.string().min(1, "Amount is required").refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Amount must be a positive number",
  }),
  tax: z.string().optional().default("0"),
  description: z.string().min(1, "Description is required"),
  dueDate: z.date().optional(),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

interface InvoiceFormProps {
  invoice?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function InvoiceForm({ invoice, onSuccess, onCancel }: InvoiceFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!invoice;

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      patientId: invoice?.patientId || "",
      practitionerId: invoice?.practitionerId || "",
      appointmentId: invoice?.appointmentId || "",
      amount: invoice?.amount || "",
      tax: invoice?.tax || "0",
      description: invoice?.description || "",
      dueDate: invoice?.dueDate ? new Date(invoice.dueDate) : undefined,
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

  const createInvoiceMutation = useMutation({
    mutationFn: async (data: InvoiceFormData) => {
      const amount = Number(data.amount);
      const tax = Number(data.tax || 0);
      const total = amount + tax;

      const payload = {
        ...data,
        appointmentId: data.appointmentId || null,
        amount: amount.toString(),
        tax: tax.toString(),
        total: total.toString(),
        dueDate: data.dueDate?.toISOString() || null,
      };
      return api.post("/api/invoices", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.refetchQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Success",
        description: "Invoice created successfully",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create invoice",
        variant: "destructive",
      });
    },
  });

  const updateInvoiceMutation = useMutation({
    mutationFn: async (data: InvoiceFormData) => {
      const amount = Number(data.amount);
      const tax = Number(data.tax || 0);
      const total = amount + tax;

      const payload = {
        ...data,
        appointmentId: data.appointmentId || null,
        amount: amount.toString(),
        tax: tax.toString(),
        total: total.toString(),
        dueDate: data.dueDate?.toISOString() || null,
      };
      return api.put(`/api/invoices/${invoice.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.refetchQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Success",
        description: "Invoice updated successfully",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update invoice",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InvoiceFormData) => {
    if (isEditing) {
      updateInvoiceMutation.mutate(data);
    } else {
      createInvoiceMutation.mutate(data);
    }
  };

  // Calculate total in real-time
  const amount = Number(form.watch("amount") || 0);
  const tax = Number(form.watch("tax") || 0);
  const total = amount + tax;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Invoice" : "New Invoice"}</CardTitle>
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
                            {appointment.title} - {format(new Date(appointment.appointmentDate), "MMM dd, yyyy")}
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
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date (Optional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a due date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Description of services provided..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tax"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <label className="text-sm font-medium">Total</label>
                <div className="h-10 px-3 py-2 border rounded-md bg-slate-50 flex items-center">
                  <span className="font-medium">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createInvoiceMutation.isPending || updateInvoiceMutation.isPending}
              >
                {isEditing ? "Update Invoice" : "Create Invoice"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, X, Coffee } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

const outOfOfficeFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  startDate: z.date({ required_error: "Start date is required" }),
  endDate: z.date({ required_error: "End date is required" }),
  reason: z.enum(["vacation", "sick-leave", "conference", "training", "personal", "other"]).default("vacation"),
  description: z.string().optional(),
  autoReply: z.boolean().default(true),
  autoReplyMessage: z.string().optional(),
  coveringPersonId: z.string().optional(),
  blockAppointments: z.boolean().default(true),
}).refine((data) => data.endDate >= data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
});

type OutOfOfficeFormData = z.infer<typeof outOfOfficeFormSchema>;

interface OutOfOfficeFormProps {
  selectedDate: Date | null;
  selectedTime: string | null;
  onSubmit: () => void;
  onCancel: () => void;
}

const REASON_OPTIONS = [
  { value: "vacation", label: "Vacation", icon: "🏖️" },
  { value: "sick-leave", label: "Sick Leave", icon: "🤒" },
  { value: "conference", label: "Conference", icon: "🎤" },
  { value: "training", label: "Training", icon: "📚" },
  { value: "personal", label: "Personal", icon: "👤" },
  { value: "other", label: "Other", icon: "📝" },
];

export function OutOfOfficeForm({ selectedDate, selectedTime, onSubmit, onCancel }: OutOfOfficeFormProps) {
  const form = useForm<OutOfOfficeFormData>({
    resolver: zodResolver(outOfOfficeFormSchema),
    defaultValues: {
      title: "",
      startDate: selectedDate || new Date(),
      endDate: selectedDate || new Date(),
      reason: "vacation",
      description: "",
      autoReply: true,
      autoReplyMessage: "I am currently out of office and will respond to your message when I return.",
      blockAppointments: true,
    },
  });

  const watchAutoReply = form.watch("autoReply");

  const handleSubmit = (data: OutOfOfficeFormData) => {
    console.log("Out of office data:", data);
    // TODO: Implement out of office creation API
    onSubmit();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coffee className="h-5 w-5 text-orange-500" />
          <h2 className="text-lg font-semibold">Out of Office</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {/* Title */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Summer Vacation" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Reason */}
          <FormField
            control={form.control}
            name="reason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reason</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select reason" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {REASON_OPTIONS.map((reason) => (
                      <SelectItem key={reason.value} value={reason.value}>
                        <div className="flex items-center gap-2">
                          <span>{reason.icon}</span>
                          {reason.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Start Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className="pl-3 text-left font-normal"
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick start date</span>
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

            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>End Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className="pl-3 text-left font-normal"
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick end date</span>
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

          {/* Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (optional)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Additional details about your time off..."
                    className="resize-none"
                    rows={2}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Settings */}
          <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
            <h3 className="font-medium">Settings</h3>
            
            <FormField
              control={form.control}
              name="blockAppointments"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Block appointments during this period
                    </FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Prevent new appointments from being scheduled
                    </p>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="autoReply"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Enable auto-reply message
                    </FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Automatically respond to messages
                    </p>
                  </div>
                </FormItem>
              )}
            />

            {watchAutoReply && (
              <FormField
                control={form.control}
                name="autoReplyMessage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Auto-reply Message</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Message to send automatically..."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          {/* Covering Person */}
          <FormField
            control={form.control}
            name="coveringPersonId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Covering Person (optional)</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select covering person" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">No covering person</SelectItem>
                    <SelectItem value="colleague1">Dr. Smith</SelectItem>
                    <SelectItem value="colleague2">Dr. Johnson</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              Create Out of Office
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
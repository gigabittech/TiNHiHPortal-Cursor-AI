import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

/**
 * Custom hook for cross-module integration
 * Provides unified data access and workflows across all modules
 */
export const useIntegration = () => {
  const queryClient = useQueryClient();

  // Patient Timeline - unified view of all patient interactions
  const usePatientTimeline = (patientId: string) => {
    return useQuery({
      queryKey: ['/api/integration/patient-timeline', patientId],
      queryFn: () => apiRequest(`/api/integration/patient-timeline/${patientId}`),
      enabled: !!patientId,
    });
  };

  // Practitioner Dashboard - comprehensive overview
  const usePractitionerDashboard = (practitionerId: string) => {
    return useQuery({
      queryKey: ['/api/integration/practitioner-dashboard', practitionerId],
      queryFn: () => apiRequest(`/api/integration/practitioner-dashboard/${practitionerId}`),
      enabled: !!practitionerId,
    });
  };

  // Integrated appointment creation
  const createIntegratedAppointment = useMutation({
    mutationFn: (appointmentData: any) => 
      apiRequest('/api/integration/appointments', { method: 'POST', body: appointmentData }),
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/clinical-notes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      queryClient.invalidateQueries({ queryKey: ['/api/telehealth-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/integration'] });
    },
  });

  // Complete appointment workflow
  const completeAppointmentWorkflow = useMutation({
    mutationFn: ({ appointmentId, clinicalNoteId, invoiceId }: {
      appointmentId: string;
      clinicalNoteId?: string;
      invoiceId?: string;
    }) => apiRequest(`/api/integration/appointments/${appointmentId}/complete`, {
      method: 'POST',
      body: { clinicalNoteId, invoiceId }
    }),
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/clinical-notes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      queryClient.invalidateQueries({ queryKey: ['/api/telehealth-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/integration'] });
    },
  });

  // Cross-module search - search across patients, appointments, notes, etc.
  const useCrossModuleSearch = (query: string) => {
    return useQuery({
      queryKey: ['/api/integration/search', query],
      queryFn: () => apiRequest(`/api/integration/search?q=${encodeURIComponent(query)}`),
      enabled: !!query && query.length > 2,
    });
  };

  // Quick actions - common workflows
  const useQuickActions = () => {
    return {
      // Schedule appointment from patient view
      scheduleFromPatient: useMutation({
        mutationFn: ({ patientId, practitionerId, ...appointmentData }: any) =>
          createIntegratedAppointment.mutateAsync({ patientId, practitionerId, ...appointmentData }),
      }),

      // Create clinical note from appointment
      createNoteFromAppointment: useMutation({
        mutationFn: (appointmentData: any) =>
          apiRequest('/api/clinical-notes', {
            method: 'POST',
            body: {
              appointmentId: appointmentData.id,
              patientId: appointmentData.patientId,
              practitionerId: appointmentData.practitionerId,
              type: 'SOAP',
              status: 'draft'
            }
          }),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['/api/clinical-notes'] });
        },
      }),

      // Generate invoice from appointment
      generateInvoiceFromAppointment: useMutation({
        mutationFn: (appointmentData: any) =>
          apiRequest('/api/integration/generate-invoice', {
            method: 'POST',
            body: { appointmentId: appointmentData.id }
          }),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
        },
      }),

      // Start telehealth session
      startTelehealthSession: useMutation({
        mutationFn: (appointmentId: string) =>
          apiRequest(`/api/telehealth-sessions/start/${appointmentId}`, { method: 'POST' }),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['/api/telehealth-sessions'] });
          queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
        },
      }),
    };
  };

  // Context-aware data - get related data for current context
  const useContextualData = (entityType: string, entityId: string) => {
    return useQuery({
      queryKey: ['/api/integration/contextual', entityType, entityId],
      queryFn: () => apiRequest(`/api/integration/contextual/${entityType}/${entityId}`),
      enabled: !!entityType && !!entityId,
    });
  };

  return {
    usePatientTimeline,
    usePractitionerDashboard,
    createIntegratedAppointment,
    completeAppointmentWorkflow,
    useCrossModuleSearch,
    useQuickActions,
    useContextualData,
  };
};
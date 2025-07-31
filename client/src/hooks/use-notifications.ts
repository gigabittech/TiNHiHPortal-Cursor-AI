import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { notificationService } from "../../../server/notification-service";

export function useNotifications() {
  const queryClient = useQueryClient();

  // Get notifications
  const useGetNotifications = (options?: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
    excludeArchived?: boolean;
  }) => {
    const { limit = 50, offset = 0, unreadOnly = false, excludeArchived = true } = options || {};
    
    return useQuery({
      queryKey: ['/api/notifications', { limit, offset, unreadOnly, excludeArchived }],
      refetchInterval: 30000, // Refetch every 30 seconds
    });
  };

  // Get unread count
  const useUnreadCount = () => {
    return useQuery({
      queryKey: ['/api/notifications/unread-count'],
      refetchInterval: 10000, // Refetch every 10 seconds
    });
  };

  // Mark as read
  const useMarkAsRead = () => {
    return useMutation({
      mutationFn: (notificationId: string) => 
        apiRequest(`/api/notifications/${notificationId}/read`, {
          method: 'PATCH'
        }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
        queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
      }
    });
  };

  // Mark all as read
  const useMarkAllAsRead = () => {
    return useMutation({
      mutationFn: () => 
        apiRequest('/api/notifications/mark-all-read', {
          method: 'PATCH'
        }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
        queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
      }
    });
  };

  // Archive notification
  const useArchiveNotification = () => {
    return useMutation({
      mutationFn: (notificationId: string) => 
        apiRequest(`/api/notifications/${notificationId}/archive`, {
          method: 'PATCH'
        }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
        queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
      }
    });
  };

  // Get notification preferences
  const useNotificationPreferences = () => {
    return useQuery({
      queryKey: ['/api/notifications/preferences'],
    });
  };

  // Update notification preferences
  const useUpdateNotificationPreferences = () => {
    return useMutation({
      mutationFn: (preferences: any) => 
        apiRequest('/api/notifications/preferences', {
          method: 'PATCH',
          body: JSON.stringify(preferences),
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/notifications/preferences'] });
      }
    });
  };

  // Helper function to create notifications from client (for testing)
  const createNotification = async (data: {
    type: string;
    title: string;
    message: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    actionUrl?: string;
    metadata?: any;
  }) => {
    // This would be called from server-side code typically
    // For client-side, notifications are created through other actions
    console.log('Notification created:', data);
  };

  return {
    useGetNotifications,
    useUnreadCount,
    useMarkAsRead,
    useMarkAllAsRead,
    useArchiveNotification,
    useNotificationPreferences,
    useUpdateNotificationPreferences,
    createNotification,
  };
}
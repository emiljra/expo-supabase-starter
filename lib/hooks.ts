import { useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/config/supabase';

// Define notification types
export type Notification = {
  id: number;
  created_at: string;
  body: string;
  type: 'info' | 'warning' | 'error';
  dismissed: boolean;
  link?: string;
};

// Hook to fetch notifications
export function useFetchNotifications(params: {
  accountIds: string[];
  onNotifications?: (notifications: Notification[]) => void;
  realtime?: boolean;
}) {
  const queryClient = useQueryClient();

  const fetchNotifications = async (): Promise<Notification[]> => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .in('user_id', params.accountIds)
      .eq('dismissed', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }

    return data || [];
  };

  // Set up realtime subscription
  useEffect(() => {
    if (!params.realtime) return;

    const subscription = supabase
      .channel('notifications-channel')
      .on(
        'postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=in.(${params.accountIds.join(',')})`,
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [params.accountIds, params.realtime, queryClient]);

  // Query for notifications
  const { data, isLoading, error } = useQuery({
    queryKey: ['notifications', params.accountIds],
    queryFn: fetchNotifications,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Run callback when notifications change
  useEffect(() => {
    if (data && params.onNotifications) {
      params.onNotifications(data);
    }
  }, [data, params]);

  return {
    notifications: data || [],
    isLoading,
    error,
  };
}

// Hook to dismiss notifications
export function useDismissNotification() {
  const queryClient = useQueryClient();

  const dismissMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('notifications')
        .update({ dismissed: true })
        .eq('id', id);
      
      if (error) {
        console.error('Error dismissing notification:', error);
        throw error;
      }

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return useCallback((id: number) => {
    return dismissMutation.mutateAsync(id);
  }, [dismissMutation]);
}

// Helper function to format time ago
export function formatTimeAgo(createdAt: string) {
  const date = new Date(createdAt);
  const now = new Date();
  
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Akkurat nå';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'minutt' : 'minutter'} siden`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'time' : 'timer'} siden`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} ${diffInDays === 1 ? 'dag' : 'dager'} siden`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} ${diffInMonths === 1 ? 'måned' : 'måneder'} siden`;
  }
  
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} ${diffInYears === 1 ? 'år' : 'år'} siden`;
} 
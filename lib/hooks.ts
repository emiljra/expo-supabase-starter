import { useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/config/supabase';
import { useAuth } from '@/context/supabase-provider';

// Define notification types
export type Notification = {
  id: number;
  created_at: string;
  body: string;
  type: 'info' | 'warning' | 'error';
  dismissed: boolean;
  link?: string;
};

// Favorite types
export type Favorite = {
  id: string;
  created_at: string;
  user_id: string;
  listing_type: 'job' | 'vessel' | 'borsen';
  folder_id: string | null;
  job_id: string | null;
  vessel_id: string | null;
  borsen_id: string | null;
  listing: any;
};

export type FavoriteFolder = {
  id: string;
  created_at: string;
  name: string;
  user_id: string;
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

// Hook to fetch favorite folders
export function useFavoriteFolders() {
  const { session } = useAuth();
  const userId = session?.user?.id;

  const fetchFolders = async (): Promise<FavoriteFolder[]> => {
    if (!userId) return [];

    const { data, error } = await supabase
      .from('favorite_folders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .throwOnError();

    if (error) {
      console.error('Error fetching favorite folders:', error);
      throw error;
    }

    return data || [];
  };

  return useQuery({
    queryKey: ['favoriteFolders', userId],
    queryFn: fetchFolders,
    enabled: !!userId,
  });
}

// Hook to fetch favorites
export function useFavorites(folderId?: string) {
  const { session } = useAuth();
  const userId = session?.user?.id;

  const fetchFavorites = async (): Promise<Favorite[]> => {
    if (!userId) return [];

    let query = supabase
      .from('favorites')
      .select(`
        *,
        job:job_id(*),
        vessel:vessel_id(*),
        borsen:borsen_id(*)
      `)
      .eq('user_id', userId);

    if (folderId) {
      query = query.eq('folder_id', folderId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching favorites:', error);
      throw error;
    }

    // Transform the data to include the listing information
    return (data || []).map(favorite => {
      let listing = null;
      if (favorite.job) {
        listing = {
          ...favorite.job,
          type: 'job' as const
        };
      } else if (favorite.vessel) {
        listing = {
          ...favorite.vessel,
          type: 'vessel' as const
        };
      } else if (favorite.borsen) {
        listing = {
          ...favorite.borsen,
          type: 'borsen' as const
        };
      }

      return {
        ...favorite,
        listing
      };
    });
  };

  return useQuery({
    queryKey: ['favorites', userId, folderId],
    queryFn: fetchFavorites,
    enabled: !!userId,
  });
}

// Hook to add a favorite
export function useAddFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (favorite: Omit<Favorite, 'id' | 'created_at' | 'user_id'>) => {
      const { data } = await supabase
        .from('favorites')
        .insert(favorite)
        .select()
        .single()
        .throwOnError();

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
}

// Hook to remove a favorite
export function useRemoveFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await supabase
        .from('favorites')
        .delete()
        .eq('id', id)
        .throwOnError();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
}

// Hook to create a favorite folder
export function useCreateFavoriteFolder() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const userId = session?.user?.id;

  return useMutation({
    mutationFn: async (name: string) => {
      if (!userId) throw new Error('User not authenticated');

      const { data } = await supabase
        .from('favorite_folders')
        .insert({ name, user_id: userId })
        .select()
        .single()
        .throwOnError();

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favoriteFolders'] });
    },
  });
}

// Hook to delete a favorite folder
export function useDeleteFavoriteFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await supabase
        .from('favorite_folders')
        .delete()
        .eq('id', id)
        .throwOnError();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favoriteFolders'] });
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
}

// Hook to move a favorite to a folder
export function useMoveFavoriteToFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ favoriteId, folderId }: { favoriteId: string; folderId: string | null }) => {
      await supabase
        .from('favorites')
        .update({ folder_id: folderId })
        .eq('id', favoriteId)
        .throwOnError();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
}

// Hook to rename a favorite folder
export function useRenameFavoriteFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      await supabase
        .from('favorite_folders')
        .update({ name })
        .eq('id', id)
        .throwOnError();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favoriteFolders'] });
    },
  });
} 
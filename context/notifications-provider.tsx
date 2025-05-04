import { createContext, useContext, PropsWithChildren, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/supabase-provider';
import { Notification, useFetchNotifications, useDismissNotification } from '@/lib/hooks';

type NotificationsContextType = {
  notifications: Notification[];
  isLoading: boolean;
  error: Error | null;
  dismissNotification: (id: number) => Promise<number>;
  refreshNotifications: () => void;
  unreadCount: number;
};

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: PropsWithChildren) {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const accountIds = userId ? [userId] : [];
  
  const { notifications, isLoading, error } = useFetchNotifications({
    accountIds,
    realtime: true,
  });
  
  const dismissNotification = useDismissNotification();
  
  const refreshNotifications = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);
  
  const unreadCount = notifications.length;
  
  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        isLoading,
        error,
        dismissNotification,
        refreshNotifications,
        unreadCount,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  
  return context;
} 
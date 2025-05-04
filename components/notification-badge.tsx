import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/context/notifications-provider';

interface NotificationBadgeProps {
  className?: string;
}

export function NotificationBadge({ className }: NotificationBadgeProps) {
  const { unreadCount } = useNotifications();
  
  if (unreadCount === 0) {
    return null;
  }
  
  return (
    <View
      className={cn(
        'absolute right-0 top-0 h-4 min-w-4 rounded-full bg-red-500 items-center justify-center',
        className
      )}
    >
      <Text className="text-[10px] font-semibold text-white px-1">
        {unreadCount > 99 ? '99+' : unreadCount}
      </Text>
    </View>
  );
} 
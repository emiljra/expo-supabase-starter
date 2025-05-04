import React from 'react';
import { View, TouchableOpacity, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, AlertTriangle, Info, XIcon } from 'lucide-react-native';
import { Notification, formatTimeAgo } from '@/lib/hooks';
import { router } from 'expo-router';
import { cn } from '@/lib/utils';

type NotificationCardProps = {
  notification: Notification;
  onDismiss: (id: number) => void;
};

export function NotificationCard({ notification, onDismiss }: NotificationCardProps) {
  const renderNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle size={20} className="text-yellow-500" />;
      case 'error':
        return <AlertCircle size={20} className="text-destructive" />;
      default:
        return <Info size={20} className="text-blue-500" />;
    }
  };
  
  const renderContent = () => {
    if (notification.link) {
      return (
        <Pressable onPress={() => router.push(notification.link as any)}>
          <Text className="text-sm mb-1 text-primary">{notification.body}</Text>
        </Pressable>
      );
    }
    
    return <Text className="text-sm mb-1">{notification.body}</Text>;
  };

  return (
    <View>
      <View className="flex-row px-4 py-3">
        <View className="mr-3 mt-1">
          {renderNotificationIcon(notification.type)}
        </View>
        
        <View className="flex-1">
          {renderContent()}
          <Text className="text-xs text-muted-foreground">
            {formatTimeAgo(notification.created_at)}
          </Text>
        </View>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 ml-2"
          onPress={() => onDismiss(notification.id)}
        >
          <XIcon size={16} />
        </Button>
      </View>
      <Separator />
    </View>
  );
} 
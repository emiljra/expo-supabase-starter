'use client';

import { useState, useCallback } from "react";
import { View, FlatList, ActivityIndicator, RefreshControl } from "react-native";
import { Text } from "@/components/ui/text";
import { SafeAreaView } from "@/components/safe-area-view";
import { Bell } from "lucide-react-native";

import { H1 } from "@/components/ui/typography";
import { useNotifications } from "@/context/notifications-provider";
import { NotificationCard } from "@/components/notification-card";
import { Separator } from "@/components/ui/separator";

export default function Notifications() {
	const { notifications, isLoading, error, dismissNotification, refreshNotifications } = useNotifications();
	const [refreshing, setRefreshing] = useState(false);
	
	const handleDismiss = async (id: number) => {
		await dismissNotification(id);
	};
	
	const handleRefresh = useCallback(() => {
		setRefreshing(true);
		refreshNotifications();
		setTimeout(() => {
			setRefreshing(false);
		}, 1000);
	}, [refreshNotifications]);

	if (isLoading && !refreshing) {
		return (
			<SafeAreaView className="flex-1 bg-background">
				<View className="flex-1 items-center justify-center">
					<ActivityIndicator />
				</View>
			</SafeAreaView>
		);
	}

	if (error) {
		return (
			<SafeAreaView className="flex-1 bg-background">
				<View className="flex-1 items-center justify-center">
					<Text className="text-destructive">Kunne ikke laste inn varslinger</Text>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView className="flex-1 bg-background">
			<View className="px-4 py-3">
				<H1>Varslinger</H1>
			</View>
			
			<Separator />
			
			{notifications.length === 0 ? (
				<View className="flex-1 items-center justify-center">
					<Bell size={40} className="text-muted-foreground mb-2" />
					<Text className="text-muted-foreground">Ingen varslinger</Text>
				</View>
			) : (
				<FlatList
					data={notifications}
					renderItem={({ item }) => (
						<NotificationCard 
							notification={item} 
							onDismiss={handleDismiss} 
						/>
					)}
					keyExtractor={(item) => item.id.toString()}
					refreshControl={
						<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
					}
				/>
			)}
		</SafeAreaView>
	);
}

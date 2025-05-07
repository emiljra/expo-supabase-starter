import React from "react";
import { Tabs } from "expo-router";
import { View } from "react-native";
import { Bell, Bookmark, House, Plus, PlusCircle, User } from "lucide-react-native";

import { useColorScheme } from "@/lib/useColorScheme";
import { colors } from "@/constants/colors";
import { NotificationBadge } from "@/components/notification-badge";

export default function TabsLayout() {
	const { colorScheme } = useColorScheme();

	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarStyle: {
					backgroundColor: "#23245A",

						/* colorScheme === "dark"
							? colors.dark.background
							: colors.light.background, */
				},
				tabBarActiveTintColor: "#fa8072",
					/* colorScheme === "dark"
						? colors.dark.foreground
						: colors.light.foreground, */
				tabBarShowLabel: true,
				tabBarLabelStyle: {
					color: "white",
				},
				tabBarInactiveTintColor: "white",
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: "Home",
					tabBarIcon: ({ color, size }) => <House color={color} size={size} />,
					headerShown: true,
					headerStyle: {
						backgroundColor: "#23245A",
					},
					headerTitle: "Fremside",
					headerTitleStyle: {
						color: "white",
					},
					
					
				}}
			/>
			<Tabs.Screen
				name="notifications"
				options={{
					title: "Varslinger",
					tabBarIcon: ({ color, size }) => (
						<View>
							<Bell color={color} size={size} />
							<NotificationBadge />
						</View>
					),
				}}
			/>
			<Tabs.Screen
				name="new-listing"
				options={{
					title: "Ny annonse",
					tabBarIcon: ({ color, size }) => <PlusCircle color={color} size={size} />,
				}}
			/>
			<Tabs.Screen
				name="favorites"
				options={{
					title: "Favoritter",
					tabBarIcon: ({ color, size }) => <Bookmark color={color} size={size} />,
				}}
			/>
			<Tabs.Screen
				name="min-havbors"
				options={{
					title: "Min Havbørs",
					tabBarIcon: ({ color, size }) => (
						<User color={color} size={size} />
					),
				}}
			/>
		</Tabs>
	);
}

import React from "react";
import { Tabs } from "expo-router";
import { Bell, Bookmark, House, Plus, PlusCircle, User } from "lucide-react-native";

import { useColorScheme } from "@/lib/useColorScheme";
import { colors } from "@/constants/colors";

export default function TabsLayout() {
	const { colorScheme } = useColorScheme();

	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarStyle: {
					backgroundColor:
						colorScheme === "dark"
							? colors.dark.background
							: colors.light.background,
				},
				tabBarActiveTintColor:
					colorScheme === "dark"
						? colors.dark.foreground
						: colors.light.foreground,
				tabBarShowLabel: false,
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: "Home",
					tabBarIcon: ({ color, size }) => <House color={color} size={size} />,
				}}
				/>
					<Tabs.Screen
					name="notifications"
					options={{
						title: "Varslinger",
						tabBarIcon: ({ color, size }) => <Bell color={color} size={size} />,
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

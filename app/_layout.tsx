import "../global.css";

import { Stack } from "expo-router";

import { AuthProvider } from "@/context/supabase-provider";
import { NotificationsProvider } from "@/context/notifications-provider";
import { useColorScheme } from "@/lib/useColorScheme";
import { colors } from "@/constants/colors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
	defaultOptions: {
	  queries: {
		staleTime: 5 * 60 * 1000, // 5 minutes
		retry: 1,
	  },
	},
  });

export default function AppLayout() {
	const { colorScheme } = useColorScheme();

	return (
		<QueryClientProvider client={queryClient}>
			<AuthProvider>
				<NotificationsProvider>
					<Stack screenOptions={{ headerShown: false, gestureEnabled: false }}>
						<Stack.Screen name="(protected)" />
						<Stack.Screen name="welcome" />
						<Stack.Screen
							name="sign-up"
							options={{
								presentation: "modal",
								headerShown: true,
								headerTitle: "Registrer deg",
								headerStyle: {
									backgroundColor:
										colorScheme === "dark"
											? colors.dark.background
											: colors.light.background,
								},
								headerTintColor:
									colorScheme === "dark"
										? colors.dark.foreground
										: colors.light.foreground,
								gestureEnabled: true,
							}}
						/>
						<Stack.Screen
							name="sign-in"
							options={{
								presentation: "modal",
								headerShown: true,
								headerTitle: "Logg inn",
								headerStyle: {
									backgroundColor:
										colorScheme === "dark"
											? colors.dark.background
											: colors.light.background,
								},
								headerTintColor:
									colorScheme === "dark"
										? colors.dark.foreground
										: colors.light.foreground,
								gestureEnabled: true,
							}}
						/>
						
					</Stack>
				</NotificationsProvider>
			</AuthProvider>
		</QueryClientProvider>
	);
}

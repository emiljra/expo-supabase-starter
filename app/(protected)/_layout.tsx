import { Redirect, Stack } from "expo-router";

import { useAuth } from "@/context/supabase-provider";
import { colors } from "@/constants/colors";
import { useColorScheme } from "@/lib/useColorScheme";
export const unstable_settings = {
	initialRouteName: "(tabs)",
};

export default function ProtectedLayout() {
	const { initialized, session } = useAuth();
	const { colorScheme } = useColorScheme();
	if (!initialized) {
		return null;
	}

	if (!session) {
		return <Redirect href="/welcome" />;
	}

	return (
		<Stack
			screenOptions={{
				headerShown: false,
			}}
		>
			<Stack.Screen name="(tabs)" />
			<Stack.Screen name="modal" options={{ presentation: "modal" }} />
			<Stack.Screen
						name="edit-profile"
						options={{
							presentation: "modal",
							headerShown: true,
							headerTitle: "Rediger profil",
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
	);
}

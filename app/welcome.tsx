import React from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";

import { Image } from "@/components/image";
import { SafeAreaView } from "@/components/safe-area-view";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { H1, Muted } from "@/components/ui/typography";
import { useColorScheme } from "@/lib/useColorScheme";

export default function WelcomeScreen() {
	const router = useRouter();
	const { colorScheme } = useColorScheme();
	const appIcon =
		colorScheme === "dark"
			? require("@/assets/logo.svg")
			: require("@/assets/logo.svg");

	return (
		<SafeAreaView className="flex flex-1 bg-[#E7F2F8] p-4">
			<View className="flex flex-1 items-center justify-center gap-y-4 web:m-4">
				<Image source={appIcon} className="w-[150px] h-[26px]" contentFit="contain" />
				<H1 className="text-center text-[#23245A]">Velkommen tilbake</H1>
				<Muted className="text-center">
				Sammen for havets framtid
				</Muted>
			</View>
			<View className="flex flex-col gap-y-4 web:m-4">
				<Button
					size="default"
					variant="default"
					onPress={() => {
						router.push("/sign-up");
					}}
				>
					<Text>Registrer deg</Text>
				</Button>
				<Button
					size="default"
					variant="secondary"
					onPress={() => {
						router.push("/sign-in");
					}}
				>
					<Text>Logg inn</Text>
				</Button>
			</View>
		</SafeAreaView>
	);
}

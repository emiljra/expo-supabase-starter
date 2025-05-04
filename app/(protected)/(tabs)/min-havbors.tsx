import { ActivityIndicator, View, Alert, Image } from "react-native";
import { router } from "expo-router";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { H1, Muted } from "@/components/ui/typography";
import { useAuth } from "@/context/supabase-provider";
import { useColorScheme } from "@/lib/useColorScheme";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/config/supabase";
import { SafeAreaView } from "@/components/safe-area-view";

export default function Settings() {
	const { signOut } = useAuth();
	const { session } = useAuth();
	const { colorScheme, toggleColorScheme } = useColorScheme();
	const isDarkMode = colorScheme === "dark";
	const queryClient = useQueryClient();

	const fetchProfiles = async () => {
		const { data } = await supabase
			.from("profiles")
			.select("*")
			.eq("id", session?.user.id)
			.throwOnError();
		return data;
	};

	const {
		data: profiles,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["profiles"],
		queryFn: fetchProfiles,
	});

	if (isLoading) {
		return (
			<View className="flex-1 items-center justify-center">
				<ActivityIndicator />
			</View>
		);
	}

	if (error) {
		return <Text>{error.message}</Text>;
	}

	const profile = profiles?.[0];

	return (
		<SafeAreaView edges={["top"]} className="flex-1 bg-background p-4">
			<View className="pt-8 pb-6 items-center">
				<H1 className="text-center">Hei, {profile?.full_name}</H1>
				<Muted className="text-center mt-1">Din profilinformasjon</Muted>
			</View>

			<View className="flex-1 w-full">
				<View className="bg-card rounded-lg p-4 mb-4">
					<View className="items-center mb-6">
						{profile?.avatar_url ? (
							<ProfileImage 
								key={`profile-image-${profile.avatar_url}`}
								url={profile.avatar_url} 
								size={120} 
							/>
						) : (
							<View 
								className="rounded-md bg-neutral-800 border border-neutral-300"
								style={{ height: 120, width: 120 }}
							/>
						)}
					</View>
					<View className="mb-4 border-b border-border pb-2">
						<Text className="text-muted-foreground text-sm mb-1">E-post</Text>
						<Text className="text-foreground text-lg">
							{profile?.email || session?.user.email || "Ikke angitt"}
						</Text>
					</View>

					<View className="mb-4 border-b border-border pb-2">
						<Text className="text-muted-foreground text-sm mb-1">Telefon</Text>
						<Text className="text-foreground text-lg">
							{profile?.phone || "Ikke angitt"}
						</Text>
					</View>

					<View className="mb-4 border-b border-border pb-2">
						<Text className="text-muted-foreground text-sm mb-1">
							Stillingstittel
						</Text>
						<Text className="text-foreground text-lg">
							{profile?.job_title || "Ikke angitt"}
						</Text>
					</View>
				</View>

				<Button
					className="w-full mb-4"
					variant="outline"
					onPress={() => router.push("/edit-profile")}
				>
					<Text>Rediger profil</Text>
				</Button>

				<View className="w-full flex-row items-center justify-between my-3 py-2 border-b border-border">
					<Text className="text-foreground text-lg">Mørkt tema</Text>
					<Switch checked={isDarkMode} onCheckedChange={toggleColorScheme} />
				</View>

				<Button
					className="w-full mt-6"
					size="default"
					variant="default"
					onPress={async () => {
						await signOut();
					}}
				>
					<Text>Logg ut</Text>
				</Button>
			</View>
		</SafeAreaView>
	);
}

function ProfileImage({ url, size }: { url: string, size: number }) {
	const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
	const queryClient = useQueryClient();
	const cacheKey = `avatar-${url}`;
	
	useEffect(() => {
		async function downloadImage() {
			// First check if it's already in the cache
			const cachedImage = queryClient.getQueryData([cacheKey]);
			if (cachedImage) {
				setAvatarUrl(cachedImage as string);
				return;
			}
			
			try {
				console.log('ProfileImage: Downloading image from path:', url);
				
				let imageData: string | null = null;
				
				// First try with the provided path
				const { data, error } = await supabase.storage.from('avatars').download(url);
				
				if (error) {
					console.error('ProfileImage: Error downloading image:', error.message);
					
					// Try without file extension as fallback
					if (url.includes('.')) {
						const basePath = url.substring(0, url.lastIndexOf('.'));
						console.log('ProfileImage: Trying fallback path without extension:', basePath);
						
						const { data: fallbackData, error: fallbackError } = await supabase.storage
							.from('avatars')
							.download(basePath);
							
						if (fallbackError) {
							console.error('ProfileImage: Fallback download failed:', fallbackError.message);
							return;
						}
						
						console.log('ProfileImage: Fallback download successful');
						
						const fr = new FileReader();
						fr.readAsDataURL(fallbackData);
						fr.onload = () => {
							const imgData = fr.result as string;
							setAvatarUrl(imgData);
							// Store in React Query cache
							queryClient.setQueryData([cacheKey], imgData);
						};
						return;
					}
					return;
				}
				
				const fr = new FileReader();
				fr.readAsDataURL(data);
				fr.onload = () => {
					const imgData = fr.result as string;
					setAvatarUrl(imgData);
					// Store in React Query cache
					queryClient.setQueryData([cacheKey], imgData);
				};
			} catch (error) {
				if (error instanceof Error) {
					console.log('ProfileImage: Error downloading image:', error.message);
				}
			}
		}
		
		downloadImage();
	}, [url, queryClient, cacheKey]);
	
	return avatarUrl ? (
		<Image
			source={{ uri: avatarUrl }}
			accessibilityLabel="Profile Image"
			className="overflow-hidden rounded-md object-cover"
			style={{ height: size, width: size }}
		/>
	) : (
		<View 
			className="rounded-md bg-neutral-800 border border-neutral-300"
			style={{ height: size, width: size }}
		/>
	);
}

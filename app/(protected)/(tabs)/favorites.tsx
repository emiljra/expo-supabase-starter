import { useState } from "react";
import { View, ActivityIndicator, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "@/components/safe-area-view";
import { Text } from "@/components/ui/text";
import { H1 } from "@/components/ui/typography";
import { MasonryFlashList } from "@shopify/flash-list";
import { useFavoriteFolders, useFavorites, FavoriteFolder } from "@/lib/hooks";
import FavoriteFolderItem from "@/components/favorite-folder";
import ListingItem from "@/components/listing-item";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react-native";
import { useCreateFavoriteFolder } from "@/lib/hooks";

export default function Favorites() {
	const [selectedFolder, setSelectedFolder] = useState<FavoriteFolder | null>(null);
	const { data: folders, isLoading: isLoadingFolders } = useFavoriteFolders();
	const { data: favorites, isLoading: isLoadingFavorites } = useFavorites(selectedFolder?.id);
	const createFolder = useCreateFavoriteFolder();

	const handleCreateFolder = () => {
		Alert.prompt(
			"Ny mappe",
			"Skriv inn navn på den nye mappen",
			[
				{
					text: "Avbryt",
					style: "cancel",
				},
				{
					text: "Opprett",
					onPress: async (name) => {
						if (name?.trim()) {
							try {
								await createFolder.mutateAsync(name.trim());
							} catch (error: any) {
								if (error?.code === "23505") {
									Alert.alert(
										"Kunne ikke opprette mappe",
										"Det finnes allerede en mappe med dette navnet",
										[{ text: "OK" }]
									);
								} else {
									Alert.alert(
										"Kunne ikke opprette mappe",
										"Det oppstod en feil ved opprettelse av mappen",
										[{ text: "OK" }]
									);
								}
							}
						}
					},
				},
			],
			"plain-text"
		);
	};

	if (isLoadingFolders || isLoadingFavorites) {
		return (
			<SafeAreaView className="flex-1 bg-background">
				<View className="flex-1 items-center justify-center">
					<ActivityIndicator />
				</View>
			</SafeAreaView>
		);
	}

	const listings = favorites?.map(favorite => favorite.listing).filter(Boolean) || [];

	return (
		<SafeAreaView className="flex-1 bg-background">
			<View className="px-4 py-3">
				<H1>Favoritter</H1>
			</View>

			<View className="px-4">
				<ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
					<Button
						variant="outline"
						size="icon"
						className="mr-2"
						onPress={handleCreateFolder}
					>
						<Plus size={20} />
					</Button>
					{folders?.map((folder) => (
						<FavoriteFolderItem
							key={folder.id}
							folder={folder}
							isSelected={selectedFolder?.id === folder.id}
							onPress={setSelectedFolder}
						/>
					))}
				</ScrollView>
			</View>

			<View className="flex-1 px-2">
				{listings.length > 0 ? (
					<MasonryFlashList
						data={listings}
						renderItem={({ item }) => <ListingItem listing={item} />}
						keyExtractor={(item) => item.id}
						numColumns={2}
						estimatedItemSize={200}
					/>
				) : (
					<View className="flex-1 items-center justify-center">
						<Text className="text-muted-foreground">
							{selectedFolder
								? "Ingen favoritter i denne mappen"
								: "Ingen favoritter enda"}
						</Text>
					</View>
				)}
			</View>
		</SafeAreaView>
	);
}
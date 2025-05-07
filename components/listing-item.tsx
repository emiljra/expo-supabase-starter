import React from "react";
import { View, TouchableOpacity, Modal } from "react-native";
import { Text } from "./ui/text";
import { Image } from "./image";
import { Bookmark } from "lucide-react-native";
import { useAddFavorite, useRemoveFavorite, useFavorites, useFavoriteFolders, useMoveFavoriteToFolder } from "@/lib/hooks";
import { router } from "expo-router";
import { useState } from "react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface Listing {
	id: string;
	title: string;
	featured_image: string;
    kommunenavn: string;
    price: number | null;
    type: 'job' | 'vessel' | 'borsen';
}

export default function ListingItem({ listing }: { listing: Listing }) {
	const { data: favorites } = useFavorites();
	const { data: folders } = useFavoriteFolders();
	const addFavorite = useAddFavorite();
	const removeFavorite = useRemoveFavorite();
	const moveToFolder = useMoveFavoriteToFolder();
	const [showMenu, setShowMenu] = useState(false);

	const isFavorite = favorites?.some(favorite => {
		if (listing.type === 'job') return favorite.job_id === listing.id;
		if (listing.type === 'vessel') return favorite.vessel_id === listing.id;
		if (listing.type === 'borsen') return favorite.borsen_id === listing.id;
		return false;
	});

	const currentFavorite = favorites?.find(f => {
		if (listing.type === 'job') return f.job_id === listing.id;
		if (listing.type === 'vessel') return f.vessel_id === listing.id;
		if (listing.type === 'borsen') return f.borsen_id === listing.id;
		return false;
	});

	const handleFavorite = async () => {
		try {
			if (isFavorite) {
				if (currentFavorite) {
					await removeFavorite.mutateAsync(currentFavorite.id);
				}
			} else {
				// Check if we already have a favorite for this listing
				const existingFavorite = favorites?.find(f => {
					if (listing.type === 'job') return f.job_id === listing.id;
					if (listing.type === 'vessel') return f.vessel_id === listing.id;
					if (listing.type === 'borsen') return f.borsen_id === listing.id;
					return false;
				});

				if (existingFavorite) {
					// If it exists, just update its folder_id if needed
					await moveToFolder.mutateAsync({
						favoriteId: existingFavorite.id,
						folderId: null
					});
				} else {
					// If it doesn't exist, create a new favorite
					await addFavorite.mutateAsync({
						listing_type: listing.type,
						job_id: listing.type === 'job' ? listing.id : null,
						vessel_id: listing.type === 'vessel' ? listing.id : null,
						borsen_id: listing.type === 'borsen' ? listing.id : null,
						folder_id: null,
						listing: null
					});
				}
			}
		} catch (error) {
			console.error("Error toggling favorite:", error);
		}
	};

	const handleMoveToFolder = async (folderId: string | null) => {
		try {
			if (currentFavorite) {
				await moveToFolder.mutateAsync({
					favoriteId: currentFavorite.id,
					folderId
				});
			}
			setShowMenu(false);
		} catch (error) {
			console.error("Error moving to folder:", error);
		}
	};

	const handlePress = () => {
		router.push(`/(protected)/listing/${listing.type}/${listing.id}`);
	};

	return (
		<>
			<TouchableOpacity 
				className="p-1 rounded-lg shadow overflow-hidden mb-4 bg-background active:bg-[#E7F2F8] dark:active:bg-[#23245A]"
				activeOpacity={1}
				onPress={handlePress}
			>
				<View className="relative">
					<Image
						source={{ uri: listing.featured_image }}
						className="w-full h-40 rounded-lg border object-contain border-[#E7F2F8]"
						contentFit="cover"
					/>
					<View className="absolute top-2 right-2">
						<TouchableOpacity
							className="p-2 rounded-full bg-[#E7F2F8]/20"
							onPress={handleFavorite}
							onLongPress={() => isFavorite && setShowMenu(true)}
							delayLongPress={500}
						>
							<Bookmark
								color={"#fa8072"}
								fill={isFavorite ? "#fa8072" : "transparent"}
								size={20}
							/>
						</TouchableOpacity>
					</View>
				</View>
				<View className="p-3">
					<Text className="font-normal text-muted-foreground text-xs mb-1 line-clamp-1">{listing.kommunenavn}</Text>
					<Text className="font-normal line-clamp-1">{listing.title}</Text>
					{listing.price && (
						<Text className="font-semibold text-xs mb-1 line-clamp-1">
							Pris {listing.price.toLocaleString('nb-NO', { style: 'currency', currency: 'NOK' })}
						</Text>
					)}
				</View>
			</TouchableOpacity>

			<Modal
				visible={showMenu}
				transparent
				animationType="fade"
				onRequestClose={() => setShowMenu(false)}
			>
				<TouchableOpacity
					className="flex-1 bg-black/50"
					activeOpacity={1}
					onPress={() => setShowMenu(false)}
				>
					<View className="flex-1 justify-center items-center">
						<View className="bg-background rounded-lg p-4 w-80">
							<Text className="text-lg font-semibold mb-4">Flytt til mappe</Text>
							<Button
								variant="ghost"
								className="w-full justify-start"
								onPress={() => handleMoveToFolder(null)}
							>
								<Text>Ingen mappe</Text>
							</Button>
							{folders?.filter(folder => folder.id !== currentFavorite?.folder_id).map((folder) => (
								<Button
									key={folder.id}
									variant="ghost"
									className="w-full justify-start"
									onPress={() => handleMoveToFolder(folder.id)}
								>
									<Text>{folder.name}</Text>
								</Button>
							))}
						</View>
					</View>
				</TouchableOpacity>
			</Modal>
		</>
	);
}
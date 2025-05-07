import React from "react";
import { View, TouchableOpacity, Modal, Alert, Animated, Dimensions } from "react-native";
import { Text } from "./ui/text";
import { Image } from "./image";
import { Bookmark, Plus, Folder, X } from "lucide-react-native";
import { useAddFavorite, useRemoveFavorite, useFavorites, useFavoriteFolders, useMoveFavoriteToFolder, useCreateFavoriteFolder } from "@/lib/hooks";
import { router } from "expo-router";
import { useState, useRef } from "react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { SafeAreaView } from "react-native-safe-area-context";

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
	const createFolder = useCreateFavoriteFolder();
	const [showMenu, setShowMenu] = useState(false);
	const [showFolderModal, setShowFolderModal] = useState(false);
	const slideAnim = useRef(new Animated.Value(0)).current;

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
				handleShowFolderModal();
			}
		} catch (error) {
			console.error("Error toggling favorite:", error);
		}
	};

	const handleShowFolderModal = () => {
		setShowFolderModal(true);
		Animated.spring(slideAnim, {
			toValue: 1,
			useNativeDriver: true,
			bounciness: 0,
		}).start();
	};

	const handleHideFolderModal = () => {
		Animated.timing(slideAnim, {
			toValue: 0,
			duration: 200,
			useNativeDriver: true,
		}).start(() => {
			setShowFolderModal(false);
		});
	};

	const handleCreateNewFolder = () => {
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
								const newFolder = await createFolder.mutateAsync(name.trim());
								await handleAddToFolder(newFolder.id);
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

	const handleAddToFolder = async (folderId: string | null) => {
		try {
			// Check if we already have a favorite for this listing
			const existingFavorite = favorites?.find(f => {
				if (listing.type === 'job') return f.job_id === listing.id;
				if (listing.type === 'vessel') return f.vessel_id === listing.id;
				if (listing.type === 'borsen') return f.borsen_id === listing.id;
				return false;
			});

			if (existingFavorite) {
				// If it exists, just update its folder_id
				await moveToFolder.mutateAsync({
					favoriteId: existingFavorite.id,
					folderId
				});
			} else {
				// If it doesn't exist, create a new favorite
				await addFavorite.mutateAsync({
					listing_type: listing.type,
					job_id: listing.type === 'job' ? listing.id : null,
					vessel_id: listing.type === 'vessel' ? listing.id : null,
					borsen_id: listing.type === 'borsen' ? listing.id : null,
					folder_id: folderId,
					listing: null
				});
			}
			handleHideFolderModal();
		} catch (error) {
			console.error("Error adding to folder:", error);
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
						className="w-full h-36 rounded-lg border object-contain border-[#E7F2F8]"
						contentFit="cover"
					/>
					<View className="absolute top-2 right-2">
						<TouchableOpacity
							className="p-2 rounded-full bg-[#E7F2F8]"
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
				visible={showFolderModal}
				transparent
				animationType="none"
				onRequestClose={handleHideFolderModal}
			>
				<TouchableOpacity
					className="flex-1 bg-black/50"
					activeOpacity={1}
					onPress={handleHideFolderModal}
				>
					<Animated.View 
						className="absolute bottom-0 left-0 right-0 bg-background rounded-t-3xl"
						style={{
							transform: [{
								translateY: slideAnim.interpolate({
									inputRange: [0, 1],
									outputRange: [600, 0]
								})
							}]
						}}
					>
						<SafeAreaView edges={['bottom']}>
							<View className="p-4">
								<View className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6" />
								
								<View className="flex-row items-center justify-between mb-6 px-2">
									<Text className="text-xl font-semibold">Legg til i mappe</Text>
									<TouchableOpacity 
										onPress={handleHideFolderModal}
										className="p-2 -m-2"
									>
										<X size={24} className="text-muted-foreground" />
									</TouchableOpacity>
								</View>

								<View className="space-y-3 mb-6">
									<TouchableOpacity
										className="flex-row items-center p-4 rounded-xl bg-muted/50 active:bg-muted gap-2"
										onPress={() => handleAddToFolder(null)}
									>
										<Folder color="#fa8072" size={24} className="text-muted-foreground mr-4" />
										<Text className="text-base">Ingen mappe</Text>
									</TouchableOpacity>
									
									{folders?.map((folder) => (
										<TouchableOpacity
											key={folder.id}
											className="flex-row items-center p-4 rounded-xl bg-muted/50 active:bg-muted gap-2"
											onPress={() => handleAddToFolder(folder.id)}
										>
											<Folder size={24} className="text-muted-foreground mr-4" />
											<Text className="text-base">{folder.name}</Text>
										</TouchableOpacity>
									))}
								</View>

								<TouchableOpacity
									className="flex-row items-center justify-center p-4 rounded-xl bg-primary active:bg-primary/90 mb-2 gap-2"
									onPress={handleCreateNewFolder}
								>
									<Plus color="white" size={20} className="text-primary-foreground mr-3" />
									<Text className="text-base font-medium text-primary-foreground">Opprett ny mappe</Text>
								</TouchableOpacity>
							</View>
						</SafeAreaView>
					</Animated.View>
				</TouchableOpacity>
			</Modal>

			<Modal
				visible={showMenu}
				transparent
				animationType="none"
				onRequestClose={() => setShowMenu(false)}
			>
				<TouchableOpacity
					className="flex-1 bg-black/50"
					activeOpacity={1}
					onPress={() => setShowMenu(false)}
				>
					<Animated.View 
						className="absolute bottom-0 left-0 right-0 bg-background rounded-t-3xl"
						style={{
							transform: [{
								translateY: slideAnim.interpolate({
									inputRange: [0, 1],
									outputRange: [600, 0]
								})
							}]
						}}
					>
						<SafeAreaView edges={['bottom']}>
							<View className="p-4">
								<View className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6" />
								
								<View className="flex-row items-center justify-between mb-6 px-2">
									<Text className="text-xl font-semibold">Flytt til mappe</Text>
									<TouchableOpacity 
										onPress={() => setShowMenu(false)}
										className="p-2 -m-2"
									>
										<X size={24} className="text-muted-foreground" />
									</TouchableOpacity>
								</View>

								<View className="space-y-3">
									<TouchableOpacity
										className="flex-row items-center p-4 rounded-xl bg-muted/50 active:bg-muted"
										onPress={() => handleMoveToFolder(null)}
									>
										<Folder size={24} className="text-muted-foreground mr-4" />
										<Text className="text-base">Ingen mappe</Text>
									</TouchableOpacity>
									
									{folders?.filter(folder => folder.id !== currentFavorite?.folder_id).map((folder) => (
										<TouchableOpacity
											key={folder.id}
											className="flex-row items-center p-4 rounded-xl bg-muted/50 active:bg-muted"
											onPress={() => handleMoveToFolder(folder.id)}
										>
											<Folder size={24} className="text-muted-foreground mr-4" />
											<Text className="text-base">{folder.name}</Text>
										</TouchableOpacity>
									))}
								</View>
							</View>
						</SafeAreaView>
					</Animated.View>
				</TouchableOpacity>
			</Modal>
		</>
	);
}
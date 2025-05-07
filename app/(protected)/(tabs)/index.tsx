import { router } from "expo-router";
import { View, FlatList, ActivityIndicator } from "react-native";
import React, { useState, useEffect, useCallback, useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { H1, Muted } from "@/components/ui/typography";
import { FlashList, MasonryFlashList } from "@shopify/flash-list";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/config/supabase";
import ListingItem from "@/components/listing-item";
import { SafeAreaView } from "@/components/safe-area-view";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react-native";

const ITEMS_PER_PAGE = 20;

const fetchListings = async (searchText = "", page = 0) => {
	// Create a range for pagination
	const from = page * ITEMS_PER_PAGE;
	const to = from + ITEMS_PER_PAGE - 1;

	let query = supabase
		.from("listings")
		.select("*", { count: "exact" })
		.match({ is_published: true })
		.range(from, to);

	if (searchText) {
		// For short search terms, use startsWith for better performance
		if (searchText.length <= 3) {
			query = query.or(
				`title.ilike.${searchText}%, kommunenavn.ilike.${searchText}%`,
			);
		} else {
			// For longer terms, use contains
			query = query.or(
				`title.ilike.%${searchText}%, kommunenavn.ilike.%${searchText}%`,
			);
		}
	}

	// Order by most recent first for better UX
	query = query.order("created_at", { ascending: false });

	const { data, count } = await query.throwOnError();
	return { data: data || [], count: count || 0 };
};

export default function Home() {
	const [inputText, setInputText] = useState("");
	const [searchText, setSearchText] = useState("");
	const [page, setPage] = useState(0);
	const queryClient = useQueryClient();

	const StickyHeader = () => (
		<View className="flex-row gap-2 z-50">
			<Button
				variant="outline"
				className="rounded-full"
				onPress={() => navigateToCategory("borsen")}
			>
				<Text className="text-foreground">Børsen</Text>
			</Button>
			<Button
				variant="outline"
				className="rounded-full"
				onPress={() => navigateToCategory("vessel")}
			>
				<Text className="text-foreground">Fartøy</Text>
			</Button>
			<Button
				variant="outline"
				className="rounded-full"
				onPress={() => navigateToCategory("job")}
			>
				<Text className="text-foreground">Jobb</Text>
			</Button>
		</View>
	);

	// Increased debounce to 800ms for better performance
	useEffect(() => {
		const timeoutId = setTimeout(() => {
			setSearchText(inputText);
			setPage(0); // Reset to first page on new search
		}, 800);

		return () => clearTimeout(timeoutId);
	}, [inputText]);

	// Prefetch next page of results
	useEffect(() => {
		if (page > 0) {
			queryClient.prefetchQuery({
				queryKey: ["listings", searchText, page + 1],
				queryFn: () => fetchListings(searchText, page + 1),
			});
		}
	}, [page, searchText, queryClient]);

	// Use enabled flag to prevent initial load when not needed
	const {
		data: listingsData,
		isLoading,
		error,
		refetch,
	} = useQuery({
		queryKey: ["listings", searchText, page],
		queryFn: () => fetchListings(searchText, page),
		staleTime: 1000 * 60 * 5, // Cache results for 5 minutes
		refetchOnWindowFocus: false,
	});

	// Fetch initial data on component mount
	useEffect(() => {
		queryClient.prefetchQuery({
			queryKey: ["listings", "", 0],
			queryFn: () => fetchListings("", 0),
		});
	}, [queryClient]);

	// Navigate to category screens
	const navigateToCategory = (category: string) => {
		router.push(`/(protected)/category?type=${category}`);
	};

	const [refreshing, setRefreshing] = useState(false);

	const handleRefresh = useCallback(async () => {
		setRefreshing(true);
		setPage(0);
		await refetch();
		setRefreshing(false);
	}, [refetch]);

	const handleEndReached = useCallback(() => {
		if (listingsData && listingsData.data.length < listingsData.count) {
			setPage((prev) => prev + 1);
		}
	}, [listingsData]);

	// Memoize data to prevent unnecessary re-renders
	const filteredListings = useMemo(
		() => listingsData?.data || [],
		[listingsData],
	);

	if (isLoading && !refreshing && !listingsData) {
		return (
			<View className="flex-1 items-center justify-center">
				<ActivityIndicator />
			</View>
		);
	}

	if (error) {
		return <Text>{error.message}</Text>;
	}

	return (
		<SafeAreaView edges={["top"]} className="flex-1 bg-background">
			<View className="flex-1">
				{isLoading && refreshing ? (
					<View className="flex-1 items-center justify-center">
						<ActivityIndicator />
					</View>
				) : filteredListings.length > 0 ? (
					<MasonryFlashList
						disableHorizontalListHeightMeasurement
						ListEmptyComponent={() => (
							<View className="flex-1 items-center justify-center">
								<Text className="text-muted-foreground">
									Ingen annonser funnet
								</Text>
							</View>
						)}
						StickyHeaderComponent={StickyHeader}
						ListHeaderComponent={
							<View>
								<View className="p-2">
									<View className="relative w-full">
										<View className="absolute left-3 top-2.5 z-10">
											<Search
												color="#000"
												size={20}
												className="text-muted-foreground"
											/>
										</View>
										<Input
											className="rounded-lg mb-2 pl-10 w-full bg-[#E7F2F8]"
											placeholder="Søk etter annonser..."
											value={inputText}
											onChangeText={setInputText}
										/>
									</View>
								</View>
								<View className="p-2 bg-white">
									<View className="flex-row gap-2">
										<Button
											variant="outline"
											className="rounded-full"
											onPress={() => navigateToCategory("borsen")}
										>
											<Text className="text-foreground">Børsen</Text>
										</Button>
										<Button
											variant="outline"
											className="rounded-full"
											onPress={() => navigateToCategory("vessel")}
										>
											<Text className="text-foreground">Fartøy</Text>
										</Button>
										<Button
											variant="outline"
											className="rounded-full"
											onPress={() => navigateToCategory("job")}
										>
											<Text className="text-foreground">Jobb</Text>
										</Button>
									</View>
								</View>
							</View>
						}
						stickyHeaderIndices={[1]}
						data={filteredListings}
						onRefresh={handleRefresh}
						refreshing={refreshing}
						renderItem={({ item }) => <ListingItem listing={item} />}
						keyExtractor={(item) => item.id}
						numColumns={2}
						estimatedItemSize={200}
						onEndReached={handleEndReached}
						onEndReachedThreshold={0.5}
					/>
				) : (
					<View className="flex-1 items-center justify-center">
						<Text className="text-muted-foreground">Ingen annonser funnet</Text>
					</View>
				)}
			</View>
		</SafeAreaView>
	);
}

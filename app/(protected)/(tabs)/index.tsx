import { router } from "expo-router";
import { View, FlatList, ActivityIndicator } from "react-native";
import React from "react";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { H1, Muted } from "@/components/ui/typography";
import { FlashList, MasonryFlashList } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/config/supabase";
import ListingItem from "@/components/listing-item";
import { SafeAreaView } from "@/components/safe-area-view";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react-native";

const fetchListings = async () => {
	const { data } = await supabase
		.from('listings')
		.select('*', { count: 'exact' })
		.match({ is_published: true })
		.throwOnError();
	return data;
};

export default function Home() {
	const { data: listings, isLoading, error, refetch } = useQuery({
		queryKey: ['listings'],
		queryFn: fetchListings,
	});

	const [refreshing, setRefreshing] = React.useState(false);

	const handleRefresh = React.useCallback(async () => {
		setRefreshing(true);
		await refetch();
		setRefreshing(false);
	}, [refetch]);

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


	return (
		<SafeAreaView edges={['top']} className="flex-1 bg-background p-2">
				<View className="p-2 gap-2">
					<View className="relative w-full">
						<View className="absolute left-3 top-2.5 z-10">
							<Search color="#000" size={20} className="text-muted-foreground" />
						</View>
						<Input className="rounded-full mb-2 pl-10 w-full bg-[#E7F2F8]" placeholder="Søk etter annonser..." />
					</View>
							<View className="flex-row gap-2">
								<Button variant="outline" className="rounded-full">
									<Text>Børsen</Text>
								</Button>
								<Button variant="outline" className="rounded-full">
									<Text>Fartøy</Text>
								</Button>
								<Button variant="outline" className="rounded-full">
									<Text>Jobb</Text>
								</Button>
							</View>
						</View>
			<View className="flex-1">
			<MasonryFlashList
					data={listings}
					onRefresh={handleRefresh}
					refreshing={refreshing}
					renderItem={({ item }) => <ListingItem listing={item} />}
					keyExtractor={(item) => item.id}
					numColumns={2}
					estimatedItemSize={200}
				/>
			</View>
		</SafeAreaView>
	);
}

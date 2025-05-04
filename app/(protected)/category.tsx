import React from "react";
import { View, ActivityIndicator } from "react-native";
import { SafeAreaView } from "@/components/safe-area-view";
import { Text } from "@/components/ui/text";
import { H1 } from "@/components/ui/typography";
import { useLocalSearchParams, Stack, router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/config/supabase";
import { MasonryFlashList } from "@shopify/flash-list";
import ListingItem from "@/components/listing-item";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react-native";
const fetchCategoryListings = async (category: string) => {
  const { data } = await supabase
    .from('listings')
    .select('*', { count: 'exact' })
    .match({ is_published: true })
    .eq('type', category)
    .order('created_at', { ascending: false })
    .throwOnError();
  
  return data || [];
};

export default function CategoryScreen() {
  const { type } = useLocalSearchParams();
  const category = typeof type === 'string' ? type : '';
  
  const { data: listings, isLoading, error } = useQuery({
    queryKey: ['categoryListings', category],
    queryFn: () => fetchCategoryListings(category),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
  
  const categoryTitles: Record<string, string> = {
    'borsen': 'Børsen',
    'vessel': 'Fartøy',
    'job': 'Jobb'
  };
  
  const categoryTitle = categoryTitles[category] || category;
  
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
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <Stack.Screen options={{ title: categoryTitle }} />
      
      <View className=" flex-row gap-2 items-center">
        
            <Text onPress={() => router.back()}><ChevronLeft size={40} /></Text>
      
        <H1>{categoryTitle}</H1>
      </View>
      
      <View className="flex-1 px-2">
        {listings && listings.length > 0 ? (
          <MasonryFlashList
            data={listings}
            renderItem={({ item }) => <ListingItem listing={item} />}
            keyExtractor={(item) => item.id}
            numColumns={2}
            estimatedItemSize={200}
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="text-muted-foreground">Ingen annonser funnet i denne kategorien</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
} 
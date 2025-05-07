import { View, ActivityIndicator } from "react-native";
import { SafeAreaView } from "@/components/safe-area-view";
import { Text } from "@/components/ui/text";
import { H1 } from "@/components/ui/typography";
import { useLocalSearchParams, Stack, router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/config/supabase";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react-native";
import { Image } from "@/components/image";

const fetchListing = async (type: string, id: string) => {
  const { data, error } = await supabase
    .from(type)
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching listing:', error);
    throw error;
  }

  return data;
};

export default function ListingScreen() {
  const { type, id } = useLocalSearchParams();
  const listingType = typeof type === 'string' ? type : '';
  const listingId = typeof id === 'string' ? id : '';

  const { data: listing, isLoading, error } = useQuery({
    queryKey: ['listing', listingType, listingId],
    queryFn: () => fetchListing(listingType, listingId),
  });

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center">
          <Text className="text-destructive">Kunne ikke laste inn annonsen</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen options={{ title: listing?.title }} />
      
      <View className="flex-row gap-2 items-center px-4">
        <Button
          variant="ghost"
          size="icon"
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} />
        </Button>
        <H1 className="flex-1">{listing?.title}</H1>
      </View>

      <View className="flex-1 px-4">
        <Image
          source={{ uri: listing?.featured_image }}
          className="w-full h-64 rounded-lg mb-4"
          contentFit="cover"
        />

        <View className="gap-2">
          <Text className="text-muted-foreground">{listing?.kommunenavn}</Text>
          {listing?.price && (
            <Text className="font-semibold">
              Pris {listing.price.toLocaleString('nb-NO', { style: 'currency', currency: 'NOK' })}
            </Text>
          )}
          <Text>{listing?.description}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
} 
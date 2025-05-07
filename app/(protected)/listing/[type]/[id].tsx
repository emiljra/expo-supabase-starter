import { View, ActivityIndicator, ScrollView, RefreshControl, Dimensions, Pressable } from "react-native";
import { SafeAreaView } from "@/components/safe-area-view";
import { Text } from "@/components/ui/text";
import { H1 } from "@/components/ui/typography";
import { useLocalSearchParams, Stack, router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/config/supabase";
import { Button } from "@/components/ui/button";
import { ChevronLeft, MapPin, ChevronRight, X } from "lucide-react-native";
import { Image } from "@/components/image";
import { useState, useCallback } from "react";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import React from "react";

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Listing {
  id: string;
  title: string;
  featured_image: string;
  images?: string[];
  kommunenavn: string;
  price: number | null;
  description: string;
}

const fetchListing = async (type: string, id: string): Promise<Listing> => {
  // Map the type to the correct table name
  const tableMap = {
    'job': 'jobs',
    'vessel': 'vessels',
    'borsen': 'borsen'
  } as const;

  const tableName = tableMap[type as keyof typeof tableMap] || type;

  const { data, error } = await supabase
    .from(tableName)
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
  const [refreshing, setRefreshing] = useState(false);
  const [lightboxVisible, setLightboxVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { data: listing, isLoading, error, refetch } = useQuery({
    queryKey: ['listing', listingType, listingId],
    queryFn: () => fetchListing(listingType, listingId),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Skip first image (logo) for job listings
  const images = (() => {
    const allImages = (listing?.images || [listing?.featured_image]).filter((img): img is string => !!img);
    if (listingType === 'job' && allImages.length > 1) {
      return allImages.slice(1);
    }
    return allImages;
  })();

  const handleImagePress = (index: number) => {
    setCurrentImageIndex(index);
    setLightboxVisible(true);
  };

  const handleNext = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrevious = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const swipeGesture = Gesture.Pan()
    .onEnd((event) => {
      if (Math.abs(event.translationX) > 50) {
        if (event.translationX > 0) {
          handlePrevious();
        } else {
          handleNext();
        }
      }
    });

  if (isLoading && !refreshing) {
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
      
      <View className="flex-row gap-2 items-center px-4 py-2 border-b border-border">
        <Button
          variant="ghost"
          size="icon"
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} />
        </Button>
        <H1 className="flex-1 text-lg">{listing?.title}</H1>
      </View>

      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#000"
          />
        }
      >
        <View className="px-4 py-4">
          <Pressable onPress={() => handleImagePress(0)}>
            <Image
              source={{ uri: listing?.featured_image }}
              className="w-full h-72 rounded-xl mb-4"
              contentFit="cover"
            />
          </Pressable>

          {images.length > 1 && (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              className="mb-6"
            >
              {images.map((image, index) => (
                <Pressable 
                  key={index}
                  onPress={() => handleImagePress(index)}
                  className="mr-2"
                >
                  <Image
                    source={{ uri: image }}
                    className="w-20 h-20 rounded-lg"
                    contentFit="cover"
                  />
                </Pressable>
              ))}
            </ScrollView>
          )}

          <View className="gap-4">
            <View className="flex-row items-center gap-2">
              <MapPin size={16} className="text-muted-foreground" />
              <Text className="text-muted-foreground">{listing?.kommunenavn}</Text>
            </View>

            {listing?.price && (
              <View className="bg-muted/50 p-4 rounded-lg">
                <Text className="text-lg font-semibold">
                  {listing.price.toLocaleString('nb-NO', { style: 'currency', currency: 'NOK' })}
                </Text>
              </View>
            )}

            <View className="gap-2">
              <Text className="text-lg font-semibold">Beskrivelse</Text>
              <Text className="text-base leading-6">{listing?.description}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {lightboxVisible && (
        <Animated.View 
          entering={FadeIn} 
          exiting={FadeOut}
          className="absolute inset-0 bg-black z-50"
        >
          <GestureDetector gesture={swipeGesture}>
            <View className="flex-1">
              <Pressable 
                onPress={() => setLightboxVisible(false)}
                className="absolute top-12 right-4 z-10 p-2"
              >
                <X size={24} color="white" />
              </Pressable>

              <View className="flex-1 justify-center">
                <Image
                  source={{ uri: images[currentImageIndex] }}
                  className="w-full h-full"
                  contentFit="contain"
                />
              </View>

              {images.length > 1 && (
                <>
                  <Pressable 
                    onPress={handlePrevious}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2"
                  >
                    <ChevronLeft size={32} color="white" />
                  </Pressable>

                  <Pressable 
                    onPress={handleNext}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2"
                  >
                    <ChevronRight size={32} color="white" />
                  </Pressable>

                  <View className="absolute bottom-12 left-0 right-0 flex-row justify-center gap-2">
                    {images.map((_, index) => (
                      <View
                        key={index}
                        className={`w-2 h-2 rounded-full ${
                          index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </View>
                </>
              )}
            </View>
          </GestureDetector>
        </Animated.View>
      )}
    </SafeAreaView>
  );
} 
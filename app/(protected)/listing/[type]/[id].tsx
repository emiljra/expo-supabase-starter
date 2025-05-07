import { View, ActivityIndicator, ScrollView, RefreshControl, Dimensions, Pressable } from "react-native";
import { SafeAreaView } from "@/components/safe-area-view";
import { Text } from "@/components/ui/text";
import { H1 } from "@/components/ui/typography";
import { useLocalSearchParams, Stack, router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/config/supabase";
import { Button } from "@/components/ui/button";
import { ChevronLeft, MapPin } from "lucide-react-native";
import { Image } from "@/components/image";
import { useState, useCallback, useMemo } from "react";
import React from "react";
import ImageView from "react-native-image-viewing";
import RenderHtml from 'react-native-render-html';
import CompanyCard from "@/components/company-card";

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const THUMBNAIL_SIZE = 80;

interface Listing {
  id: string;
  title: string;
  featured_image: string;
  images?: string[];
  kommunenavn: string;
  price: number | null;
  description: string;
  company?: {
    company_logo: string;
    company_name: string;
    about_company: string;
    company_url: string;
    isVerified: boolean;
    org_nr: string;
    companyBranding?: {
      brandColors?: {
        backgroundColor?: string;
        textColor?: string;
      };
    };
  };
  contact_person?: Array<{
    full_name: string;
    job_title: string;
    phone: string;
    email: string;
  }>;
  application_url?: string;
}

const fetchListing = async (type: string, id: string): Promise<Listing> => {
  const tableMap = {
    'job': 'jobs',
    'vessel': 'vessel',
    'borsen': 'borsen'
  } as const;

  const tableName = tableMap[type as keyof typeof tableMap] || type;

  // 1. Fetch the listing with nested company and branding
  const { data, error } = await supabase
    .from(tableName)
    .select(`
      *,
      company:company_id (
        *,
        companyBranding (*)
      )
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  if (!data) throw new Error('No data found');

  // 2. Fetch contact person profiles if needed
  const contactPersonIds = Array.isArray(data.contact_person) ? data.contact_person : [];
  if (contactPersonIds.length > 0) {
    const profilesResponse = await supabase
      .from('profiles')
      .select('*')
      .in('id', contactPersonIds);

    data.contact_person = profilesResponse.data || [];
  } else {
    data.contact_person = [];
  }

  return data;
};

export default function ListingScreen() {
  const { type, id } = useLocalSearchParams();
  const listingType = typeof type === 'string' ? type : '';
  const listingId = typeof id === 'string' ? id : '';
  const [refreshing, setRefreshing] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
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

  // Skip first image (logo) for job listings and memoize the result
  const images = useMemo(() => {
    const allImages = (listing?.images || [listing?.featured_image]).filter((img): img is string => !!img);
    if (listingType === 'job' && allImages.length > 1) {
      return allImages.slice(1);
    }
    return allImages;
  }, [listing?.images, listing?.featured_image, listingType]);

  const imageUrls = useMemo(() => 
    images.map(url => ({ uri: url })),
    [images]
  );

  const handleImagePress = useCallback((index: number) => {
    setCurrentImageIndex(index);
    setImageViewerVisible(true);
  }, []);

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
              cachePolicy="memory-disk"
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
                    cachePolicy="memory-disk"
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
              <RenderHtml
                contentWidth={SCREEN_WIDTH - 32} // Account for padding
                source={{ html: listing?.description || '' }}
                tagsStyles={{
                  p: { marginBottom: 8 },
                  br: { marginBottom: 4 },
                  ul: { marginBottom: 8 },
                  li: { marginBottom: 4 },
                  strong: { fontWeight: 'bold' },
                  em: { fontStyle: 'italic' }
                }}
                defaultTextProps={{
                  style: { color: '#000', fontSize: 16, lineHeight: 24 }
                }}
              />
            </View>
          </View>
        </View>
        {listing?.company && listing?.contact_person && (
          <CompanyCard data={{
            company_id: listing.company,
            contact_person: listing.contact_person,
            application_url: listing.application_url,
          }} listingType={listingType} />
        )}
      </ScrollView>

      <ImageView
        images={imageUrls}
        imageIndex={currentImageIndex}
        visible={imageViewerVisible}
        onRequestClose={() => setImageViewerVisible(false)}
        swipeToCloseEnabled={true}
        doubleTapToZoomEnabled={true}
        presentationStyle="overFullScreen"
        animationType="fade"
      />
    </SafeAreaView>
  );
} 
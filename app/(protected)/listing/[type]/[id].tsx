import { View, ActivityIndicator, ScrollView, RefreshControl, Dimensions, Pressable, TouchableOpacity } from "react-native";
import { SafeAreaView } from "@/components/safe-area-view";
import { Text } from "@/components/ui/text";
import { H1 } from "@/components/ui/typography";
import { useLocalSearchParams, Stack, router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/config/supabase";
import { Button } from "@/components/ui/button";
import { Bookmark, ChevronLeft, MapPin } from "lucide-react-native";
import { Image } from "@/components/image";
import { useState, useCallback, useMemo } from "react";
import React from "react";
import ImageView from "react-native-image-viewing";
import RenderHtml from 'react-native-render-html';
import CompanyCard from "@/components/company-card";
import Carousel from 'react-native-reanimated-carousel';
import ListingMeta from "@/components/listing-meta";
import { cn } from "@/lib/utils";
import { useFavorites, useAddFavorite, useRemoveFavorite } from "@/lib/hooks";

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const THUMBNAIL_SIZE = 80;

export interface BaseListing {
  id: string;
  title: string;
  featured_image: string;
  images?: string[];
  kommune_fk: {
    kommunenavn: string;
  };
  price: number | null;
  description: string;
  company_id?: {
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
  application_due?: string;
}

export interface JobListing extends BaseListing {
  type: 'job';
}

export interface BorsenListing extends BaseListing {
  type: 'borsen';
  borsen_category?: string;
}

export interface VesselListing extends BaseListing {
  type: 'vessel';
}

export type Listing = JobListing | BorsenListing | VesselListing;

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
    .select(
      `
        *,
        company_id (
          *,
          companyBranding (*)
        ),
        fylke_fk (
          fylkesnavn
        ),
        kommune_fk (
          kommunenavn
        )
      `
    )
    .eq('id', id)
    .single()
    .throwOnError();

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

  // Add the type field to the data
  const listingWithType = {
    ...data,
    type: type as 'job' | 'borsen' | 'vessel'
  };

  return listingWithType;
};

export default function ListingScreen() {
  const { type, id } = useLocalSearchParams();
  const listingType = typeof type === 'string' ? type : '';
  const listingId = typeof id === 'string' ? id : '';
  const [refreshing, setRefreshing] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const { data: favorites } = useFavorites();
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();

  const isFavorite = favorites?.some(favorite => {
    if (listingType === 'job') return favorite.job_id === listingId;
    if (listingType === 'vessel') return favorite.vessel_id === listingId;
    if (listingType === 'borsen') return favorite.borsen_id === listingId;
    return false;
  });

  const currentFavorite = favorites?.find(f => {
    if (listingType === 'job') return f.job_id === listingId;
    if (listingType === 'vessel') return f.vessel_id === listingId;
    if (listingType === 'borsen') return f.borsen_id === listingId;
    return false;
  });

  const handleFavorite = useCallback(async () => {
    try {
      if (isFavorite) {
        if (currentFavorite) {
          await removeFavorite.mutateAsync(currentFavorite.id);
        }
      } else {
        await addFavorite.mutateAsync({
          listing_type: listingType as 'job' | 'vessel' | 'borsen',
          job_id: listingType === 'job' ? listingId : null,
          vessel_id: listingType === 'vessel' ? listingId : null,
          borsen_id: listingType === 'borsen' ? listingId : null,
          folder_id: null,
          listing: null
        });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  }, [isFavorite, currentFavorite, listingType, listingId, addFavorite, removeFavorite]);

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
      
      <View>

      <View className="flex-row items-center px-2 py-2 border-b border-border">
        <Button
          variant="link"
          size="sm"
          className="flex-row items-center px-0"
          onPress={() => router.back()}
          >
          <ChevronLeft size={24} />
          
       <Text className="text-lg">Tilbake</Text>
        </Button>
      </View>
          <View className="absolute right-4 top-2 z-10">
            <TouchableOpacity
              onPress={handleFavorite}
              className={cn(
                "p-2 rounded-full bg-background",
                
              )}
            >
              <Bookmark 
                size={24} 
                color={"#fa8072"}
                fill={isFavorite ? "#fa8072" : "none"}
                className={cn(
                  "text-foreground",
                  isFavorite && "text-primary-foreground"
                )}
              />
            </TouchableOpacity>
          </View>

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
          <View>
            <Carousel
              width={SCREEN_WIDTH - 32}
              height={288}
              data={images}
              onSnapToItem={setCarouselIndex}
              renderItem={({ item, index }) => (
                <Pressable onPress={() => handleImagePress(index)}>
                  <Image
                    source={{ uri: item }}
                    className="w-full h-72 rounded-lg"
                    contentFit="cover"
                    cachePolicy="memory-disk"
                  />
                  <View style={{ position: 'absolute', top: 12, right: 16, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 }}>
                    <Text style={{ color: '#fff', fontSize: 14 }}>{index + 1}/{images.length}</Text>
                  </View>
                </Pressable>
              )}
              style={{ borderRadius: 8, marginBottom: 8 }}
              loop={false}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: -30, marginBottom: 16 }}>
              {images.length <= 6 ? (
                // Show all dots if 6 or fewer images
                images.map((_, idx) => (
                  <View
                    key={idx}
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 6,
                      marginHorizontal: 2,
                      backgroundColor: idx === carouselIndex ? '#222' : '#ccc',
                    }}
                  />
                ))
              ) : (
                // Show 6 dots with current position indicator
                Array.from({ length: 6 }).map((_, idx) => {
                  const dotPosition = Math.floor((carouselIndex / (images.length - 1)) * 5);
                  const isActive = idx === dotPosition;
                  return (
                    <View
                      key={idx}
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 6,
                        marginHorizontal: 2,
                        backgroundColor: isActive ? '#222' : '#ccc',
                      }}
                    />
                  );
                })
              )}
            </View>
            <View className="flex-row items-center gap-2">
              <H1 className="text-lg text-balance">{listing?.title}</H1>
            </View>
          </View>
          {listing && (
            <ListingMeta data={listing} type={listingType as 'job' | 'borsen' | 'vessel'} />
          )}
          <View className="gap-4">
            {listing?.price && (
              <View className="bg-muted/50 p-4 rounded-lg">
                <Text className="text-lg font-semibold">
                  {listing.price.toLocaleString('nb-NO', { style: 'currency', currency: 'NOK' })}
                </Text>
              </View>
            )}

            <View className="gap-2 mt-4">
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
        {listing?.company_id && listing?.contact_person && (
          <CompanyCard data={{
            company_id: listing.company_id,
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
        FooterComponent={({ imageIndex }) => (
          <View style={{ position: 'absolute', top: 40, right: 24, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ color: '#fff', fontSize: 16 }}>{(imageIndex ?? 0) + 1}/{images.length}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
} 
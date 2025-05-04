import { View, TouchableOpacity } from "react-native";
import { Text } from "./ui/text";
import { Image } from "./image";

interface Listing {
	title: string;
	featured_image: string;
    kommunenavn: string;
    price: number | null;
}

export default function ListingItem({ listing }: { listing: Listing }) {
	return (
		<TouchableOpacity 
			className="p-1 rounded-lg shadow overflow-hidden mb-4 bg-background active:bg-[#E7F2F8] dark:active:bg-[#23245A]"
			activeOpacity={1}
		>
			<Image
				source={{ uri: listing.featured_image }}
				className="w-full h-40 rounded-lg border object-contain border-[#E7F2F8]"
				contentFit="cover"
			/>
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
	);
}
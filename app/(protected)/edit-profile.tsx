import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ActivityIndicator, Alert, View } from "react-native";
import * as z from "zod";

import { SafeAreaView } from "@/components/safe-area-view";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormInput } from "@/components/ui/form";
import { Text } from "@/components/ui/text";
import { H1 } from "@/components/ui/typography";
import { useAuth } from "@/context/supabase-provider";
import { supabase } from "@/config/supabase";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import Avatar from "@/app/components/Avatar";

const formSchema = z.object({
	email: z.string().email("Vennligst skriv inn en gyldig e-postadresse."),
	phone: z.string().min(8, "Telefonnummer må være minst 8 tegn."),
	job_title: z.string().min(1, "Stillingstittel må være minst 1 tegn."),
	avatar_url: z.string().optional(),
});

export default function EditProfile() {
	const { session } = useAuth();
	const queryClient = useQueryClient();

	const fetchProfiles = async () => {
		const { data } = await supabase
			.from("profiles")
			.select("*")
			.eq("id", session?.user.id)
			.throwOnError();
		return data;
	};

	const {
		data: profiles,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["profiles"],
		queryFn: fetchProfiles,
	});

	const defaultValues = {
		email: profiles?.[0]?.email || "",
		phone: profiles?.[0]?.phone || "",
		job_title: profiles?.[0]?.job_title || "",
		avatar_url: profiles?.[0]?.avatar_url || "",
	};

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues,
		values: defaultValues,
	});

	const updateProfile = async (data: z.infer<typeof formSchema>) => {
		const { data: updatedProfile, error } = await supabase
			.from("profiles")
			.update(data)
			.eq("id", session?.user.id)
			.throwOnError();
	};

	const { mutate, isPending } = useMutation({
		mutationFn: updateProfile,
		onSuccess: () => {
			router.back();
			
			// Get the current form values before resetting
			const avatarUrl = form.getValues("avatar_url");
			
			// Reset form after success
			form.reset();
			
			// Invalidate the profiles query
			queryClient.invalidateQueries({ queryKey: ["profiles"] });
			
			// If the avatar URL was updated, invalidate that specific cache
			if (avatarUrl) {
				const cacheKey = `avatar-${avatarUrl}`;
				console.log('Invalidating avatar cache for key:', cacheKey);
				queryClient.invalidateQueries({ queryKey: [cacheKey] });
			}
		},
		onError: (error) => {
			console.error('Profile update error:', error);
			Alert.alert("Feil", error.message);
		},
	});

	const onSubmit = (data: z.infer<typeof formSchema>) => {
		mutate(data);
	};

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
		<SafeAreaView className="flex-1 bg-background p-4" edges={["bottom"]}>
			<View className="flex-1 gap-4 web:m-4">
				<H1 className="self-start">Rediger profil</H1>
				<Form {...form}>
					<View className="gap-4">
						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormInput
									label="E-post"
									placeholder="E-post"
									autoCapitalize="none"
									autoComplete="email"
									autoCorrect={false}
									keyboardType="email-address"
									{...field}
								/>
							)}
						/>
						<FormField
							control={form.control}
							name="phone"
							render={({ field }) => (
								<FormInput
									label="Telefon"
									placeholder="Telefon"
									autoCapitalize="none"
									autoCorrect={false}
									
									{...field}
								/>
							)}
						/>
							<FormField
							control={form.control}
							name="job_title"
							render={({ field }) => (
								<FormInput
									label="Stillingstittel"
									placeholder="Stillingstittel"
									autoCapitalize="none"
									autoCorrect={false}
									
									{...field}
								/>
							)}
						/>
						<FormField
							control={form.control}
							name="avatar_url"
							render={({ field }) => (
								<View>
									<Text className="mb-2 text-sm font-medium">Profilbilde</Text>
									<Avatar
										size={120}
										url={field.value || null}
										onUpload={(url: string) => {
											console.log('Avatar uploaded, setting form value to:', url);
											// If the URL contains a file extension, log it for debugging
											if (url.includes('.')) {
												console.log('Warning: URL contains file extension, this might need to be updated');
											}
											form.setValue("avatar_url", url);
										}}
										userId={session?.user.id || ""}
									/>
								</View>
							)}
						/>
					</View>
				</Form>
			</View>
			<Button
				size="default"
				variant="default"
				onPress={form.handleSubmit(onSubmit)}
				disabled={isPending}
				className="web:m-4"
			>
				{form.formState.isSubmitting ? (
					<ActivityIndicator size="small" />
				) : (
					<Text>Lagre</Text>
				)}
			</Button>
		</SafeAreaView>
	);
}

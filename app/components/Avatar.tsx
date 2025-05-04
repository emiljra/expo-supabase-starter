import { useState, useEffect } from 'react';
import { StyleSheet, View, Alert, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from '@/config/supabase';
import { Text } from '@/components/ui/text';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';

interface Props {
  size: number;
  url: string | null;
  onUpload: (filePath: string) => void;
  userId: string;
}

export default function Avatar({ url, size = 150, onUpload, userId }: Props) {
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const avatarSize = { height: size, width: size };
  const queryClient = useQueryClient();
  
  // Generate cache key from the full URL path
  const getCacheKey = (path: string | null) => {
    return path ? `avatar-${path}` : null;
  };
  
  const cacheKey = getCacheKey(url);

  useEffect(() => {
    if (url) {
      // First check if it's already in the cache
      const currentCacheKey = getCacheKey(url);
      if (currentCacheKey) {
        const cachedImage = queryClient.getQueryData([currentCacheKey]);
        if (cachedImage) {
          setAvatarUrl(cachedImage as string);
          return;
        }
      }
      
      downloadImage(url);
    }
  }, [url, queryClient]);

  async function downloadImage(path: string) {
    try {
      console.log('Downloading image from path:', path);
      
      // Check if the path exists first
      const { data: fileInfo, error: listError } = await supabase.storage
        .from('avatars')
        .list(path.split('/')[0]);
        
      if (listError) {
        console.error('Error listing files:', listError.message);
      } else {
        console.log('Files in directory:', fileInfo);
        const exactFile = fileInfo.find(f => path.endsWith(f.name));
        if (!exactFile) {
          console.warn('File not found in directory listing');
        } else {
          console.log('Found file:', exactFile);
        }
      }
      
      const { data, error } = await supabase.storage.from('avatars').download(path);

      if (error) {
        console.error('Error downloading image:', error.message, error);
        
        // Try to download without file extension as fallback
        if (path.includes('.')) {
          const basePath = path.substring(0, path.lastIndexOf('.'));
          console.log('Trying fallback path without extension:', basePath);
          
          const { data: fallbackData, error: fallbackError } = await supabase.storage
            .from('avatars')
            .download(basePath);
            
          if (fallbackError) {
            console.error('Fallback download failed:', fallbackError.message);
            throw fallbackError;
          }
          
          console.log('Fallback download successful');
          
          const fr = new FileReader();
          fr.readAsDataURL(fallbackData);
          fr.onload = () => {
            const imageData = fr.result as string;
            setAvatarUrl(imageData);
            
            // Store in React Query cache
            const currentCacheKey = getCacheKey(path);
            if (currentCacheKey) {
              console.log('Storing image in cache with key:', currentCacheKey);
              queryClient.setQueryData([currentCacheKey], imageData);
            }
          };
          
          return;
        }
        
        throw error;
      }

      const fr = new FileReader();
      fr.readAsDataURL(data);
      fr.onload = () => {
        const imageData = fr.result as string;
        setAvatarUrl(imageData);
        
        // Store in React Query cache
        const currentCacheKey = getCacheKey(path);
        if (currentCacheKey) {
          console.log('Storing image in cache with key:', currentCacheKey);
          queryClient.setQueryData([currentCacheKey], imageData);
        }
      };
    } catch (error) {
      console.error('Download image error:', error);
      if (error instanceof Error) {
        console.log('Error downloading image: ', error.message, error.stack);
      }
    }
  }

  async function uploadAvatar() {
    try {
      setUploading(true);
      console.log('Starting avatar upload, userId:', userId);

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsMultipleSelection: false,
        allowsEditing: true,
        quality: 1,
        exif: false,
        aspect: [1, 1],
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        console.log('User cancelled image picker.');
        return;
      }

      const image = result.assets[0];
      console.log('Got image:', image.uri, 'width:', image.width, 'height:', image.height, 'type:', image.mimeType);

      if (!image.uri) {
        throw new Error('No image uri!');
      }

      // Set the preview image immediately after selection
      setAvatarUrl(image.uri);

      // Determine output format based on original image
      const originalFormat = image.mimeType?.split('/')[1]?.toLowerCase() || '';
      let outputFormat = ImageManipulator.SaveFormat.JPEG; // Default
      let contentType = 'image/jpeg';
      
      // Support different formats while keeping size manageable
      if (originalFormat === 'png' || originalFormat === 'gif') {
        outputFormat = ImageManipulator.SaveFormat.PNG;
        contentType = 'image/png';
      } else if (originalFormat === 'heic' || originalFormat === 'heif') {
        // For HEIC, we'll preserve it if possible (though we'll still resize it)
        contentType = 'image/heic';
      }

      // Resize the image to reduce file size
      console.log('Resizing image to format:', outputFormat);
      const manipResult = await ImageManipulator.manipulateAsync(
        image.uri,
        [{ resize: { width: 500, height: 500 } }],
        { compress: 0.7, format: outputFormat }
      );
      
      console.log('Image resized:', manipResult.uri, 'width:', manipResult.width, 'height:', manipResult.height);
      
      // Update preview with the resized image
      setAvatarUrl(manipResult.uri);

      // Convert the image to binary data for upload
      console.log('Converting image to blob...');
      const response = await fetch(manipResult.uri);
      const blob = await response.blob();
      console.log('Blob created, size:', blob.size);

      // Always use the same path regardless of file format
      const path = `${userId}/avatar`;
      console.log('Uploading to path:', path, 'content type:', contentType);
      
      let uploadData;
      let uploadError;
      
      // Try the direct upload with the blob
      console.log('Attempting upload with blob...');
      const uploadResult = await supabase.storage
        .from('avatars')
        .upload(path, blob, {
          contentType: contentType,
          upsert: true, // Use upsert to replace if exists
        });
        
      uploadData = uploadResult.data;
      uploadError = uploadResult.error;

      if (uploadError) {
        console.error('Upload error:', uploadError);
        
        // If blob upload failed, try with a simple fetch request
        if (uploadError.message.includes('413') || uploadError.message.includes('too large')) {
          console.log('Payload too large. Trying direct fetch to a signed URL instead...');
          
          // Get a signed URL for direct upload
          const { data: signedUrlData, error: signedUrlError } = await supabase.storage
            .from('avatars')
            .createSignedUploadUrl(path);
            
          if (signedUrlError) {
            console.error('Error getting signed URL:', signedUrlError);
            throw signedUrlError;
          }
          
          // Upload directly to the signed URL
          const { signedUrl, token } = signedUrlData;
          console.log('Got signed URL:', signedUrl);
          
          const uploadResponse = await fetch(signedUrl, {
            method: 'PUT',
            headers: { 'Content-Type': contentType },
            body: blob
          });
          
          if (!uploadResponse.ok) {
            console.error('Error uploading to signed URL:', uploadResponse.status, await uploadResponse.text());
            throw new Error(`Upload failed with status: ${uploadResponse.status}`);
          }
          
          console.log('Upload with signed URL successful:', uploadResponse.status);
          uploadData = { path };
        } else {
          // Try removing the existing file first
          try {
            console.log('Trying to remove existing file before upload');
            const { data: removeData, error: removeError } = await supabase.storage
              .from('avatars')
              .remove([path]);
              
            if (removeError) {
              console.error('Error removing file:', removeError);
            } else {
              console.log('File removed successfully, attempting upload again');
              // Try upload again
              const retryResult = await supabase.storage
                .from('avatars')
                .upload(path, blob, {
                  contentType: contentType,
                });
                
              if (retryResult.error) {
                console.error('Retry upload failed:', retryResult.error);
                throw retryResult.error;
              }
              
              uploadData = retryResult.data;
              uploadError = null;
            }
          } catch (removeException) {
            console.error('Error during remove and retry:', removeException);
            throw uploadError; // Throw the original error
          }
        }
      }

      if (!uploadData) {
        throw new Error('Upload succeeded but no data was returned');
      }

      console.log('Upload successful, data:', uploadData);

      // Invalidate the old cache key if it exists
      if (cacheKey) {
        console.log('Invalidating old cache key:', cacheKey);
        queryClient.invalidateQueries({ queryKey: [cacheKey] });
      }
      
      // Also invalidate the new cache key to ensure fresh data
      const newCacheKey = getCacheKey(uploadData.path);
      if (newCacheKey) {
        console.log('Invalidating new cache key:', newCacheKey);
        queryClient.invalidateQueries({ queryKey: [newCacheKey] });
      }
      
      onUpload(uploadData.path);
      console.log('Avatar updated successfully with path:', uploadData.path);
    } catch (error) {
      console.error('Avatar upload error:', error);
      if (error instanceof Error) {
        Alert.alert('Upload Failed', `Error: ${error.message}. Please try again.`);
      } else {
        Alert.alert('Upload Failed', 'An unknown error occurred. Please try again.');
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <TouchableOpacity 
      onPress={uploadAvatar}
      disabled={uploading}
      activeOpacity={0.8}
      style={{ width: size, height: size, position: 'relative' }}
    >
      {avatarUrl ? (
        <React.Fragment>
          <Image
            source={{ uri: avatarUrl }}
            accessibilityLabel="Avatar"
            style={[avatarSize, styles.avatar, styles.image]}
          />
          <View 
            style={styles.pencilIcon}
            className="bg-primary rounded-full p-1"
          >
            <Ionicons name="pencil" size={16} color="#fff" />
          </View>
          {uploading && (
            <View 
              style={styles.uploadingOverlay}
              className="items-center justify-center"
            >
              <ActivityIndicator color="#ffffff" />
            </View>
          )}
        </React.Fragment>
      ) : (
        <View style={[avatarSize, styles.avatar, styles.noImage]} className="items-center justify-center">
          {uploading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <React.Fragment>
              <Ionicons name="image-outline" size={24} color="#aaa" />
              <Text className="text-xs text-neutral-400 mt-1">Last opp bilde</Text>
            </React.Fragment>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  avatar: {
    borderRadius: 8,
    overflow: 'hidden',
    maxWidth: '100%',
  },
  image: {
    objectFit: 'cover',
    paddingTop: 0,
  },
  noImage: {
    backgroundColor: '#333',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgb(200, 200, 200)',
    borderRadius: 5,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pencilIcon: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    zIndex: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  }
}); 
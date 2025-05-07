import React, { useState } from "react";
import { View, Text, Pressable, Alert, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFavoriteFolders, useDeleteFavoriteFolder, useRenameFavoriteFolder } from "@/lib/hooks";
import { FavoriteFolder } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Text as UIText } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { Folder, MoreVertical, Pencil, Trash2 } from "lucide-react-native";

interface FavoriteFolderItemProps {
  folder: FavoriteFolder;
  isSelected: boolean;
  onPress: (folder: FavoriteFolder) => void;
}

export default function FavoriteFolderItem({ folder, isSelected, onPress }: FavoriteFolderItemProps) {
  const [showMenu, setShowMenu] = useState(false);
  const { refetch } = useFavoriteFolders();
  const deleteFolder = useDeleteFavoriteFolder();
  const renameFolder = useRenameFavoriteFolder();

  const handleRename = () => {
    Alert.prompt(
      "Endre mappenavn",
      "Skriv inn nytt navn for mappen",
      [
        {
          text: "Avbryt",
          style: "cancel",
        },
        {
          text: "Endre",
          onPress: (newName) => {
            if (newName && newName.trim() !== folder.name) {
              renameFolder.mutate({ id: folder.id, name: newName.trim() });
            }
          },
        },
      ],
      "plain-text",
      folder.name
    );
    setShowMenu(false);
  };

  const handleDelete = () => {
    Alert.alert(
      "Slett mappe",
      `Er du sikker på at du vil slette mappen "${folder.name}"?`,
      [
        {
          text: "Avbryt",
          style: "cancel",
        },
        {
          text: "Slett",
          style: "destructive",
          onPress: () => deleteFolder.mutate(folder.id),
        },
      ]
    );
    setShowMenu(false);
  };

  return (
    <View>
      <Pressable
        onPress={() => onPress(folder)}
        onLongPress={() => setShowMenu(true)}
        className={cn(
          "flex-row items-center px-4 py-2 rounded-full mr-2",
          isSelected ? "bg-primary" : "bg-muted/50"
        )}
      >
        <Folder
          size={16}
          color={isSelected ? "#ffffff" : "#000000"}
        />
        <Text
          className={cn(
            "ml-2 text-sm",
            isSelected ? "text-primary-foreground" : "text-foreground"
          )}
        >
          {folder.name}
        </Text>
      </Pressable>

      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <Pressable 
          className="flex-1 bg-black/20"
          onPress={() => setShowMenu(false)}
        >
          <View className="flex-1 justify-center items-center">
            <View className="bg-background rounded-xl shadow-lg overflow-hidden border border-border w-72">
              <Pressable
                onPress={handleRename}
                className="flex-row items-center px-6 py-4 border-b border-border active:bg-muted/50"
              >
                <Pencil size={20} className="text-foreground" />
                <Text className="ml-4 text-base">Endre navn</Text>
              </Pressable>
              <Pressable
                onPress={handleDelete}
                className="flex-row items-center px-6 py-4 active:bg-muted/50"
              >
                <Trash2 size={20} className="text-destructive" />
                <Text className="ml-4 text-base text-destructive">Slett</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
} 
import React, { useState, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Platform,
  Image,
  ActionSheetIOS,
  Linking,
} from "react-native";
import { router } from "expo-router";
import { Plus, Search, Trash2, User, Building, Mail, Phone, CreditCard, Clock } from "lucide-react-native";

import { useCards } from "@/providers/CardProvider";
import { BusinessCard } from "@/types/card";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const { cards, deleteCard, refetch } = useCards();
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const filteredCards = useMemo(() => {
    if (!searchQuery.trim()) return cards;
    
    const query = searchQuery.toLowerCase();
    return cards.filter(card => 
      card.name?.toLowerCase().includes(query) ||
      card.company?.toLowerCase().includes(query) ||
      card.email?.toLowerCase().includes(query) ||
      card.officePhone?.toLowerCase().includes(query) ||
      card.cellPhone?.toLowerCase().includes(query) ||
      card.faxPhone?.toLowerCase().includes(query)
    );
  }, [cards, searchQuery]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleDelete = (card: BusinessCard) => {
    Alert.alert(
      "Delete Card",
      `Are you sure you want to delete ${card.name || 'this card'}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => deleteCard(card.id)
        }
      ]
    );
  };

  const handleAddCard = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Use Photo', 'Add Manually'],
          cancelButtonIndex: 0,
          title: 'Add Business Card',
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            router.push({ pathname: '/scan', params: { mode: 'camera' } });
          } else if (buttonIndex === 2) {
            router.push('/manual-entry' as any);
          }
        }
      );
    } else {
      Alert.alert(
        'Add Business Card',
        'Choose how you want to add a business card:',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Use Photo', onPress: () => router.push({ pathname: '/scan', params: { mode: 'camera' } }) },
          { text: 'Add Manually', onPress: () => router.push('/manual-entry' as any) },
        ]
      );
    }
  };

  const handleLinkedInPress = async (linkedinUrl: string) => {
    try {
      if (!linkedinUrl || (!linkedinUrl.startsWith('http://') && !linkedinUrl.startsWith('https://'))) {
        console.error('Invalid LinkedIn URL format:', linkedinUrl);
        return;
      }

      if (Platform.OS === 'web') {
        try {
          window.open(linkedinUrl, '_blank');
          return;
        } catch (webError) {
          console.error('Error opening LinkedIn on web:', webError);
          return;
        }
      }

      try {
        const supported = await Linking.canOpenURL(linkedinUrl);
        if (supported) {
          await Linking.openURL(linkedinUrl);
        } else {
          throw new Error('URL not supported');
        }
      } catch (error) {
        console.error('Error opening LinkedIn URL:', error);
      }
    } catch (error) {
      console.error('Error in handleLinkedInPress:', error);
    }
  };

  const renderCard = ({ item }: { item: BusinessCard }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => router.push({ pathname: '/card/[id]', params: { id: item.id } })}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            {item.profilePhotoUrl ? (
              <Image 
                source={{ uri: item.profilePhotoUrl }}
                style={styles.avatarImage}
                defaultSource={require('@/assets/images/icon.png')}
              />
            ) : (
              <User size={24} color="#6B7280" />
            )}
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardName}>{item.name || "No Name"}</Text>
            {item.title && <Text style={styles.cardTitle}>{item.title}</Text>}
            {item.company && (
              <View style={styles.infoRow}>
                <Building size={14} color="#9CA3AF" />
                <Text style={styles.cardCompany}>{item.company}</Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.cardDetails}>
          {item.email && (
            <View style={styles.detailRow}>
              <Mail size={14} color="#9CA3AF" />
              <Text style={styles.detailText} numberOfLines={1}>{item.email}</Text>
            </View>
          )}
          {item.officePhone && (
            <View style={styles.detailRow}>
              <Phone size={14} color="#9CA3AF" />
              <Text style={styles.detailText} numberOfLines={1}>Office: {item.officePhone}</Text>
            </View>
          )}
          {item.cellPhone && (
            <View style={styles.detailRow}>
              <Phone size={14} color="#9CA3AF" />
              <Text style={styles.detailText} numberOfLines={1}>Cell: {item.cellPhone}</Text>
            </View>
          )}
          {item.faxPhone && (
            <View style={styles.detailRow}>
              <Phone size={14} color="#9CA3AF" />
              <Text style={styles.detailText} numberOfLines={1}>Fax: {item.faxPhone}</Text>
            </View>
          )}
          {item.createdAt && (
            <View style={styles.detailRow}>
              <Clock size={14} color="#9CA3AF" />
              <Text style={styles.detailText}>
                {new Date(item.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </View>
          )}
          {item.linkedinUrl && (
            <View style={styles.detailRow}>
              <View style={styles.linkedinIcon}>
                <Text style={styles.linkedinText}>in</Text>
              </View>
              <Text style={styles.detailText}>LinkedIn Profile Available</Text>
            </View>
          )}
        </View>

        <View style={styles.cardActions}>
          {item.linkedinUrl && (
            <TouchableOpacity 
              style={styles.linkedinButton}
              onPress={() => handleLinkedInPress(item.linkedinUrl!)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <View style={styles.linkedinButtonIcon}>
                <Text style={styles.linkedinButtonText}>in</Text>
              </View>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => handleDelete(item)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Trash2 size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <CreditCard size={64} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>No business cards yet</Text>
      <Text style={styles.emptyText}>
        Tap the + button to scan your first business card
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Image 
          source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/5qvbda1p79ub04bs6vv59' }}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
      
      <View style={styles.searchContainer}>
        <Search size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search cards..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <FlatList
        data={filteredCards}
        renderItem={renderCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          filteredCards.length === 0 && styles.emptyListContent
        ]}
        ListEmptyComponent={<EmptyState />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#4128C5"
          />
        }
      />

      <TouchableOpacity 
        style={styles.fab}
        onPress={handleAddCard}
        activeOpacity={0.8}
      >
        <Plus size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6FAFE",
  },
  header: {
    backgroundColor: "#4128C5",
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  logo: {
    width: 280,
    height: 84,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: "#1F2937",
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  emptyListContent: {
    flex: 1,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    overflow: "hidden",
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 2,
  },
  cardTitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cardCompany: {
    fontSize: 14,
    color: "#4B5563",
  },
  cardDetails: {
    gap: 6,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: "#6B7280",
    flex: 1,
  },
  linkedinIcon: {
    width: 14,
    height: 14,
    borderRadius: 2,
    backgroundColor: "#0077B5",
    justifyContent: "center",
    alignItems: "center",
  },
  linkedinText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "bold",
  },
  cardActions: {
    position: "absolute",
    top: 16,
    right: 16,
    flexDirection: "row",
    gap: 8,
  },
  linkedinButton: {
    padding: 4,
  },
  linkedinButtonIcon: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: "#0077B5",
    justifyContent: "center",
    alignItems: "center",
  },
  linkedinButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  deleteButton: {
    padding: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#4B5563",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: "#9CA3AF",
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: '50%',
    marginLeft: -28,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#4128C5",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
});
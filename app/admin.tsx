import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Users, Mail, Calendar, ChevronLeft, UserCircle } from "lucide-react-native";
import { router } from "expo-router";
import { trpc } from "@/lib/trpc";

interface UserAccount {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
}

export default function AdminScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = trpc.auth.getAllUsers.useQuery();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderUserItem = ({ item }: { item: UserAccount }) => (
    <View style={styles.userCard}>
      <View style={styles.avatarContainer}>
        <UserCircle size={44} color="#4F46E5" />
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>
          {item.firstName} {item.lastName}
        </Text>
        <View style={styles.detailRow}>
          <Mail size={14} color="#6B7280" />
          <Text style={styles.userEmail}>{item.email}</Text>
        </View>
        <View style={styles.detailRow}>
          <Calendar size={14} color="#6B7280" />
          <Text style={styles.userDate}>Joined {formatDate(item.createdAt)}</Text>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Users size={64} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>No Users Yet</Text>
      <Text style={styles.emptyText}>
        User accounts will appear here once people sign up.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Admin Panel</Text>
          <Text style={styles.headerSubtitle}>User Accounts</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Users size={20} color="#4F46E5" />
          <Text style={styles.statNumber}>{data?.total ?? 0}</Text>
          <Text style={styles.statLabel}>Total Users</Text>
        </View>
      </View>

      {isLoading && !data ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading accounts...</Text>
        </View>
      ) : (
        <FlatList
          data={data?.users ?? []}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#4F46E5"
            />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  headerContent: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#1F2937",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  placeholder: {
    width: 40,
  },
  statsBar: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: "#1F2937",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: "#6B7280",
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  userCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  userInfo: {
    flex: 1,
    justifyContent: "center",
  },
  userName: {
    fontSize: 17,
    fontWeight: "600" as const,
    color: "#1F2937",
    marginBottom: 6,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "#6B7280",
    marginLeft: 8,
  },
  userDate: {
    fontSize: 13,
    color: "#9CA3AF",
    marginLeft: 8,
  },
  separator: {
    height: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: "#374151",
    marginTop: 16,
  },
  emptyText: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 22,
  },
});

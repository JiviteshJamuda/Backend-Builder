import React from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useGetDashboardStats, useGetRecentActivity } from "@workspace/api-client-react";
import { StatCard } from "@/components/StatCard";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const ACTIVITY_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  appointment: "calendar",
  lab_test: "activity",
  patient: "user-plus",
};

export default function DashboardScreen() {
  const colors = useColors();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: activity, isLoading: actLoading } = useGetRecentActivity();

  const topPad = Platform.OS === "web" ? 67 : 0;

  if (statsLoading) return <LoadingScreen message="Loading dashboard..." />;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.scroll, { paddingTop: topPad + 16, paddingBottom: (Platform.OS === "web" ? 34 : 0) + 100 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>{greeting},</Text>
          <Text style={[styles.name, { color: colors.foreground }]}>{user?.name?.split(" ")[0]}</Text>
        </View>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0) ?? "U"}</Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Overview</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statsRow}>
          <StatCard label="Patients" value={stats?.totalPatients ?? 0} icon="users" color="#0ea5e9" />
          <StatCard label="Doctors" value={stats?.totalDoctors ?? 0} icon="briefcase" color="#8b5cf6" />
        </View>
        <View style={styles.statsRow}>
          <StatCard label="Today's Appts" value={stats?.todayAppointments ?? 0} icon="calendar" color="#f59e0b" />
          <StatCard label="Completed" value={stats?.completedAppointmentsToday ?? 0} icon="check-circle" color="#22c55e" />
        </View>
        <View style={styles.statsRow}>
          <StatCard label="Pending Labs" value={stats?.pendingLabTests ?? 0} icon="activity" color="#f97316" />
          <StatCard label="Low Stock" value={stats?.lowStockMedicines ?? 0} icon="alert-triangle" color="#ef4444" />
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Activity</Text>
      {actLoading ? (
        <View style={[styles.activityCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Loading...</Text>
        </View>
      ) : !activity?.length ? (
        <View style={[styles.activityCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No recent activity</Text>
        </View>
      ) : (
        <View style={[styles.activityCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {activity.slice(0, 8).map((item, idx) => (
            <View key={item.id} style={[styles.activityItem, idx < (activity.length - 1) && idx < 7 ? { borderBottomWidth: 1, borderBottomColor: colors.border } : {}]}>
              <View style={[styles.activityIcon, { backgroundColor: colors.primary + "18" }]}>
                <Feather name={ACTIVITY_ICONS[item.type] ?? "circle"} size={14} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.activityDesc, { color: colors.foreground }]} numberOfLines={1}>{item.description}</Text>
                <Text style={[styles.activityTime, { color: colors.mutedForeground }]}>{timeAgo(item.timestamp)}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20 },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 24 },
  greeting: { fontSize: 14, fontFamily: "Inter_400Regular" },
  name: { fontSize: 24, fontFamily: "Inter_700Bold" },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 18, fontFamily: "Inter_700Bold" },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 12, marginTop: 4 },
  statsGrid: { gap: 10, marginBottom: 24 },
  statsRow: { flexDirection: "row", gap: 10 },
  activityCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden", marginBottom: 16 },
  activityItem: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  activityIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  activityDesc: { fontSize: 13, fontFamily: "Inter_500Medium" },
  activityTime: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  emptyText: { fontSize: 14, textAlign: "center", padding: 24 },
});

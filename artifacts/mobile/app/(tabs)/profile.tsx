import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { RoleBadge } from "@/components/RoleBadge";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface MenuItemProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
}

function MenuItem({ icon, label, onPress, danger }: MenuItemProps) {
  const colors = useColors();
  return (
    <TouchableOpacity
      style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
    >
      <View style={[styles.menuIcon, { backgroundColor: danger ? "#ef444418" : colors.secondary }]}>
        <Feather name={icon} size={18} color={danger ? "#ef4444" : colors.primary} />
      </View>
      <Text style={[styles.menuLabel, { color: danger ? "#ef4444" : colors.foreground }]}>{label}</Text>
      <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const topPad = Platform.OS === "web" ? 67 : 0;

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: logout },
    ]);
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.scroll, { paddingTop: topPad + 16, paddingBottom: (Platform.OS === "web" ? 34 : 0) + 100 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: colors.foreground }]}>Profile</Text>

      <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.bigAvatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.bigAvatarText}>{user?.name?.charAt(0) ?? "U"}</Text>
        </View>
        <Text style={[styles.profileName, { color: colors.foreground }]}>{user?.name}</Text>
        <Text style={[styles.profileUsername, { color: colors.mutedForeground }]}>@{user?.username}</Text>
        {user?.role && <RoleBadge role={user.role} />}
        {user?.email && <Text style={[styles.profileEmail, { color: colors.mutedForeground }]}>{user.email}</Text>}
      </View>

      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Account</Text>
      <View style={styles.menuGroup}>
        <MenuItem icon="user" label="Edit Profile" onPress={() => Alert.alert("Coming Soon", "Profile editing is not yet available")} />
        <MenuItem icon="bell" label="Notifications" onPress={() => Alert.alert("Coming Soon", "Notifications are not yet available")} />
        <MenuItem icon="shield" label="Security" onPress={() => Alert.alert("Coming Soon", "Security settings are not yet available")} />
      </View>

      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>System</Text>
      <View style={styles.menuGroup}>
        <MenuItem icon="info" label="About MedTrack" onPress={() => Alert.alert("MedTrack v1.0", "Hospital Management System\nBuilt with React Native & Node.js")} />
        <MenuItem icon="log-out" label="Sign Out" onPress={handleLogout} danger />
      </View>

      <View style={[styles.versionWrap]}>
        <Text style={[styles.version, { color: colors.mutedForeground }]}>MedTrack v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20 },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", marginBottom: 20 },
  profileCard: { alignItems: "center", borderRadius: 20, borderWidth: 1, padding: 24, gap: 8, marginBottom: 24 },
  bigAvatar: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  bigAvatarText: { color: "#fff", fontSize: 32, fontFamily: "Inter_700Bold" },
  profileName: { fontSize: 20, fontFamily: "Inter_700Bold" },
  profileUsername: { fontSize: 14, fontFamily: "Inter_400Regular" },
  profileEmail: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 4 },
  sectionLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8, marginTop: 4 },
  menuGroup: { gap: 8, marginBottom: 20 },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: 14, borderWidth: 1 },
  menuIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  menuLabel: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium" },
  versionWrap: { alignItems: "center", paddingTop: 8 },
  version: { fontSize: 12, fontFamily: "Inter_400Regular" },
});

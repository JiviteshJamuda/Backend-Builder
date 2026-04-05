import React from "react";
import { View, Text, StyleSheet } from "react-native";

const STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
  scheduled: { color: "#0ea5e9", bg: "#0ea5e918" },
  completed: { color: "#22c55e", bg: "#22c55e18" },
  cancelled: { color: "#ef4444", bg: "#ef444418" },
  pending: { color: "#f59e0b", bg: "#f59e0b18" },
  "in-progress": { color: "#8b5cf6", bg: "#8b5cf618" },
  done: { color: "#22c55e", bg: "#22c55e18" },
};

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? { color: "#64748b", bg: "#64748b18" };
  const label = status.charAt(0).toUpperCase() + status.slice(1).replace(/-/g, " ");
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text style={[styles.text, { color: config.color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    alignSelf: "flex-start",
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
});

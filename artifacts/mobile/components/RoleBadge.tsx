import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";

const ROLE_CONFIG: Record<string, { label: string; color: string }> = {
  admin: { label: "Admin", color: "#8b5cf6" },
  doctor: { label: "Doctor", color: "#0ea5e9" },
  receptionist: { label: "Receptionist", color: "#f59e0b" },
  pharmacist: { label: "Pharmacist", color: "#22c55e" },
  lab_technician: { label: "Lab Tech", color: "#f97316" },
  patient: { label: "Patient", color: "#64748b" },
};

export function RoleBadge({ role }: { role: string }) {
  const config = ROLE_CONFIG[role] ?? { label: role, color: "#64748b" };
  return (
    <View style={[styles.badge, { backgroundColor: config.color + "18" }]}>
      <Text style={[styles.text, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});

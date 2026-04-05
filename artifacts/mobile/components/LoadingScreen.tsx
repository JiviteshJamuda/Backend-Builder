import React from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";

export function LoadingScreen({ message = "Loading..." }: { message?: string }) {
  const colors = useColors();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.text, { color: colors.mutedForeground }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  text: { fontSize: 14, marginTop: 8 },
});

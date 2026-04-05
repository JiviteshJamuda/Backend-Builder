import React, { useState } from "react";
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Modal,
  ScrollView, Alert, ActivityIndicator, Platform, TextInput
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useListMedicines, useCreateMedicine, useUpdateMedicine, getListMedicinesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { LoadingScreen } from "@/components/LoadingScreen";

const CATEGORIES = ["Analgesic", "Antibiotic", "Antidiabetic", "Antihypertensive", "Statin", "Proton Pump Inhibitor", "Antihistamine", "Vitamins", "Other"];
const UNITS = ["tablet", "capsule", "ml", "mg", "injection", "syrup", "cream"];

interface MedForm {
  name: string;
  genericName: string;
  category: string;
  manufacturer: string;
  stockQuantity: string;
  unit: string;
  price: string;
  expiryDate: string;
  minimumStock: string;
}

export default function PharmacyScreen() {
  const colors = useColors();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [showLowStock, setShowLowStock] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editMed, setEditMed] = useState<null | Record<string, unknown>>(null);
  const [form, setForm] = useState<MedForm>({
    name: "", genericName: "", category: "", manufacturer: "",
    stockQuantity: "0", unit: "tablet", price: "0", expiryDate: "", minimumStock: "10"
  });

  const { data: medicines, isLoading } = useListMedicines({ search: search || undefined, lowStock: showLowStock || undefined });
  const createMed = useCreateMedicine({
    mutation: {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListMedicinesQueryKey() }); setShowModal(false); resetForm(); },
      onError: () => Alert.alert("Error", "Failed to save medicine"),
    }
  });
  const updateMed = useUpdateMedicine({
    mutation: {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListMedicinesQueryKey() }); setShowModal(false); setEditMed(null); resetForm(); },
      onError: () => Alert.alert("Error", "Failed to update medicine"),
    }
  });

  const resetForm = () => setForm({ name: "", genericName: "", category: "", manufacturer: "", stockQuantity: "0", unit: "tablet", price: "0", expiryDate: "", minimumStock: "10" });

  const openAdd = () => { resetForm(); setEditMed(null); setShowModal(true); };
  const openEdit = (m: Record<string, unknown>) => {
    setForm({
      name: String(m.name ?? ""), genericName: String(m.genericName ?? ""),
      category: String(m.category ?? ""), manufacturer: String(m.manufacturer ?? ""),
      stockQuantity: String(m.stockQuantity ?? 0), unit: String(m.unit ?? "tablet"),
      price: String(m.price ?? 0), expiryDate: String(m.expiryDate ?? ""),
      minimumStock: String(m.minimumStock ?? 10),
    });
    setEditMed(m);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.name) { Alert.alert("Error", "Medicine name is required"); return; }
    const data = {
      name: form.name,
      genericName: form.genericName || null,
      category: form.category || null,
      stockQuantity: parseInt(form.stockQuantity) || 0,
      unit: form.unit,
      price: parseFloat(form.price) || 0,
      expiryDate: form.expiryDate || null,
      minimumStock: parseInt(form.minimumStock) || 10,
    };
    if (editMed) {
      updateMed.mutate({ id: editMed.id as number, data });
    } else {
      createMed.mutate({ data: { ...data, name: form.name, stockQuantity: data.stockQuantity, unit: data.unit, price: data.price, minimumStock: data.minimumStock } });
    }
  };

  const topPad = Platform.OS === "web" ? 67 : 0;
  if (isLoading && !search && !showLowStock) return <LoadingScreen message="Loading pharmacy..." />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: topPad + 16, paddingHorizontal: 20 }]}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.foreground }]}>Pharmacy</Text>
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={openAdd}>
            <Feather name="plus" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.searchRow}>
          <View style={[styles.searchWrap, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <Feather name="search" size={16} color={colors.mutedForeground} />
            <TextInput
              style={[styles.searchInput, { color: colors.foreground }]}
              value={search}
              onChangeText={setSearch}
              placeholder="Search medicines..."
              placeholderTextColor={colors.mutedForeground}
            />
          </View>
          <TouchableOpacity
            style={[styles.filterBtn, { backgroundColor: showLowStock ? "#ef444418" : colors.muted, borderColor: showLowStock ? "#ef4444" : colors.border }]}
            onPress={() => setShowLowStock(!showLowStock)}
          >
            <Feather name="alert-triangle" size={16} color={showLowStock ? "#ef4444" : colors.mutedForeground} />
          </TouchableOpacity>
        </View>
        {showLowStock && <Text style={[styles.filterInfo, { color: "#ef4444" }]}>Showing low stock only</Text>}
      </View>

      <FlatList
        data={medicines ?? []}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={[styles.list, { paddingBottom: Platform.OS === "web" ? 100 : 90 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Feather name="package" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No medicines found</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isLow = item.stockQuantity <= item.minimumStock;
          return (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: colors.card, borderColor: isLow ? "#ef444440" : colors.border }]}
              onPress={() => openEdit(item as Record<string, unknown>)}
            >
              <View style={styles.cardLeft}>
                <View style={[styles.medIcon, { backgroundColor: isLow ? "#ef444418" : colors.secondary }]}>
                  <Feather name="package" size={20} color={isLow ? "#ef4444" : colors.primary} />
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.medName, { color: colors.foreground }]}>{item.name}</Text>
                {item.genericName && <Text style={[styles.medGeneric, { color: colors.mutedForeground }]}>{item.genericName}</Text>}
                {item.category && <Text style={[styles.medCat, { color: colors.mutedForeground }]}>{item.category}</Text>}
                <View style={styles.medMeta}>
                  <View style={[styles.stockBadge, { backgroundColor: isLow ? "#ef444418" : "#22c55e18" }]}>
                    <Text style={[styles.stockText, { color: isLow ? "#ef4444" : "#22c55e" }]}>
                      {item.stockQuantity} {item.unit}s
                    </Text>
                  </View>
                  <Text style={[styles.priceText, { color: colors.mutedForeground }]}>${item.price}</Text>
                </View>
              </View>
              <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          );
        }}
      />

      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => { setShowModal(false); setEditMed(null); resetForm(); }}>
              <Feather name="x" size={22} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>{editMed ? "Edit Medicine" : "Add Medicine"}</Text>
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSave} disabled={createMed.isPending || updateMed.isPending}>
              {(createMed.isPending || updateMed.isPending) ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>Save</Text>}
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
            {([
              { key: "name", label: "Medicine Name *", placeholder: "Aspirin 100mg" },
              { key: "genericName", label: "Generic Name", placeholder: "Acetylsalicylic Acid" },
              { key: "manufacturer", label: "Manufacturer", placeholder: "Bayer" },
              { key: "stockQuantity", label: "Stock Quantity", placeholder: "100", keyboard: "numeric" as const },
              { key: "price", label: "Price ($)", placeholder: "1.50", keyboard: "numeric" as const },
              { key: "minimumStock", label: "Minimum Stock", placeholder: "10", keyboard: "numeric" as const },
              { key: "expiryDate", label: "Expiry Date", placeholder: "2026-12-31" },
            ] as { key: keyof MedForm; label: string; placeholder: string; keyboard?: "default" | "numeric" }[]).map(({ key, label, placeholder, keyboard }) => (
              <View key={key} style={styles.formField}>
                <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>{label}</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }]}
                  value={form[key]}
                  onChangeText={v => setForm(prev => ({ ...prev, [key]: v }))}
                  placeholder={placeholder}
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType={keyboard ?? "default"}
                />
              </View>
            ))}
            <View style={styles.formField}>
              <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>Category</Text>
              <View style={styles.btnGroup}>
                {CATEGORIES.map(c => (
                  <TouchableOpacity key={c} style={[styles.groupBtn, { borderColor: form.category === c ? colors.primary : colors.border, backgroundColor: form.category === c ? colors.secondary : colors.muted }]} onPress={() => setForm(p => ({ ...p, category: c }))}>
                    <Text style={[styles.groupBtnText, { color: form.category === c ? colors.primary : colors.mutedForeground }]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.formField}>
              <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>Unit</Text>
              <View style={styles.btnGroup}>
                {UNITS.map(u => (
                  <TouchableOpacity key={u} style={[styles.groupBtn, { borderColor: form.unit === u ? colors.primary : colors.border, backgroundColor: form.unit === u ? colors.secondary : colors.muted }]} onPress={() => setForm(p => ({ ...p, unit: u }))}>
                    <Text style={[styles.groupBtnText, { color: form.unit === u ? colors.primary : colors.mutedForeground }]}>{u}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingBottom: 12, gap: 12 },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 26, fontFamily: "Inter_700Bold" },
  addBtn: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  searchRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  searchWrap: { flex: 1, flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  filterBtn: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  filterInfo: { fontSize: 12, fontFamily: "Inter_500Medium" },
  list: { paddingHorizontal: 20, paddingTop: 12, gap: 10 },
  card: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  cardLeft: {},
  medIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  medName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  medGeneric: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  medCat: { fontSize: 11, fontFamily: "Inter_400Regular" },
  medMeta: { flexDirection: "row", gap: 10, alignItems: "center", marginTop: 6 },
  stockBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  stockText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  priceText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  emptyWrap: { alignItems: "center", gap: 10, paddingTop: 60 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  modal: { flex: 1 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1 },
  modalTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  saveBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  saveBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 14 },
  formScroll: { padding: 20, gap: 16 },
  formField: { gap: 6 },
  formLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  formInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: "Inter_400Regular" },
  btnGroup: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  groupBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1 },
  groupBtnText: { fontSize: 12, fontFamily: "Inter_500Medium" },
});

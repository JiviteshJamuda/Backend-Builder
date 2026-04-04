import React, { useState } from "react";
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, Modal,
  ScrollView, Alert, ActivityIndicator, Platform
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useListPatients, useCreatePatient, useUpdatePatient, getListPatientsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface PatientFormData {
  name: string;
  gender: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  address: string;
  bloodGroup: string;
  allergies: string;
  chronicConditions: string;
}

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const GENDERS = ["male", "female", "other"];

export default function PatientsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editPatient, setEditPatient] = useState<null | { id: number; [key: string]: unknown }>(null);
  const [form, setForm] = useState<PatientFormData>({
    name: "", gender: "male", phone: "", email: "",
    dateOfBirth: "", address: "", bloodGroup: "", allergies: "", chronicConditions: ""
  });

  const { data: patients, isLoading } = useListPatients({ search: search || undefined });
  const createPatient = useCreatePatient({
    mutation: {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListPatientsQueryKey() }); setShowModal(false); resetForm(); },
      onError: () => Alert.alert("Error", "Failed to save patient"),
    }
  });
  const updatePatient = useUpdatePatient({
    mutation: {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListPatientsQueryKey() }); setShowModal(false); resetForm(); setEditPatient(null); },
      onError: () => Alert.alert("Error", "Failed to update patient"),
    }
  });

  const resetForm = () => setForm({ name: "", gender: "male", phone: "", email: "", dateOfBirth: "", address: "", bloodGroup: "", allergies: "", chronicConditions: "" });

  const openAdd = () => { resetForm(); setEditPatient(null); setShowModal(true); };
  const openEdit = (p: typeof patients extends (infer T)[] | undefined ? T : never) => {
    if (!p) return;
    const pat = p as Record<string, unknown>;
    setForm({
      name: String(pat.name ?? ""),
      gender: String(pat.gender ?? "male"),
      phone: String(pat.phone ?? ""),
      email: String(pat.email ?? ""),
      dateOfBirth: String(pat.dateOfBirth ?? ""),
      address: String(pat.address ?? ""),
      bloodGroup: String(pat.bloodGroup ?? ""),
      allergies: String(pat.allergies ?? ""),
      chronicConditions: String(pat.chronicConditions ?? ""),
    });
    setEditPatient(pat as { id: number; [key: string]: unknown });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.name || !form.phone) { Alert.alert("Error", "Name and phone are required"); return; }
    const data = {
      name: form.name, gender: form.gender, phone: form.phone,
      email: form.email || null, dateOfBirth: form.dateOfBirth || null,
      address: form.address || null, bloodGroup: form.bloodGroup || null,
      allergies: form.allergies || null, chronicConditions: form.chronicConditions || null,
    };
    if (editPatient) {
      updatePatient.mutate({ id: editPatient.id as number, data });
    } else {
      createPatient.mutate({ data: { ...data, name: form.name, gender: form.gender, phone: form.phone } });
    }
  };

  const topPad = Platform.OS === "web" ? 67 : 0;

  if (isLoading && !search) return <LoadingScreen message="Loading patients..." />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: topPad + 16, paddingHorizontal: 20, backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Patients</Text>
        <View style={[styles.searchRow]}>
          <View style={[styles.searchWrap, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <Feather name="search" size={16} color={colors.mutedForeground} />
            <TextInput
              style={[styles.searchInput, { color: colors.foreground }]}
              value={search}
              onChangeText={setSearch}
              placeholder="Search by name or phone..."
              placeholderTextColor={colors.mutedForeground}
            />
          </View>
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={openAdd}>
            <Feather name="plus" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={patients ?? []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[styles.list, { paddingBottom: Platform.OS === "web" ? 100 : 90 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Feather name="users" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No patients found</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => openEdit(item as Record<string, unknown>)}
          >
            <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>{String(item.name).charAt(0)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardName, { color: colors.foreground }]}>{item.name}</Text>
              <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>{item.phone} • {item.gender}</Text>
              {item.bloodGroup && <Text style={[styles.cardMeta, { color: colors.primary }]}>Blood: {item.bloodGroup}</Text>}
            </View>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      />

      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => { setShowModal(false); setEditPatient(null); resetForm(); }}>
              <Feather name="x" size={22} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              {editPatient ? "Edit Patient" : "New Patient"}
            </Text>
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.primary }]}
              onPress={handleSave}
              disabled={createPatient.isPending || updatePatient.isPending}
            >
              {(createPatient.isPending || updatePatient.isPending) ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.saveBtnText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
            {([
              { key: "name", label: "Full Name *", placeholder: "John Smith" },
              { key: "phone", label: "Phone *", placeholder: "+1-555-0000" },
              { key: "email", label: "Email", placeholder: "john@example.com" },
              { key: "dateOfBirth", label: "Date of Birth", placeholder: "1990-01-01" },
              { key: "address", label: "Address", placeholder: "123 Main St" },
              { key: "allergies", label: "Allergies", placeholder: "Penicillin, Sulfa..." },
              { key: "chronicConditions", label: "Chronic Conditions", placeholder: "Diabetes, Hypertension..." },
            ] as { key: keyof PatientFormData; label: string; placeholder: string }[]).map(({ key, label, placeholder }) => (
              <View key={key} style={styles.formField}>
                <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>{label}</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }]}
                  value={form[key]}
                  onChangeText={(v) => setForm(prev => ({ ...prev, [key]: v }))}
                  placeholder={placeholder}
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>
            ))}
            <View style={styles.formField}>
              <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>Gender</Text>
              <View style={styles.btnGroup}>
                {GENDERS.map(g => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.groupBtn, { borderColor: form.gender === g ? colors.primary : colors.border, backgroundColor: form.gender === g ? colors.secondary : colors.muted }]}
                    onPress={() => setForm(p => ({ ...p, gender: g }))}
                  >
                    <Text style={[styles.groupBtnText, { color: form.gender === g ? colors.primary : colors.mutedForeground }]}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.formField}>
              <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>Blood Group</Text>
              <View style={styles.btnGroup}>
                {BLOOD_GROUPS.map(bg => (
                  <TouchableOpacity
                    key={bg}
                    style={[styles.groupBtn, { borderColor: form.bloodGroup === bg ? colors.primary : colors.border, backgroundColor: form.bloodGroup === bg ? colors.secondary : colors.muted }]}
                    onPress={() => setForm(p => ({ ...p, bloodGroup: bg }))}
                  >
                    <Text style={[styles.groupBtnText, { color: form.bloodGroup === bg ? colors.primary : colors.mutedForeground }]}>{bg}</Text>
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
  title: { fontSize: 26, fontFamily: "Inter_700Bold" },
  searchRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  searchWrap: { flex: 1, flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  addBtn: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  list: { paddingHorizontal: 20, paddingTop: 12, gap: 10 },
  card: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 18, fontFamily: "Inter_700Bold" },
  cardName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  cardSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  cardMeta: { fontSize: 11, fontFamily: "Inter_500Medium", marginTop: 2 },
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
  groupBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  groupBtnText: { fontSize: 13, fontFamily: "Inter_500Medium" },
});

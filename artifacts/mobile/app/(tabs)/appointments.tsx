import React, { useState } from "react";
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Modal,
  ScrollView, Alert, ActivityIndicator, Platform, TextInput
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import {
  useListAppointments, useCreateAppointment, useUpdateAppointment,
  useListPatients, useListDoctors,
  getListAppointmentsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { LoadingScreen } from "@/components/LoadingScreen";
import { StatusBadge } from "@/components/StatusBadge";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TIME_SLOTS = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"];
const STATUS_OPTIONS = ["scheduled", "completed", "cancelled"];

export default function AppointmentsScreen() {
  const colors = useColors();
  const qc = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);
  const [showModal, setShowModal] = useState(false);
  const [editAppt, setEditAppt] = useState<null | Record<string, unknown>>(null);
  const [form, setForm] = useState({ patientId: 0, doctorId: 0, appointmentDate: "", timeSlot: "", reason: "" });

  const { data: appointments, isLoading } = useListAppointments({ status: filterStatus });
  const { data: patients } = useListPatients({});
  const { data: doctors } = useListDoctors({});
  const createAppt = useCreateAppointment({
    mutation: {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListAppointmentsQueryKey() }); setShowModal(false); resetForm(); },
      onError: () => Alert.alert("Error", "Failed to book appointment"),
    }
  });
  const updateAppt = useUpdateAppointment({
    mutation: {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListAppointmentsQueryKey() }); setShowModal(false); setEditAppt(null); },
      onError: () => Alert.alert("Error", "Failed to update appointment"),
    }
  });

  const resetForm = () => setForm({ patientId: 0, doctorId: 0, appointmentDate: "", timeSlot: "", reason: "" });

  const today = new Date().toISOString().split("T")[0]!;

  const handleSave = () => {
    if (!form.patientId || !form.doctorId || !form.appointmentDate || !form.timeSlot) {
      Alert.alert("Error", "Please fill all required fields"); return;
    }
    createAppt.mutate({ data: { ...form, reason: form.reason || null } });
  };

  const handleStatusUpdate = (id: number, status: string) => {
    updateAppt.mutate({ id, data: { status } });
  };

  const topPad = Platform.OS === "web" ? 67 : 0;
  if (isLoading && !filterStatus) return <LoadingScreen message="Loading appointments..." />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: topPad + 16, paddingHorizontal: 20 }]}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.foreground }]}>Appointments</Text>
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={() => { resetForm(); setShowModal(true); }}>
            <Feather name="plus" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {[undefined, ...STATUS_OPTIONS].map((s) => (
            <TouchableOpacity
              key={s ?? "all"}
              style={[styles.filterChip, { backgroundColor: filterStatus === s ? colors.primary : colors.muted, borderColor: filterStatus === s ? colors.primary : colors.border }]}
              onPress={() => setFilterStatus(s)}
            >
              <Text style={[styles.filterText, { color: filterStatus === s ? "#fff" : colors.mutedForeground }]}>
                {s ? s.charAt(0).toUpperCase() + s.slice(1) : "All"}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={appointments ?? []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[styles.list, { paddingBottom: Platform.OS === "web" ? 100 : 90 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Feather name="calendar" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No appointments found</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardTop}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardDate, { color: colors.foreground }]}>{item.appointmentDate} at {item.timeSlot}</Text>
                <Text style={[styles.cardPatient, { color: colors.foreground }]}>{item.patientName ?? `Patient #${item.patientId}`}</Text>
                <Text style={[styles.cardDoctor, { color: colors.mutedForeground }]}>{item.doctorName ?? `Doctor #${item.doctorId}`}</Text>
                {item.reason && <Text style={[styles.cardReason, { color: colors.mutedForeground }]} numberOfLines={1}>{item.reason}</Text>}
              </View>
              <StatusBadge status={item.status} />
            </View>
            {item.status === "scheduled" && (
              <View style={[styles.actionRow, { borderTopColor: colors.border }]}>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: "#22c55e18" }]}
                  onPress={() => handleStatusUpdate(item.id, "completed")}
                >
                  <Feather name="check" size={14} color="#22c55e" />
                  <Text style={[styles.actionText, { color: "#22c55e" }]}>Complete</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: "#ef444418" }]}
                  onPress={() => handleStatusUpdate(item.id, "cancelled")}
                >
                  <Feather name="x" size={14} color="#ef4444" />
                  <Text style={[styles.actionText, { color: "#ef4444" }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      />

      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => { setShowModal(false); resetForm(); }}>
              <Feather name="x" size={22} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Book Appointment</Text>
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSave} disabled={createAppt.isPending}>
              {createAppt.isPending ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>Book</Text>}
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
            <View style={styles.formField}>
              <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>Patient *</Text>
              <ScrollView style={[styles.picker, { borderColor: colors.border }]} nestedScrollEnabled>
                {(patients ?? []).map(p => (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.pickerItem, { backgroundColor: form.patientId === p.id ? colors.secondary : "transparent" }]}
                    onPress={() => setForm(prev => ({ ...prev, patientId: p.id }))}
                  >
                    <Text style={[styles.pickerText, { color: form.patientId === p.id ? colors.primary : colors.foreground }]}>{p.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={styles.formField}>
              <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>Doctor *</Text>
              <ScrollView style={[styles.picker, { borderColor: colors.border }]} nestedScrollEnabled>
                {(doctors ?? []).map(d => (
                  <TouchableOpacity
                    key={d.id}
                    style={[styles.pickerItem, { backgroundColor: form.doctorId === d.id ? colors.secondary : "transparent" }]}
                    onPress={() => setForm(prev => ({ ...prev, doctorId: d.id }))}
                  >
                    <Text style={[styles.pickerText, { color: form.doctorId === d.id ? colors.primary : colors.foreground }]}>{d.name}</Text>
                    <Text style={[styles.pickerSub, { color: colors.mutedForeground }]}>{d.specialization}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={styles.formField}>
              <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>Date *</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }]}
                value={form.appointmentDate}
                onChangeText={v => setForm(p => ({ ...p, appointmentDate: v }))}
                placeholder={today}
                placeholderTextColor={colors.mutedForeground}
              />
            </View>
            <View style={styles.formField}>
              <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>Time Slot *</Text>
              <View style={styles.btnGroup}>
                {TIME_SLOTS.map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.groupBtn, { borderColor: form.timeSlot === t ? colors.primary : colors.border, backgroundColor: form.timeSlot === t ? colors.secondary : colors.muted }]}
                    onPress={() => setForm(p => ({ ...p, timeSlot: t }))}
                  >
                    <Text style={[styles.groupBtnText, { color: form.timeSlot === t ? colors.primary : colors.mutedForeground }]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.formField}>
              <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>Reason</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground, height: 80, textAlignVertical: "top" }]}
                value={form.reason}
                onChangeText={v => setForm(p => ({ ...p, reason: v }))}
                placeholder="Reason for visit..."
                placeholderTextColor={colors.mutedForeground}
                multiline
              />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingBottom: 12, gap: 12, backgroundColor: "transparent" },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 26, fontFamily: "Inter_700Bold" },
  addBtn: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  filterRow: { gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  filterText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  list: { paddingHorizontal: 20, paddingTop: 12, gap: 10 },
  card: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  cardTop: { flexDirection: "row", gap: 12, padding: 14 },
  cardDate: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 4 },
  cardPatient: { fontSize: 14, fontFamily: "Inter_500Medium" },
  cardDoctor: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  cardReason: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2, fontStyle: "italic" },
  actionRow: { flexDirection: "row", gap: 10, borderTopWidth: 1, padding: 10 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 8, borderRadius: 8 },
  actionText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
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
  picker: { maxHeight: 160, borderWidth: 1, borderRadius: 12, overflow: "hidden" },
  pickerItem: { paddingHorizontal: 14, paddingVertical: 10 },
  pickerText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  pickerSub: { fontSize: 11, fontFamily: "Inter_400Regular" },
  btnGroup: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  groupBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  groupBtnText: { fontSize: 13, fontFamily: "Inter_500Medium" },
});

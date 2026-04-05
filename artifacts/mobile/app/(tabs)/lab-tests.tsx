import React, { useState } from "react";
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Modal,
  ScrollView, Alert, ActivityIndicator, Platform, TextInput
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import {
  useListLabTests, useCreateLabTest, useUpdateLabTest,
  useListPatients, useListDoctors, getListLabTestsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { LoadingScreen } from "@/components/LoadingScreen";
import { StatusBadge } from "@/components/StatusBadge";

const TEST_TYPES = ["Blood Test", "Urine Analysis", "X-Ray", "MRI", "ECG", "Ultrasound", "CT Scan", "Biopsy"];
const STATUS_OPTIONS = ["pending", "in-progress", "done"];

export default function LabTestsScreen() {
  const colors = useColors();
  const qc = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState<null | Record<string, unknown>>(null);
  const [form, setForm] = useState({ patientId: 0, doctorId: 0, testName: "", testType: "", normalRange: "" });
  const [resultForm, setResultForm] = useState({ status: "done", results: "", remarks: "", completedDate: "" });

  const { data: tests, isLoading } = useListLabTests({ status: filterStatus });
  const { data: patients } = useListPatients({});
  const { data: doctors } = useListDoctors({});

  const createTest = useCreateLabTest({
    mutation: {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListLabTestsQueryKey() }); setShowAddModal(false); resetForm(); },
      onError: () => Alert.alert("Error", "Failed to order lab test"),
    }
  });
  const updateTest = useUpdateLabTest({
    mutation: {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListLabTestsQueryKey() }); setShowResultModal(false); setSelectedTest(null); },
      onError: () => Alert.alert("Error", "Failed to update lab test"),
    }
  });

  const resetForm = () => setForm({ patientId: 0, doctorId: 0, testName: "", testType: "", normalRange: "" });
  const today = new Date().toISOString().split("T")[0]!;

  const topPad = Platform.OS === "web" ? 67 : 0;
  if (isLoading && !filterStatus) return <LoadingScreen message="Loading lab tests..." />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: topPad + 16, paddingHorizontal: 20 }]}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.foreground }]}>Lab Tests</Text>
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={() => { resetForm(); setShowAddModal(true); }}>
            <Feather name="plus" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {[undefined, ...STATUS_OPTIONS].map(s => (
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
        data={tests ?? []}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={[styles.list, { paddingBottom: Platform.OS === "web" ? 100 : 90 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Feather name="activity" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No lab tests found</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardTop}>
              <View style={[styles.testIcon, { backgroundColor: colors.secondary }]}>
                <Feather name="activity" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.testName, { color: colors.foreground }]}>{item.testName}</Text>
                <Text style={[styles.testType, { color: colors.mutedForeground }]}>{item.testType}</Text>
                <Text style={[styles.patientName, { color: colors.foreground }]}>{item.patientName ?? `Patient #${item.patientId}`}</Text>
              </View>
              <StatusBadge status={item.status} />
            </View>
            {item.results && (
              <View style={[styles.resultsWrap, { borderTopColor: colors.border, backgroundColor: colors.muted }]}>
                <Text style={[styles.resultsLabel, { color: colors.mutedForeground }]}>Results</Text>
                <Text style={[styles.resultsText, { color: colors.foreground }]}>{item.results}</Text>
              </View>
            )}
            {(item.status === "pending" || item.status === "in-progress") && (
              <View style={[styles.actionRow, { borderTopColor: colors.border }]}>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: colors.secondary }]}
                  onPress={() => {
                    setSelectedTest(item as Record<string, unknown>);
                    setResultForm({ status: "done", results: "", remarks: "", completedDate: today });
                    setShowResultModal(true);
                  }}
                >
                  <Feather name="edit-3" size={14} color={colors.primary} />
                  <Text style={[styles.actionText, { color: colors.primary }]}>Enter Results</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      />

      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => { setShowAddModal(false); resetForm(); }}>
              <Feather name="x" size={22} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Order Lab Test</Text>
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.primary }]}
              onPress={() => {
                if (!form.patientId || !form.doctorId || !form.testName || !form.testType) {
                  Alert.alert("Error", "Please fill all required fields"); return;
                }
                createTest.mutate({ data: { ...form, normalRange: form.normalRange || null } });
              }}
              disabled={createTest.isPending}
            >
              {createTest.isPending ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>Order</Text>}
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
            <View style={styles.formField}>
              <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>Patient *</Text>
              <ScrollView style={[styles.picker, { borderColor: colors.border }]} nestedScrollEnabled>
                {(patients ?? []).map(p => (
                  <TouchableOpacity key={p.id} style={[styles.pickerItem, { backgroundColor: form.patientId === p.id ? colors.secondary : "transparent" }]} onPress={() => setForm(prev => ({ ...prev, patientId: p.id }))}>
                    <Text style={[styles.pickerText, { color: form.patientId === p.id ? colors.primary : colors.foreground }]}>{p.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={styles.formField}>
              <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>Doctor *</Text>
              <ScrollView style={[styles.picker, { borderColor: colors.border }]} nestedScrollEnabled>
                {(doctors ?? []).map(d => (
                  <TouchableOpacity key={d.id} style={[styles.pickerItem, { backgroundColor: form.doctorId === d.id ? colors.secondary : "transparent" }]} onPress={() => setForm(prev => ({ ...prev, doctorId: d.id }))}>
                    <Text style={[styles.pickerText, { color: form.doctorId === d.id ? colors.primary : colors.foreground }]}>{d.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={styles.formField}>
              <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>Test Name *</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }]}
                value={form.testName}
                onChangeText={v => setForm(p => ({ ...p, testName: v }))}
                placeholder="e.g. Complete Blood Count"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>
            <View style={styles.formField}>
              <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>Test Type *</Text>
              <View style={styles.btnGroup}>
                {TEST_TYPES.map(t => (
                  <TouchableOpacity key={t} style={[styles.groupBtn, { borderColor: form.testType === t ? colors.primary : colors.border, backgroundColor: form.testType === t ? colors.secondary : colors.muted }]} onPress={() => setForm(p => ({ ...p, testType: t }))}>
                    <Text style={[styles.groupBtnText, { color: form.testType === t ? colors.primary : colors.mutedForeground }]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.formField}>
              <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>Normal Range</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }]}
                value={form.normalRange}
                onChangeText={v => setForm(p => ({ ...p, normalRange: v }))}
                placeholder="e.g. 4.5-11.0 x10^9/L"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={showResultModal} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => { setShowResultModal(false); setSelectedTest(null); }}>
              <Feather name="x" size={22} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Enter Results</Text>
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.primary }]}
              onPress={() => {
                if (!selectedTest) return;
                updateTest.mutate({ id: selectedTest.id as number, data: { ...resultForm, completedDate: resultForm.completedDate || null, results: resultForm.results || null, remarks: resultForm.remarks || null } });
              }}
              disabled={updateTest.isPending}
            >
              {updateTest.isPending ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>Save</Text>}
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
            {selectedTest && (
              <View style={[styles.testInfoBox, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                <Text style={[styles.testInfoName, { color: colors.foreground }]}>{String(selectedTest.testName)}</Text>
                <Text style={[styles.testInfoType, { color: colors.mutedForeground }]}>{String(selectedTest.testType)}</Text>
                <Text style={[styles.testInfoPatient, { color: colors.mutedForeground }]}>Patient: {String(selectedTest.patientName ?? "")}</Text>
              </View>
            )}
            <View style={styles.formField}>
              <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>Results</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground, height: 100, textAlignVertical: "top" }]}
                value={resultForm.results}
                onChangeText={v => setResultForm(p => ({ ...p, results: v }))}
                placeholder="Enter test results..."
                placeholderTextColor={colors.mutedForeground}
                multiline
              />
            </View>
            <View style={styles.formField}>
              <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>Remarks</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground, height: 80, textAlignVertical: "top" }]}
                value={resultForm.remarks}
                onChangeText={v => setResultForm(p => ({ ...p, remarks: v }))}
                placeholder="Doctor remarks..."
                placeholderTextColor={colors.mutedForeground}
                multiline
              />
            </View>
            <View style={styles.formField}>
              <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>Completed Date</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }]}
                value={resultForm.completedDate}
                onChangeText={v => setResultForm(p => ({ ...p, completedDate: v }))}
                placeholder={today}
                placeholderTextColor={colors.mutedForeground}
              />
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
  filterRow: { gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  filterText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  list: { paddingHorizontal: 20, paddingTop: 12, gap: 10 },
  card: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  cardTop: { flexDirection: "row", gap: 12, padding: 14, alignItems: "flex-start" },
  testIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  testName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  testType: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  patientName: { fontSize: 13, fontFamily: "Inter_500Medium", marginTop: 4 },
  resultsWrap: { borderTopWidth: 1, padding: 12 },
  resultsLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", marginBottom: 4 },
  resultsText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  actionRow: { flexDirection: "row", borderTopWidth: 1, padding: 10 },
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
  testInfoBox: { borderWidth: 1, borderRadius: 12, padding: 14, gap: 4 },
  testInfoName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  testInfoType: { fontSize: 13, fontFamily: "Inter_400Regular" },
  testInfoPatient: { fontSize: 13, fontFamily: "Inter_400Regular" },
  btnGroup: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  groupBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1 },
  groupBtnText: { fontSize: 12, fontFamily: "Inter_500Medium" },
});

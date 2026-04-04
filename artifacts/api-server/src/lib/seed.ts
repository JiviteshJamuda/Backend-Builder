import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable, doctorsTable, patientsTable, medicinesTable } from "@workspace/db";
import { logger } from "./logger";

export async function seedDatabase() {
  try {
    const existingUsers = await db.select().from(usersTable).limit(1);
    if (existingUsers.length > 0) {
      logger.info("Database already seeded, skipping");
      return;
    }

    logger.info("Seeding database with initial data...");

    const passwordHash = await bcrypt.hash("password123", 10);

    const [admin] = await db.insert(usersTable).values({
      username: "admin",
      passwordHash,
      role: "admin",
      name: "System Administrator",
      email: "admin@medtrack.com",
    }).returning();

    const [drUser1] = await db.insert(usersTable).values({
      username: "dr.smith",
      passwordHash,
      role: "doctor",
      name: "Dr. John Smith",
      email: "john.smith@medtrack.com",
    }).returning();

    const [drUser2] = await db.insert(usersTable).values({
      username: "dr.patel",
      passwordHash,
      role: "doctor",
      name: "Dr. Priya Patel",
      email: "priya.patel@medtrack.com",
    }).returning();

    await db.insert(usersTable).values({
      username: "receptionist",
      passwordHash,
      role: "receptionist",
      name: "Sarah Johnson",
      email: "sarah@medtrack.com",
    }).returning();

    await db.insert(usersTable).values({
      username: "pharmacist",
      passwordHash,
      role: "pharmacist",
      name: "Michael Chen",
      email: "michael@medtrack.com",
    }).returning();

    await db.insert(usersTable).values({
      username: "labtech",
      passwordHash,
      role: "lab_technician",
      name: "Emily Davis",
      email: "emily@medtrack.com",
    }).returning();

    const [patUser] = await db.insert(usersTable).values({
      username: "patient1",
      passwordHash,
      role: "patient",
      name: "James Wilson",
      email: "james@example.com",
    }).returning();

    const [doctor1] = await db.insert(doctorsTable).values({
      userId: drUser1!.id,
      name: "Dr. John Smith",
      specialization: "Cardiology",
      department: "Cardiology",
      phone: "+1-555-0101",
      email: "john.smith@medtrack.com",
      licenseNumber: "MD-123456",
      yearsOfExperience: 15,
    }).returning();

    const [doctor2] = await db.insert(doctorsTable).values({
      userId: drUser2!.id,
      name: "Dr. Priya Patel",
      specialization: "Neurology",
      department: "Neurology",
      phone: "+1-555-0102",
      email: "priya.patel@medtrack.com",
      licenseNumber: "MD-789012",
      yearsOfExperience: 10,
    }).returning();

    await db.insert(doctorsTable).values({
      name: "Dr. Robert Brown",
      specialization: "Orthopedics",
      department: "Orthopedics",
      phone: "+1-555-0103",
      email: "robert.brown@medtrack.com",
      licenseNumber: "MD-345678",
      yearsOfExperience: 8,
    }).returning();

    const [patient1] = await db.insert(patientsTable).values({
      userId: String(patUser!.id),
      name: "James Wilson",
      gender: "male",
      dateOfBirth: "1985-03-15",
      phone: "+1-555-1001",
      email: "james@example.com",
      address: "123 Main St, Springfield",
      bloodGroup: "O+",
      allergies: "Penicillin",
      chronicConditions: "Hypertension",
    }).returning();

    const [patient2] = await db.insert(patientsTable).values({
      name: "Maria Garcia",
      gender: "female",
      dateOfBirth: "1992-07-22",
      phone: "+1-555-1002",
      email: "maria@example.com",
      address: "456 Oak Ave, Springfield",
      bloodGroup: "A+",
    }).returning();

    await db.insert(patientsTable).values({
      name: "David Lee",
      gender: "male",
      dateOfBirth: "1978-11-08",
      phone: "+1-555-1003",
      bloodGroup: "B-",
      chronicConditions: "Diabetes Type 2",
    }).returning();

    const today = new Date().toISOString().split("T")[0]!;
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0]!;

    await db.insert(medicinesTable).values([
      { name: "Aspirin 100mg", genericName: "Acetylsalicylic Acid", category: "Analgesic", manufacturer: "Bayer", stockQuantity: 500, unit: "tablet", price: "0.50", expiryDate: "2026-12-31", minimumStock: 50 },
      { name: "Metformin 500mg", genericName: "Metformin HCL", category: "Antidiabetic", manufacturer: "Sun Pharma", stockQuantity: 8, unit: "tablet", price: "1.20", expiryDate: "2026-06-30", minimumStock: 100 },
      { name: "Amlodipine 5mg", genericName: "Amlodipine Besylate", category: "Antihypertensive", manufacturer: "Pfizer", stockQuantity: 200, unit: "tablet", price: "2.50", expiryDate: "2027-03-31", minimumStock: 30 },
      { name: "Atorvastatin 20mg", genericName: "Atorvastatin Calcium", category: "Statin", manufacturer: "Cipla", stockQuantity: 5, unit: "tablet", price: "3.80", expiryDate: "2026-09-30", minimumStock: 50 },
      { name: "Amoxicillin 500mg", genericName: "Amoxicillin", category: "Antibiotic", manufacturer: "GSK", stockQuantity: 300, unit: "capsule", price: "1.80", expiryDate: "2025-12-31", minimumStock: 40 },
      { name: "Omeprazole 20mg", genericName: "Omeprazole", category: "Proton Pump Inhibitor", stockQuantity: 150, unit: "capsule", price: "1.50", expiryDate: "2026-08-31", minimumStock: 20 },
    ]);

    logger.info({ admin: admin!.id, doctor1: doctor1!.id, doctor2: doctor2!.id, patient1: patient1!.id, patient2: patient2!.id }, "Database seeded successfully");
  } catch (err) {
    logger.error({ err }, "Error seeding database");
  }
}

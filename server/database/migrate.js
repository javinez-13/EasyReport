require("dotenv").config();
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const pool = require("./db");

async function migrate() {
  const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  await pool.query(schema);
  console.log("Schema applied.");

  const passwordHash = await bcrypt.hash("admin123", 10);
  await pool.query(
    `INSERT INTO users (full_name, email, password_hash, role)
     VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING`,
    ["Administrator", "admin@barangay.gov.ph", passwordHash, "admin"]
  );

  const residents = [
    ["R-001", "Juan Dela Cruz", "1992-03-15", 34, "Male", "Married", "123 Rizal St., Brgy. San Jose", "09171234567", "juan.delacruz@email.com", "HH-0045", "Maria Dela Cruz - 09171234568"],
    ["R-002", "Maria Santos", "1997-07-22", 29, "Female", "Single", "45 Mabini Ave., Brgy. San Jose", "09191234567", "maria.santos@email.com", "HH-0089", "Pedro Santos - 09191234568"],
    ["R-003", "Pedro Reyes", "1981-11-08", 45, "Male", "Married", "78 Bonifacio St., Brgy. San Jose", "09211234567", "pedro.reyes@email.com", "HH-0123", "Ana Reyes - 09211234568"],
    ["R-004", "Rosa Mendoza", "1974-05-30", 52, "Female", "Widowed", "12 Luna St., Brgy. San Jose", "09231234567", "rosa.mendoza@email.com", "HH-0156", "Carlos Mendoza - 09231234568"],
  ];

  for (const r of residents) {
    await pool.query(
      `INSERT INTO residents (resident_id, full_name, birthdate, age, gender, civil_status, address, contact_number, email, household_number, emergency_contact)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT (resident_id) DO NOTHING`,
      r
    );
  }

  const complaints = [
    ["C-00012", "2026-06-15", "Noise Complaint", "High", "Pending", "Excessive noise from late-night karaoke sessions affecting neighbors sleep.", '["noise_recording.mp3","complaint_photo.jpg"]', "Juan Dela Cruz", "123 Rizal St., Brgy. San Jose", "09171234567", "juan.delacruz@email.com", 34, "Pedro Santos", "125 Rizal St., Brgy. San Jose", "09181234567", 41],
    ["C-00013", "2026-06-18", "Boundary Dispute", "Medium", "In Progress", "Fence encroachment dispute regarding property boundary line.", '["survey_map.pdf","boundary_photo.jpg"]', "Maria Santos", "45 Mabini Ave., Brgy. San Jose", "09191234567", "maria.santos@email.com", 29, "Carlos Reyes", "47 Mabini Ave., Brgy. San Jose", "09201234567", 38],
    ["C-00014", "2026-06-20", "Harassment", "High", "Scheduled", "Verbal harassment and threats reported by complainant.", '["witness_statement.pdf"]', "Pedro Reyes", "78 Bonifacio St., Brgy. San Jose", "09211234567", "pedro.reyes@email.com", 45, "Ana Garcia", "80 Bonifacio St., Brgy. San Jose", "09221234567", 33],
    ["C-00015", "2026-05-10", "Animal Complaint", "Normal", "Resolved", "Stray dogs causing disturbance in the neighborhood.", '["incident_report.pdf"]', "Rosa Mendoza", "12 Luna St., Brgy. San Jose", "09231234567", "rosa.mendoza@email.com", 52, "Miguel Torres", "14 Luna St., Brgy. San Jose", "09241234567", 48],
    ["C-00016", "2026-06-22", "Noise Complaint", "Medium", "Pending", "Loud construction work during prohibited hours.", '["video_evidence.mp4"]', "Elena Cruz", "90 Aguinaldo Blvd., Brgy. San Jose", "09251234567", "elena.cruz@email.com", 36, "Roberto Lim", "92 Aguinaldo Blvd., Brgy. San Jose", "09261234567", 44],
    ["C-00017", "2026-06-01", "Property Damage", "High", "Unsettled", "Damaged fence and garden due to neighbor dispute.", '["damage_photos.jpg"]', "Carlos Mendoza", "15 Luna St., Brgy. San Jose", "09271234567", "carlos.mendoza@email.com", 40, "Luis Tan", "17 Luna St., Brgy. San Jose", "09281234567", 42],
  ];

  for (const c of complaints) {
    const resolvedAt = c[4] === "Resolved" ? new Date() : null;
    await pool.query(
      `INSERT INTO complaints (complaint_no, date_filed, category, priority, status, description, evidence,
        complainant_name, complainant_address, complainant_contact, complainant_email, complainant_age,
        respondent_name, respondent_address, respondent_contact, respondent_age, resolved_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
      [...c, resolvedAt]
    );
  }

  await pool.query(
    `INSERT INTO summons (summon_no, complaint_id, hearing_date, hearing_time, venue, officer)
     SELECT 'S-00008', id, '2026-07-10', '9:00 AM', 'Barangay Hall Conference Room', 'Brgy. Captain Reyes'
     FROM complaints WHERE complaint_no = 'C-00013'`
  );

  await pool.query(
    `INSERT INTO summons (summon_no, complaint_id, hearing_date, hearing_time, venue, officer)
     SELECT 'S-00009', id, '2026-07-12', '10:00 AM', 'Barangay Hall', 'Brgy. Captain Reyes'
     FROM complaints WHERE complaint_no = 'C-00014'`
  );

  await pool.query(
    `INSERT INTO hearings (complaint_id, hearing_number, hearing_date, hearing_time, venue, witnesses, mediation_notes, status)
     SELECT id, 1, '2026-07-05', '10:00 AM', 'Barangay Hall', '["Witness A","Witness B"]'::jsonb,
       'First hearing conducted. Both parties present.', 'Completed'
     FROM complaints WHERE complaint_no = 'C-00014'`
  );

  await pool.query(
    `INSERT INTO hearings (complaint_id, hearing_number, hearing_date, hearing_time, venue, status)
     SELECT id, 2, '2026-07-12', '10:00 AM', 'Barangay Hall', 'Scheduled'
     FROM complaints WHERE complaint_no = 'C-00014'`
  );

  await pool.query(
    `INSERT INTO hearings (complaint_id, hearing_number, hearing_date, hearing_time, venue, status)
     SELECT id, 2, '2026-07-15', '2:00 PM', 'Barangay Hall Conference Room', 'Scheduled'
     FROM complaints WHERE complaint_no = 'C-00013'`
  );

  console.log("Database migrated and seeded successfully.");
  await pool.end();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});

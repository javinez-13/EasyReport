const pool = require("../database/db");
const {
  logResidentComplaintActivity,
  notifyResident,
} = require("../utils/residentNotify");

function mapProfile(row) {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    role: row.role,
    fullname: row.fullname,
    phoneNumber: row.phoneNumber,
    isVerified: row.isVerified,
    profilePicture: row.profilePicture || null,
  };
}

async function getProfile(req, res) {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const { rows } = await pool.query(
      `SELECT
         id,
         username,
         email,
         role,
         full_name AS "fullname",
         phone_number AS "phoneNumber",
         is_verified AS "isVerified",
         profile_picture AS "profilePicture",
         resident_id AS "residentId"
       FROM users
       WHERE id = $1`,
      [req.user.id]
    );

    if (!rows[0]) return res.status(404).json({ message: "User not found" });
    const profile = mapProfile(rows[0]);

    // Attach the linked Resident's current information when present.
    if (rows[0].residentId) {
      const residentResult = await pool.query(
        `SELECT id, resident_id, full_name, email, contact_number, address, age
         FROM residents WHERE id = $1`,
        [rows[0].residentId]
      );
      const r = residentResult.rows[0];
      if (r) {
        profile.linkedResident = {
          id: r.resident_id,
          fullName: r.full_name,
          email: r.email,
          contactNumber: r.contact_number,
          address: r.address,
          age: r.age,
        };
      }
    }

    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function updateProfile(req, res) {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const fullname = req.body.fullname !== undefined ? String(req.body.fullname).trim() : undefined;
    const email =
      req.body.email !== undefined ? String(req.body.email).trim().toLowerCase() : undefined;
    const phoneNumber =
      req.body.phoneNumber !== undefined
        ? String(req.body.phoneNumber).trim() || null
        : undefined;

    if (email !== undefined) {
      if (!email) return res.status(400).json({ message: "Email is required" });
      const existing = await pool.query(
        "SELECT id FROM users WHERE email = $1 AND id <> $2",
        [email, req.user.id]
      );
      if (existing.rows[0]) {
        return res.status(400).json({ message: "Email is already in use" });
      }
    }

    if (phoneNumber !== undefined && phoneNumber) {
      const existingPhone = await pool.query(
        "SELECT id FROM users WHERE phone_number = $1 AND id <> $2",
        [phoneNumber, req.user.id]
      );
      if (existingPhone.rows[0]) {
        return res.status(400).json({ message: "Mobile number is already in use" });
      }
    }

    const { rows } = await pool.query(
      `UPDATE users
       SET
         full_name = COALESCE($1, full_name),
         email = COALESCE($2, email),
         phone_number = CASE WHEN $3::boolean THEN $4 ELSE phone_number END,
         updated_at = NOW()
       WHERE id = $5
       RETURNING
         id,
         username,
         email,
         role,
         full_name AS "fullname",
         phone_number AS "phoneNumber",
         is_verified AS "isVerified",
         profile_picture AS "profilePicture"`,
      [
        fullname === undefined ? null : fullname,
        email === undefined ? null : email,
        phoneNumber !== undefined,
        phoneNumber === undefined ? null : phoneNumber,
        req.user.id,
      ]
    );

    if (!rows[0]) return res.status(404).json({ message: "User not found" });
    res.json(mapProfile(rows[0]));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function uploadProfilePicture(req, res) {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    if (!req.file) return res.status(400).json({ message: "Profile picture is required" });

    const profilePicture = `/uploads/profiles/${req.file.filename}`;
    const { rows } = await pool.query(
      `UPDATE users
       SET profile_picture = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING
         id,
         username,
         email,
         role,
         full_name AS "fullname",
         phone_number AS "phoneNumber",
         is_verified AS "isVerified",
         profile_picture AS "profilePicture"`,
      [profilePicture, req.user.id]
    );

    if (!rows[0]) return res.status(404).json({ message: "User not found" });
    res.json(mapProfile(rows[0]));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function getComplaints(req, res) {
  try {
    if (!req.user?.email) return res.status(401).json({ message: "Unauthorized" });

    const { search, status, priority, category, limit } = req.query;
    const queryParts = [
      `SELECT c.*,
        s.summon_no, s.hearing_date, s.hearing_time, s.venue,
        (SELECT MAX(hearing_number) FROM hearings h WHERE h.complaint_id = c.id) AS latest_hearing_number,
        (SELECT mediation_notes FROM hearings h WHERE h.complaint_id = c.id ORDER BY h.hearing_number DESC LIMIT 1) AS mediation_notes,
        (SELECT previous_notes FROM hearings h WHERE h.complaint_id = c.id ORDER BY h.hearing_number DESC LIMIT 1) AS previous_notes,
        (SELECT witnesses FROM hearings h WHERE h.complaint_id = c.id ORDER BY h.hearing_number DESC LIMIT 1) AS witnesses
       FROM complaints c
       LEFT JOIN summons s ON s.complaint_id = c.id
       WHERE c.complainant_email = $1`,
    ];
    const values = [req.user.email];

    if (search) {
      values.push(`%${String(search).trim()}%`);
      queryParts.push(
        `AND (
          c.complaint_no ILIKE $${values.length}
          OR c.category ILIKE $${values.length}
          OR c.description ILIKE $${values.length}
          OR c.status ILIKE $${values.length}
          OR c.respondent_name ILIKE $${values.length}
        )`
      );
    }

    if (status) {
      const statusValue = String(status).trim();
      if (statusValue.toLowerCase() !== "all") {
        values.push(`${statusValue}%`);
        queryParts.push(`AND c.status ILIKE $${values.length}`);
      }
    }

    if (priority) {
      values.push(priority);
      queryParts.push(`AND c.priority = $${values.length}`);
    }

    if (category) {
      values.push(category);
      queryParts.push(`AND c.category = $${values.length}`);
    }

    queryParts.push("ORDER BY c.created_at DESC");

    if (limit) {
      values.push(Number(limit));
      queryParts.push(`LIMIT $${values.length}`);
    }

    const { rows } = await pool.query(queryParts.join(" "), values);
    res.json(rows.map(normalizeComplaint));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function getComplaintById(req, res) {
  try {
    if (!req.user?.email) return res.status(401).json({ message: "Unauthorized" });

    const { rows } = await pool.query(
      `SELECT c.*,
        s.summon_no, s.hearing_date, s.hearing_time, s.venue,
        (SELECT MAX(hearing_number) FROM hearings h WHERE h.complaint_id = c.id) AS latest_hearing_number,
        (SELECT mediation_notes FROM hearings h WHERE h.complaint_id = c.id ORDER BY h.hearing_number DESC LIMIT 1) AS mediation_notes,
        (SELECT previous_notes FROM hearings h WHERE h.complaint_id = c.id ORDER BY h.hearing_number DESC LIMIT 1) AS previous_notes,
        (SELECT witnesses FROM hearings h WHERE h.complaint_id = c.id ORDER BY h.hearing_number DESC LIMIT 1) AS witnesses
       FROM complaints c
       LEFT JOIN summons s ON s.complaint_id = c.id
       WHERE c.id = $1 AND c.complainant_email = $2`,
      [req.params.id, req.user.email]
    );

    if (!rows[0]) return res.status(404).json({ message: "Complaint not found" });
    res.json(normalizeComplaint(rows[0]));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function createComplaint(req, res) {
  try {
    if (!req.user?.email) return res.status(401).json({ message: "Unauthorized" });

    const {
      category,
      priority,
      respondentName,
      respondentAddress,
      respondentContact,
      respondentEmail,
      respondentAge,
      description,
    } = req.body;

    if (!category || !respondentName) {
      return res.status(400).json({ message: "Category and respondent name are required" });
    }

    const userResult = await pool.query(
      `SELECT id, email, full_name, phone_number, username, resident_id
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    const dbUser = userResult.rows[0];
    if (!dbUser) return res.status(401).json({ message: "Unauthorized" });

    // Prefer the linked Resident's CURRENT information (barangay record is
    // the source of truth). Read live so future complaints always use the
    // latest data after barangay updates. Fall back to the User row when
    // no resident is linked (e.g. accounts created before verification).
    let linkedResident = null;
    if (dbUser.resident_id) {
      const residentResult = await pool.query(
        `SELECT full_name, email, contact_number, address, age
         FROM residents WHERE id = $1`,
        [dbUser.resident_id]
      );
      linkedResident = residentResult.rows[0] || null;
    }

    const complainantName =
      linkedResident?.full_name ||
      dbUser.full_name ||
      req.user.fullname ||
      dbUser.username ||
      dbUser.email;
    const complainantEmail = linkedResident?.email || dbUser.email;
    const complainantContact = linkedResident?.contact_number || dbUser.phone_number || null;
    const complainantAddress = linkedResident?.address || null;
    const complainantAge =
      linkedResident?.age !== null && linkedResident?.age !== undefined
        ? linkedResident.age
        : null;
    const complaintNo = await generateComplaintNo();

    const uploadedEvidence = Array.isArray(req.files)
      ? req.files.map((file) => `/uploads/evidence/${file.filename}`)
      : [];
    const evidenceJson = JSON.stringify(uploadedEvidence);

    let complaint;
    try {
      const { rows } = await pool.query(
        `INSERT INTO complaints (
          complaint_no,
          category,
          priority,
          status,
          description,
          evidence,
          complainant_name,
          complainant_email,
          complainant_address,
          complainant_contact,
          complainant_age,
          respondent_name,
          respondent_address,
          respondent_contact,
          respondent_email,
          respondent_age,
          date_filed,
          created_at,
          updated_at
        ) VALUES (
          $1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,CURRENT_DATE,NOW(),NOW()
        ) RETURNING *`,
        [
          complaintNo,
          category,
          priority || "Medium",
          "Pending",
          description || "",
          evidenceJson,
          complainantName,
          complainantEmail,
          complainantAddress,
          complainantContact,
          complainantAge,
          respondentName,
          respondentAddress || null,
          respondentContact || null,
          respondentEmail || null,
          respondentAge ? Number(respondentAge) : null,
        ]
      );
      complaint = rows[0];
    } catch (insertErr) {
      if (String(insertErr.message || "").includes("complaints_pkey")) {
        await pool.query(
          "SELECT setval(pg_get_serial_sequence('complaints', 'id'), (SELECT COALESCE(MAX(id), 1) FROM complaints))"
        );
        const retry = await pool.query(
          `INSERT INTO complaints (
            complaint_no, category, priority, status, description, evidence,
            complainant_name, complainant_email, complainant_address, complainant_contact, complainant_age,
            respondent_name, respondent_address, respondent_contact, respondent_email, respondent_age,
            date_filed, created_at, updated_at
          ) VALUES (
            $1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,CURRENT_DATE,NOW(),NOW()
          ) RETURNING *`,
          [
            complaintNo,
            category,
            priority || "Medium",
            "Pending",
            description || "",
            evidenceJson,
            complainantName,
            complainantEmail,
            complainantAddress,
            complainantContact,
            complainantAge,
            respondentName,
            respondentAddress || null,
            respondentContact || null,
            respondentEmail || null,
            respondentAge ? Number(respondentAge) : null,
          ]
        );
        complaint = retry.rows[0];
      } else {
        throw insertErr;
      }
    }

    await logResidentComplaintActivity(complaint.id, "Complaint Submitted", {
      complaintNo,
      category,
      status: "Pending",
      description: description || "",
      evidenceCount: uploadedEvidence.length,
    });

    await notifyResident(
      complaint.id,
      `Your complaint ${complaintNo} (${category}) was submitted and is pending review.`,
      "complaint_submitted"
    );

    res.status(201).json(normalizeComplaint(complaint));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function getNotifications(req, res) {
  try {
    if (!req.user?.email) return res.status(401).json({ message: "Unauthorized" });

    const { rows } = await pool.query(
      `SELECT
         n.id,
         n.complaint_id AS "complaintId",
         n.recipient,
         n.message,
         n.type,
         n.sent_at AS "sentAt",
         c.complaint_no AS "complaintNo"
       FROM notifications n
       LEFT JOIN complaints c ON n.complaint_id = c.id
       WHERE
         LOWER(COALESCE(n.recipient, '')) = LOWER($1)
         OR c.complainant_email = $1
       ORDER BY n.sent_at DESC`,
      [req.user.email]
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function getActivity(req, res) {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const { rows } = await pool.query(
      `SELECT
         a.id,
         a.action,
         a.entity_type AS "entityType",
         a.entity_id AS "entityId",
         a.details,
         a.created_at AS "createdAt",
         c.complaint_no AS "complaintNo",
         c.category
       FROM activity_logs a
       LEFT JOIN complaints c
         ON a.entity_type = 'complaint' AND a.entity_id = c.id
       WHERE
         a.user_id = $1
         OR c.complainant_email = $2
       ORDER BY a.created_at DESC`,
      [req.user.id, req.user.email]
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

function normalizeComplaint(row) {
  return {
    id: String(row.id),
    complaintNo: row.complaint_no,
    dateFiled: row.date_filed?.toISOString?.().slice(0, 10) ?? row.date_filed,
    complainant: row.complainant_name,
    complainantInfo: {
      name: row.complainant_name,
      age: row.complainant_age ?? 0,
      address: row.complainant_address || "",
      contact: row.complainant_contact || "",
      email: row.complainant_email || "",
    },
    respondent: row.respondent_name,
    respondentInfo: {
      name: row.respondent_name,
      age: row.respondent_age ?? 0,
      address: row.respondent_address || "",
      contact: row.respondent_contact || "",
      email: row.respondent_email || "",
    },
    category: row.category,
    priority: row.priority === "Low" ? "Normal" : row.priority,
    status: row.status,
    description: row.description || "",
    evidence: row.evidence || [],
    summonNo: row.summon_no,
    latestHearingNumber: row.latest_hearing_number ? Number(row.latest_hearing_number) : 0,
    hearingDate: row.hearing_date?.toISOString?.().slice(0, 10) ?? row.hearing_date,
    hearingTime: row.hearing_time,
    venue: row.venue,
    mediationNotes: row.mediation_notes,
    previousHearingNotes: row.previous_notes,
    witnesses: row.witnesses,
    createdAt: row.created_at,
  };
}

async function generateComplaintNo() {
  const { rows } = await pool.query("SELECT COUNT(*)::int AS count FROM complaints");
  const next = Number(rows[0]?.count || 0) + 1;
  return `ESM-${String(next).padStart(6, "0")}`;
}

module.exports = {
  getProfile,
  updateProfile,
  uploadProfilePicture,
  getComplaints,
  getComplaintById,
  createComplaint,
  getNotifications,
  getActivity,
};

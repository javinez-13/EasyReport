const pool = require("../database/db");

async function getComplaintMeta(complaintId) {
  const { rows } = await pool.query(
    `SELECT id, complaint_no, complainant_email, category, status
     FROM complaints WHERE id = $1`,
    [complaintId]
  );
  return rows[0] || null;
}

async function logResidentComplaintActivity(complaintId, action, details = {}) {
  const complaint = await getComplaintMeta(complaintId);
  if (!complaint) return null;

  let userId = null;
  if (complaint.complainant_email) {
    const userRes = await pool.query("SELECT id FROM users WHERE email = $1 LIMIT 1", [
      complaint.complainant_email,
    ]);
    userId = userRes.rows[0]?.id || null;
  }

  await pool.query(
    `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
     VALUES ($1, $2, 'complaint', $3, $4)`,
    [
      userId,
      action,
      complaint.id,
      JSON.stringify({
        complaintNo: complaint.complaint_no,
        category: complaint.category,
        status: complaint.status,
        ...details,
      }),
    ]
  );

  return complaint;
}

async function notifyResident(complaintId, message, type) {
  const complaint = await getComplaintMeta(complaintId);
  if (!complaint?.complainant_email) return null;

  await pool.query(
    `INSERT INTO notifications (complaint_id, recipient, message, type, sent_at)
     VALUES ($1, $2, $3, $4, NOW())`,
    [complaint.id, complaint.complainant_email, message, type]
  );

  return complaint;
}

module.exports = {
  getComplaintMeta,
  logResidentComplaintActivity,
  notifyResident,
};

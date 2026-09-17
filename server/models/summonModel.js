const pool = require("../database/db");

function mapSummon(row) {
  if (!row) return null;
  return {
    id: String(row.id),
    summonNo: row.summon_no,
    complaintId: String(row.complaint_id),
    complaintNo: row.complaint_no,
    complainant: row.complainant_name,
    respondent: row.respondent_name,
    hearingDate: row.hearing_date?.toISOString?.().slice(0, 10) ?? row.hearing_date,
    hearingTime: row.hearing_time,
    venue: row.venue,
    officer: row.officer,
    createdAt: row.created_at,
  };
}

async function generateSummonNo() {
  const { rows } = await pool.query("SELECT COUNT(*)::int + 1 AS next FROM summons");
  return `S-${String(rows[0].next).padStart(5, "0")}`;
}

async function create(data) {
  const summonNo = data.summonNo || (await generateSummonNo());

  const { rows } = await pool.query(
    `INSERT INTO summons (summon_no, complaint_id, hearing_date, hearing_time, venue, officer)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [summonNo, data.complaintId, data.hearingDate, data.hearingTime, data.venue, data.officer]
  );

  await pool.query(
    "UPDATE complaints SET status = 'In Progress', updated_at = NOW() WHERE id = $1",
    [data.complaintId]
  );

  const { rows: complaintRows } = await pool.query(
    "SELECT complaint_no, complainant_name, respondent_name FROM complaints WHERE id = $1",
    [data.complaintId]
  );

  return mapSummon({ ...rows[0], ...complaintRows[0] });
}

async function findByComplaintId(complaintId) {
  const { rows } = await pool.query(
    `SELECT s.*, c.complaint_no, c.complainant_name, c.respondent_name
     FROM summons s JOIN complaints c ON c.id = s.complaint_id
     WHERE s.complaint_id = $1 ORDER BY s.created_at DESC LIMIT 1`,
    [complaintId]
  );
  return mapSummon(rows[0]);
}

module.exports = { create, findByComplaintId, generateSummonNo };

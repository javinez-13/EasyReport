const pool = require("../database/db");

function mapHearing(row) {
  if (!row) return null;
  return {
    id: String(row.id),
    complaintId: String(row.complaint_id),
    complaintNo: row.complaint_no,
    complainant: row.complainant_name,
    respondent: row.respondent_name,
    date: row.hearing_date?.toISOString?.().slice(0, 10) ?? row.hearing_date,
    time: row.hearing_time,
    timeConsumed: row.time_consumed ?? "",
    assignedMediator: row.assigned_mediator ?? "",
    venue: row.venue ?? "",
    hearingNumber: row.hearing_number,
    status: row.status ?? "Scheduled",
    witnesses: row.witnesses ?? [],
    decision: row.decision ?? "",
    mediationNotes: row.mediation_notes ?? "",
    previousNotes: row.previous_notes ?? "",
    complaintStatus: row.complaint_status,
  };
}

async function findScheduled() {
  const { rows } = await pool.query(`
    SELECT h.*, c.complaint_no, c.complainant_name, c.respondent_name, c.status AS complaint_status
    FROM hearings h
    JOIN complaints c ON c.id = h.complaint_id
    WHERE h.status = 'Scheduled'
    ORDER BY h.hearing_date ASC, h.hearing_time ASC
  `);
  return rows.map(mapHearing);
}

async function findByComplaintId(complaintId) {
  const { rows } = await pool.query(
    `SELECT h.*, c.complaint_no, c.complainant_name, c.respondent_name, c.status AS complaint_status
     FROM hearings h
     JOIN complaints c ON c.id = h.complaint_id
     WHERE h.complaint_id = $1
     ORDER BY h.hearing_number ASC`,
    [complaintId]
  );
  return rows.map(mapHearing);
}

async function upsertHearing(data) {
  const hearingNum = Number(data.hearingNumber) || 1;
  const existing = await pool.query(
    `SELECT id FROM hearings WHERE complaint_id = $1 AND hearing_number = $2`,
    [data.complaintId, hearingNum]
  );

  let rows;
  if (existing.rows.length > 0) {
    const res = await pool.query(
      `UPDATE hearings 
       SET hearing_date = $1, hearing_time = $2, time_consumed = $3, assigned_mediator = $4,
           venue = $5, witnesses = $6::jsonb, decision = $7, mediation_notes = $8, previous_notes = $9, status = $10
       WHERE complaint_id = $11 AND hearing_number = $12
       RETURNING *`,
      [
        data.hearingDate ?? null,
        data.hearingTime ?? null,
        data.timeConsumed ?? null,
        data.assignedMediator ?? null,
        data.venue ?? null,
        JSON.stringify(data.witnesses ?? []),
        data.decision ?? null,
        data.mediationNotes ?? null,
        data.previousNotes ?? null,
        data.status ?? "Scheduled",
        data.complaintId,
        hearingNum,
      ]
    );
    rows = res.rows;
  } else {
    const res = await pool.query(
      `INSERT INTO hearings (complaint_id, hearing_number, hearing_date, hearing_time, time_consumed, assigned_mediator, venue, witnesses, decision, mediation_notes, previous_notes, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$11,$12) RETURNING *`,
      [
        data.complaintId,
        hearingNum,
        data.hearingDate ?? null,
        data.hearingTime ?? null,
        data.timeConsumed ?? null,
        data.assignedMediator ?? null,
        data.venue ?? null,
        JSON.stringify(data.witnesses ?? []),
        data.decision ?? null,
        data.mediationNotes ?? null,
        data.previousNotes ?? null,
        data.status ?? "Scheduled",
      ]
    );
    rows = res.rows;
  }

  const hearing = rows[0];
  const { rows: complaintRows } = await pool.query(
    "SELECT complaint_no, complainant_name, respondent_name, status FROM complaints WHERE id = $1",
    [data.complaintId]
  );

  return mapHearing({ ...hearing, ...complaintRows[0], complaint_status: complaintRows[0]?.status });
}

async function getNextHearingNumber(complaintId) {
  const { rows } = await pool.query(
    "SELECT COALESCE(MAX(hearing_number), 0) + 1 AS next FROM hearings WHERE complaint_id = $1",
    [complaintId]
  );
  return rows[0].next;
}

async function getPreviousNotes(complaintId) {
  const { rows } = await pool.query(
    `SELECT mediation_notes FROM hearings
     WHERE complaint_id = $1 AND mediation_notes IS NOT NULL
     ORDER BY hearing_number DESC LIMIT 1`,
    [complaintId]
  );
  return rows[0]?.mediation_notes ?? null;
}

module.exports = {
  findScheduled,
  findByComplaintId,
  create: upsertHearing,
  upsertHearing,
  getNextHearingNumber,
  getPreviousNotes,
};

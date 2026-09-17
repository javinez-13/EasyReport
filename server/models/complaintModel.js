const pool = require("../database/db");

function normalizeStatus(status) {
  const legacy = {
    "Forwarded to Court": "Unsettled",
    Rejected: "Cancelled",
  };
  return legacy[status] || status;
}

function normalizePriority(priority) {
  return priority === "Low" ? "Normal" : priority;
}

function mapComplaint(row) {
  if (!row) return null;
  return {
    id: String(row.id),
    complaintNo: row.complaint_no,
    dateFiled: row.date_filed?.toISOString?.().slice(0, 10) ?? row.date_filed,
    complainant: row.complainant_name,
    complainantInfo: {
      name: row.complainant_name,
      age: row.complainant_age ?? 0,
      address: row.complainant_address ?? "",
      contact: row.complainant_contact ?? "",
      email: row.complainant_email ?? "",
    },
    respondent: row.respondent_name,
    respondentInfo: {
      name: row.respondent_name,
      age: row.respondent_age ?? 0,
      address: row.respondent_address ?? "",
      contact: row.respondent_contact ?? "",
      email: row.respondent_email ?? "",
    },
    category: row.category,
    priority: normalizePriority(row.priority),
    status: normalizeStatus(row.status),
    description: row.description ?? "",
    evidence: row.evidence ?? [],
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

const complaintSelect = `
  SELECT c.*,
    s.summon_no, s.hearing_date, s.hearing_time, s.venue,
    (SELECT MAX(hearing_number) FROM hearings h WHERE h.complaint_id = c.id) AS latest_hearing_number,
    (SELECT mediation_notes FROM hearings h WHERE h.complaint_id = c.id ORDER BY h.hearing_number DESC LIMIT 1) AS mediation_notes,
    (SELECT previous_notes FROM hearings h WHERE h.complaint_id = c.id ORDER BY h.hearing_number DESC LIMIT 1) AS previous_notes,
    (SELECT witnesses FROM hearings h WHERE h.complaint_id = c.id ORDER BY h.hearing_number DESC LIMIT 1) AS witnesses
  FROM complaints c
  LEFT JOIN summons s ON s.complaint_id = c.id
`;

function buildFilterWhere(filters = {}, paramOffset = 0, tableAlias = "c") {
  const whereClauses = [];
  const queryParams = [];
  const prefix = tableAlias ? `${tableAlias}.` : "";

  if (filters.search && filters.search.trim()) {
    queryParams.push(`%${filters.search.trim()}%`);
    const idx = queryParams.length + paramOffset;
    whereClauses.push(
      `(${prefix}complaint_no ILIKE $${idx} OR ${prefix}complainant_name ILIKE $${idx} OR ${prefix}respondent_name ILIKE $${idx} OR ${prefix}category ILIKE $${idx} OR ${prefix}status ILIKE $${idx} OR ${prefix}description ILIKE $${idx})`
    );
  }

  if (filters.status && filters.status !== "All" && filters.status !== "all") {
    if (filters.status === "Cancelled") {
      whereClauses.push(`(${prefix}status = 'Cancelled' OR ${prefix}status = 'Rejected')`);
    } else if (filters.status === "Unsettled") {
      whereClauses.push(`(${prefix}status = 'Unsettled' OR ${prefix}status = 'Forwarded to Court')`);
    } else {
      queryParams.push(filters.status);
      const idx = queryParams.length + paramOffset;
      whereClauses.push(`${prefix}status = $${idx}`);
    }
  }

  if (filters.priority && filters.priority !== "All" && filters.priority !== "all") {
    if (filters.priority === "Normal") {
      whereClauses.push(`(${prefix}priority = 'Normal' OR ${prefix}priority = 'Low')`);
    } else {
      queryParams.push(filters.priority);
      const idx = queryParams.length + paramOffset;
      whereClauses.push(`${prefix}priority = $${idx}`);
    }
  }

  if (filters.category && filters.category !== "All" && filters.category !== "all") {
    queryParams.push(filters.category);
    const idx = queryParams.length + paramOffset;
    whereClauses.push(`${prefix}category = $${idx}`);
  }

  if (filters.startDate) {
    queryParams.push(filters.startDate);
    const idx = queryParams.length + paramOffset;
    whereClauses.push(`(${prefix}created_at >= $${idx}::timestamptz OR ${prefix}date_filed >= $${idx}::date)`);
  }

  if (filters.endDate) {
    queryParams.push(`${filters.endDate} 23:59:59`);
    const idx = queryParams.length + paramOffset;
    whereClauses.push(`(${prefix}created_at <= $${idx}::timestamptz OR ${prefix}date_filed <= $${idx}::date)`);
  }

  if (filters.year) {
    queryParams.push(Number(filters.year));
    const idx = queryParams.length + paramOffset;
    whereClauses.push(`EXTRACT(YEAR FROM COALESCE(${prefix}created_at, ${prefix}date_filed)) = $${idx}`);
  }

  if (filters.month) {
    queryParams.push(Number(filters.month));
    const idx = queryParams.length + paramOffset;
    whereClauses.push(`EXTRACT(MONTH FROM COALESCE(${prefix}created_at, ${prefix}date_filed)) = $${idx}`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
  return { whereSql, whereClauses, queryParams };
}

async function findAll(filters = {}) {
  const { whereSql, queryParams } = buildFilterWhere(filters, 0, "c");

  const sql = `
    ${complaintSelect}
    ${whereSql}
    ORDER BY
      CASE COALESCE(c.priority, 'Normal')
        WHEN 'High' THEN 1
        WHEN 'Critical' THEN 1
        WHEN 'Medium' THEN 2
        WHEN 'Low' THEN 3
        WHEN 'Normal' THEN 3
        ELSE 4
      END ASC,
      c.created_at DESC
  `;

  const { rows } = await pool.query(sql, queryParams);
  return rows.map(mapComplaint);
}

async function findRecent(limit = 10) {
  const { rows } = await pool.query(
    `${complaintSelect} ORDER BY c.created_at DESC LIMIT $1`,
    [limit]
  );
  return rows.map(mapComplaint);
}

async function findById(id) {
  const { rows } = await pool.query(`${complaintSelect} WHERE c.id = $1`, [id]);
  return mapComplaint(rows[0]);
}

async function updateStatus(id, status) {
  const resolvedAt = status === "Resolved" ? new Date() : null;
  const { rows } = await pool.query(
    `UPDATE complaints SET status = $1, updated_at = NOW(), resolved_at = COALESCE($3, resolved_at)
     WHERE id = $2 RETURNING *`,
    [status, id, resolvedAt]
  );
  return mapComplaint(rows[0]);
}

async function updateRespondent(id, respondentData) {
  const { name, address, contact, email, age } = respondentData;
  const { rows } = await pool.query(
    `UPDATE complaints
     SET respondent_name = COALESCE($1, respondent_name),
         respondent_address = COALESCE($2, respondent_address),
         respondent_contact = COALESCE($3, respondent_contact),
         respondent_email = COALESCE($4, respondent_email),
         respondent_age = COALESCE($5, respondent_age),
         updated_at = NOW()
     WHERE id = $6 RETURNING *`,
    [name, address, contact, email, age ? Number(age) : null, id]
  );
  return mapComplaint(rows[0]);
}

async function getCategories() {
  const { rows } = await pool.query(`
    SELECT DISTINCT category FROM complaints WHERE category IS NOT NULL AND category != '' ORDER BY category ASC
  `);
  return rows.map((r) => r.category);
}

async function getStatusCounts(filters = {}) {
  const statusFilters = { ...filters };
  delete statusFilters.status;
  const { whereSql, queryParams } = buildFilterWhere(statusFilters, 0, "c");

  const { rows } = await pool.query(`
    SELECT status, COUNT(*)::int AS count FROM complaints c ${whereSql} GROUP BY status
  `, queryParams);

  const counts = {
    Pending: 0,
    "In Progress": 0,
    Scheduled: 0,
    Resolved: 0,
    Cancelled: 0,
    Unsettled: 0,
  };
  for (const row of rows) {
    const status = normalizeStatus(row.status);
    counts[status] = (counts[status] ?? 0) + row.count;
  }
  return counts;
}

async function getMonthlyAnalytics(filters = {}) {
  const { whereClauses, queryParams } = buildFilterWhere(filters, 0, "c");
  const extraWhere = whereClauses.length > 0 ? `AND ${whereClauses.join(" AND ")}` : "";

  const { rows } = await pool.query(`
    SELECT
      TO_CHAR(d.month, 'Mon') AS month,
      COALESCE(COUNT(c.id), 0)::int AS complaints,
      COALESCE(COUNT(CASE WHEN c.status = 'Pending' THEN 1 END), 0)::int AS pending,
      COALESCE(COUNT(CASE WHEN c.status = 'In Progress' THEN 1 END), 0)::int AS "inProgress",
      COALESCE(COUNT(CASE WHEN c.status = 'Scheduled' THEN 1 END), 0)::int AS scheduled,
      COALESCE(COUNT(CASE WHEN c.status = 'Resolved' THEN 1 END), 0)::int AS resolved,
      COALESCE(COUNT(CASE WHEN c.status = 'Cancelled' OR c.status = 'Rejected' THEN 1 END), 0)::int AS cancelled,
      COALESCE(COUNT(CASE WHEN c.status = 'Unsettled' OR c.status = 'Forwarded to Court' THEN 1 END), 0)::int AS unsettled
    FROM (
      SELECT DATE_TRUNC('month', CURRENT_DATE) - (n || ' months')::interval AS month
      FROM generate_series(5, 0, -1) AS n
    ) d
    LEFT JOIN complaints c ON DATE_TRUNC('month', c.created_at) = d.month ${extraWhere}
    GROUP BY d.month
    ORDER BY d.month
  `, queryParams);
  return rows;
}

async function getCategoryCounts(filters = {}) {
  const { whereSql, queryParams } = buildFilterWhere(filters, 0, "c");
  const { rows } = await pool.query(`
    SELECT category, COUNT(*)::int AS total FROM complaints c ${whereSql} GROUP BY category ORDER BY total DESC
  `, queryParams);
  return rows.map((r) => ({ category: r.category || "Uncategorized", total: r.total }));
}

async function getPriorityCounts(filters = {}) {
  const { whereSql, queryParams } = buildFilterWhere(filters, 0, "c");
  const { rows } = await pool.query(`
    SELECT priority, COUNT(*)::int AS cases FROM complaints c ${whereSql} GROUP BY priority ORDER BY cases DESC
  `, queryParams);
  const normalizedMap = {};
  for (const r of rows) {
    const p = normalizePriority(r.priority || "Normal");
    normalizedMap[p] = (normalizedMap[p] || 0) + r.cases;
  }
  return Object.entries(normalizedMap).map(([priority, cases]) => ({ priority, cases }));
}

async function getAvgResolutionDays(filters = {}) {
  const { whereClauses, queryParams } = buildFilterWhere(filters, 0, "c");
  const allClauses = ["c.resolved_at IS NOT NULL", ...whereClauses];
  const whereSql = `WHERE ${allClauses.join(" AND ")}`;
  const { rows } = await pool.query(`
    SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (c.resolved_at - c.created_at)) / 86400), 0)::numeric(10,1) AS avg_days
    FROM complaints c ${whereSql}
  `, queryParams);
  return parseFloat(rows[0]?.avg_days) || 0;
}

async function getHearingAnalytics(filters = {}) {
  const { whereSql, queryParams } = buildFilterWhere(filters, 0, "c");

  const summaryRes = await pool.query(`
    SELECT
      COUNT(h.id)::int AS total_hearings,
      COUNT(DISTINCT h.complaint_id)::int AS complaints_with_hearings
    FROM hearings h
    JOIN complaints c ON c.id = h.complaint_id
    ${whereSql}
  `, queryParams);

  const totalHearings = summaryRes.rows[0]?.total_hearings || 0;
  const complaintsWithHearings = summaryRes.rows[0]?.complaints_with_hearings || 0;
  const avgHearingsPerCase = complaintsWithHearings > 0
    ? Math.round((totalHearings / complaintsWithHearings) * 10) / 10
    : 0;

  const stagesRes = await pool.query(`
    SELECT
      h.hearing_number,
      COUNT(*)::int AS count
    FROM hearings h
    JOIN complaints c ON c.id = h.complaint_id
    ${whereSql}
    GROUP BY h.hearing_number
    ORDER BY h.hearing_number ASC
  `, queryParams);

  const stageLabels = {
    1: "Stage 1: Mediation",
    2: "Stage 2: Conciliation",
    3: "Stage 3: Arbitration",
    4: "Stage 4: Enforcement/Cert",
  };

  const hearingsByStage = [1, 2, 3, 4].map((num) => {
    const row = stagesRes.rows.find((r) => r.hearing_number === num);
    return {
      stageNumber: num,
      stage: stageLabels[num] || `Hearing #${num}`,
      count: row ? row.count : 0,
    };
  });

  const mediatorsRes = await pool.query(`
    SELECT
      COALESCE(NULLIF(TRIM(h.assigned_mediator), ''), 'Unassigned') AS mediator,
      COUNT(*)::int AS count
    FROM hearings h
    JOIN complaints c ON c.id = h.complaint_id
    ${whereSql}
    GROUP BY mediator
    ORDER BY count DESC
    LIMIT 10
  `, queryParams);

  return {
    totalHearings,
    complaintsWithHearings,
    avgHearingsPerCase,
    hearingsByStage,
    hearingsByMediator: mediatorsRes.rows,
  };
}

async function getCategoryPerformance(filters = {}) {
  const { whereSql, queryParams } = buildFilterWhere(filters, 0, "c");
  const { rows } = await pool.query(`
    SELECT
      c.category,
      COUNT(*)::int AS total,
      COUNT(CASE WHEN c.status = 'Resolved' THEN 1 END)::int AS resolved,
      COUNT(CASE WHEN c.status = 'In Progress' THEN 1 END)::int AS "inProgress",
      COUNT(CASE WHEN c.status = 'Unsettled' OR c.status = 'Forwarded to Court' THEN 1 END)::int AS unsettled,
      COALESCE(AVG(CASE WHEN c.status = 'Resolved' AND c.resolved_at IS NOT NULL
        THEN EXTRACT(EPOCH FROM (c.resolved_at - c.created_at)) / 86400 END), 0)::numeric(10,1) AS avg_days
    FROM complaints c
    ${whereSql}
    GROUP BY c.category
    ORDER BY total DESC
  `, queryParams);

  return rows.map((r) => {
    const total = r.total || 0;
    const resolved = r.resolved || 0;
    const rate = total > 0 ? Math.round((resolved / total) * 1000) / 10 : 0;
    return {
      category: r.category || "Uncategorized",
      total,
      resolved,
      inProgress: r.inProgress || 0,
      unsettled: r.unsettled || 0,
      rate,
      avgDays: parseFloat(r.avg_days) || 0,
    };
  });
}

async function getSlaCompliance(filters = {}) {
  const { whereSql, queryParams } = buildFilterWhere(filters, 0, "c");
  const sql = `
    SELECT
      COUNT(*)::int AS total_cases,
      COUNT(CASE WHEN EXTRACT(EPOCH FROM (COALESCE(c.resolved_at, NOW()) - c.created_at)) / 86400 <= 15 THEN 1 END)::int AS within_15_days,
      COUNT(CASE WHEN EXTRACT(EPOCH FROM (COALESCE(c.resolved_at, NOW()) - c.created_at)) / 86400 > 15 AND EXTRACT(EPOCH FROM (COALESCE(c.resolved_at, NOW()) - c.created_at)) / 86400 <= 30 THEN 1 END)::int AS within_30_days,
      COUNT(CASE WHEN EXTRACT(EPOCH FROM (COALESCE(c.resolved_at, NOW()) - c.created_at)) / 86400 > 30 THEN 1 END)::int AS over_30_days,
      COUNT(CASE WHEN c.status NOT IN ('Resolved', 'Cancelled', 'Rejected') AND EXTRACT(EPOCH FROM (NOW() - c.created_at)) / 86400 > 30 THEN 1 END)::int AS active_overdue,
      COUNT(CASE WHEN c.status = 'Resolved' AND EXTRACT(EPOCH FROM (c.resolved_at - c.created_at)) / 86400 <= 30 THEN 1 END)::int AS resolved_compliant
    FROM complaints c
    ${whereSql}
  `;
  const { rows } = await pool.query(sql, queryParams);
  const row = rows[0] || {};
  const total = row.total_cases || 0;
  const compliantCount = (row.within_15_days || 0) + (row.within_30_days || 0);
  const complianceRate = total > 0 ? Math.round((compliantCount / total) * 1000) / 10 : 100;

  return {
    totalCases: total,
    within15Days: row.within_15_days || 0,
    within30Days: row.within_30_days || 0,
    over30Days: row.over_30_days || 0,
    activeOverdue: row.active_overdue || 0,
    complianceRate,
  };
}

module.exports = {
  findAll,
  findRecent,
  findById,
  updateStatus,
  updateRespondent,
  getCategories,
  getStatusCounts,
  getMonthlyAnalytics,
  getCategoryCounts,
  getPriorityCounts,
  getAvgResolutionDays,
  getHearingAnalytics,
  getCategoryPerformance,
  getSlaCompliance,
};


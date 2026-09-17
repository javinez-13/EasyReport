const pool = require("../database/db");

function mapResident(row) {
  if (!row) return null;
  const linkedUserId = row.linked_user_id ?? null;
  return {
    id: row.resident_id,
    dbId: row.id,
    fullName: row.full_name,
    firstName: row.first_name ?? "",
    middleName: row.middle_name ?? "",
    lastName: row.last_name ?? "",
    suffix: row.suffix ?? "",
    birthdate: row.birthdate?.toISOString?.().slice(0, 10) ?? row.birthdate,
    birthPlace: row.birth_place ?? "",
    age: row.age,
    gender: row.gender,
    civilStatus: row.civil_status,
    nationality: row.nationality ?? "",
    religion: row.religion ?? "",
    occupation: row.occupation ?? "",
    address: row.address,
    contactNumber: row.contact_number,
    email: row.email ?? "",
    pwdIdNo: row.pwd_id_no ?? "",
    familyMonthlyIncome: row.family_monthly_income ?? "",
    indigent: row.indigent ?? "",
    registeredVoter: row.registered_voter ?? "",
    precinctNo: row.precinct_no ?? "",
    voterIdNo: row.voter_id_no ?? "",
    photoUrl: row.photo_url ?? "",
    householdNumber: row.household_number ?? "",
    emergencyContact: row.emergency_contact ?? "",
    dateRegistered: row.created_at?.toISOString?.().slice(0, 10) ?? row.created_at,
    // Registration status derives from the User <-> Resident relationship:
    // a linked user means REGISTERED, otherwise NOT REGISTERED.
    userId: linkedUserId,
    isRegistered: linkedUserId != null,
  };
}

// `id` may be the integer PK ("20") or the public code ("R-007").
// Comparing one placeholder against both an int column and a varchar
// column makes Postgres fail with "operator does not exist", and casting
// a code like 'R-007' to int fails too — so the lookup matches the PK
// only when the input is all digits, otherwise matches resident_id.
const ID_MATCH = `(CASE WHEN $ID1 ~ '^[0-9]+$' THEN r.id = $ID1::int ELSE FALSE END OR r.resident_id = $ID2)`;

function idParams(id, first = 1) {
  const s = String(id);
  const a = `$${first}`;
  const b = `$${first + 1}`;
  return {
    text: ID_MATCH.replaceAll("$ID1", a).replaceAll("$ID2", b),
    params: [s, s],
  };
}

async function findAll() {
  const { rows } = await pool.query(
    `SELECT r.*, u.id AS linked_user_id
     FROM residents r
     LEFT JOIN users u ON u.resident_id = r.id
     ORDER BY r.created_at DESC`
  );
  return rows.map(mapResident);
}

async function findById(id) {
  if (id === undefined || id === null || String(id).trim() === "") return null;
  const where = idParams(id, 1);
  const { rows } = await pool.query(
    `SELECT r.*, u.id AS linked_user_id
     FROM residents r
     LEFT JOIN users u ON u.resident_id = r.id
     WHERE ${where.text}`,
    where.params
  );
  return mapResident(rows[0]);
}

function computeAge(birthdate, fallbackAge) {
  if (birthdate) {
    const ms = Date.now() - new Date(birthdate).getTime();
    if (!Number.isNaN(ms) && ms >= 0) {
      return Math.floor(ms / (365.25 * 24 * 60 * 60 * 1000));
    }
    return fallbackAge ?? null;
  }
  return fallbackAge ?? null;
}

// `undefined` means "field not sent" -> keep existing value (COALESCE).
// Registration-link fields are never written from here: the FK lives on
// users.resident_id, so updating residents cannot unlink a User account.
function clean(value) {
  return value === undefined ? null : value;
}

async function create(data) {
  const residentId = await generateResidentId();
  const birthdate = data.birthdate || null;
  const age = computeAge(birthdate, data.age);

  const { rows } = await pool.query(
    `INSERT INTO residents (resident_id, full_name, first_name, middle_name, last_name, suffix,
      birthdate, birth_place, age, gender, civil_status, nationality, religion, occupation,
      address, contact_number, email, pwd_id_no, family_monthly_income, indigent,
      registered_voter, precinct_no, voter_id_no, photo_url, household_number, emergency_contact)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26)
     RETURNING resident_id`,
    [
      residentId,
      data.fullName,
      clean(data.firstName),
      clean(data.middleName),
      clean(data.lastName),
      clean(data.suffix),
      birthdate,
      clean(data.birthPlace),
      age,
      clean(data.gender),
      clean(data.civilStatus),
      clean(data.nationality),
      clean(data.religion),
      clean(data.occupation),
      clean(data.address),
      clean(data.contactNumber),
      data.email ?? "",
      clean(data.pwdIdNo),
      clean(data.familyMonthlyIncome),
      clean(data.indigent),
      clean(data.registeredVoter),
      clean(data.precinctNo),
      clean(data.voterIdNo),
      clean(data.photoUrl),
      data.householdNumber ?? "",
      data.emergencyContact ?? "",
    ]
  );
  // Re-select with the users join so userId/isRegistered are populated.
  return findById(rows[0].resident_id);
}

async function update(id, data) {
  if (id === undefined || id === null || String(id).trim() === "") return null;
  const birthdate = data.birthdate || null;
  const age = computeAge(birthdate, data.age);
  // WHERE owns $1..$2, SET owns $3..$27.
  const where = idParams(id, 1);

  const { rows } = await pool.query(
    `UPDATE residents r SET
      full_name = COALESCE($3, full_name),
      first_name = COALESCE($4, first_name),
      middle_name = COALESCE($5, middle_name),
      last_name = COALESCE($6, last_name),
      suffix = COALESCE($7, suffix),
      birthdate = COALESCE($8, birthdate),
      birth_place = COALESCE($9, birth_place),
      age = COALESCE($10, age),
      gender = COALESCE($11, gender),
      civil_status = COALESCE($12, civil_status),
      nationality = COALESCE($13, nationality),
      religion = COALESCE($14, religion),
      occupation = COALESCE($15, occupation),
      address = COALESCE($16, address),
      contact_number = COALESCE($17, contact_number),
      email = COALESCE($18, email),
      pwd_id_no = COALESCE($19, pwd_id_no),
      family_monthly_income = COALESCE($20, family_monthly_income),
      indigent = COALESCE($21, indigent),
      registered_voter = COALESCE($22, registered_voter),
      precinct_no = COALESCE($23, precinct_no),
      voter_id_no = COALESCE($24, voter_id_no),
      photo_url = COALESCE($25, photo_url),
      household_number = COALESCE($26, household_number),
      emergency_contact = COALESCE($27, emergency_contact)
     WHERE ${where.text.replaceAll("r.", "")}
     RETURNING resident_id`,
    [
      ...where.params,
      clean(data.fullName),
      clean(data.firstName),
      clean(data.middleName),
      clean(data.lastName),
      clean(data.suffix),
      birthdate,
      clean(data.birthPlace),
      age,
      clean(data.gender),
      clean(data.civilStatus),
      clean(data.nationality),
      clean(data.religion),
      clean(data.occupation),
      clean(data.address),
      clean(data.contactNumber),
      clean(data.email),
      clean(data.pwdIdNo),
      clean(data.familyMonthlyIncome),
      clean(data.indigent),
      clean(data.registeredVoter),
      clean(data.precinctNo),
      clean(data.voterIdNo),
      clean(data.photoUrl),
      clean(data.householdNumber),
      clean(data.emergencyContact),
    ]
  );
  if (!rows[0]) return null;
  // Re-select with the users join: UPDATE ... RETURNING * cannot see the
  // linked user, and returning it directly would falsely flip the
  // REGISTERED badge to NOT REGISTERED after every edit.
  return findById(rows[0].resident_id);
}

async function remove(id) {
  if (id === undefined || id === null || String(id).trim() === "") return false;
  const where = idParams(id, 1);
  const { rowCount } = await pool.query(
    `DELETE FROM residents WHERE ${where.text.replaceAll("r.", "")}`,
    where.params
  );
  return rowCount > 0;
}

async function generateResidentId() {
  const { rows } = await pool.query(
    "SELECT COUNT(*)::int + 1 AS next FROM residents"
  );
  let next = rows[0].next;
  // Guard against COUNT-based collisions (deleted rows / concurrent inserts).
  for (;;) {
    const candidate = `R-${String(next).padStart(3, "0")}`;
    const existing = await pool.query(
      "SELECT 1 FROM residents WHERE resident_id = $1",
      [candidate]
    );
    if (existing.rowCount === 0) return candidate;
    next += 1;
  }
}

module.exports = { findAll, findById, create, update, remove };

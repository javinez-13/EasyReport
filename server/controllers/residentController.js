const residentModel = require("../models/residentModel");

async function getAll(req, res) {
  try {
    const residents = await residentModel.findAll();
    res.json(residents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function getById(req, res) {
  try {
    if (!req.params.id || !String(req.params.id).trim()) {
      return res.status(400).json({ message: "Resident ID is required." });
    }
    const resident = await residentModel.findById(req.params.id);
    if (!resident) return res.status(404).json({ message: "Resident not found" });
    res.json(resident);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

function validateResidentInput(data, { requireFullName = false } = {}) {
  const errors = [];
  // Never allow the registration link to be written through residents.
  if (data.userId !== undefined || data.isRegistered !== undefined) {
    errors.push("userId/isRegistered cannot be updated through this endpoint.");
  }
  const fullName = data.fullName;
  if (requireFullName || fullName !== undefined) {
    if (typeof fullName !== "string" || !fullName.trim()) {
      errors.push("Full name is required.");
    }
  }
  if (data.birthdate !== undefined && data.birthdate !== null && data.birthdate !== "") {
    if (Number.isNaN(new Date(data.birthdate).getTime())) {
      errors.push("Birthdate must be a valid date.");
    }
  }
  if (data.age !== undefined && data.age !== null && data.age !== "") {
    const ageNum = Number(data.age);
    if (!Number.isInteger(ageNum) || ageNum < 0 || ageNum > 150) {
      errors.push("Age must be a whole number between 0 and 150.");
    }
  }
  if (data.email !== undefined && data.email !== null && data.email !== "") {
    if (typeof data.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push("Email must be a valid email address.");
    }
  }
  return errors;
}

// Strip registration-link fields so an edit can never unlink a User account.
function sanitizeResidentInput(data) {
  const { userId, isRegistered, id, dbId, residentId, dateRegistered, ...rest } = data;
  return rest;
}

async function create(req, res) {
  try {
    const errors = validateResidentInput(req.body, { requireFullName: true });
    if (errors.length) return res.status(400).json({ message: errors.join(" ") });
    const resident = await residentModel.create(sanitizeResidentInput(req.body));
    res.status(201).json(resident);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function update(req, res) {
  try {
    if (!req.params.id || !String(req.params.id).trim()) {
      return res.status(400).json({ message: "Resident ID is required." });
    }
    const errors = validateResidentInput(req.body);
    if (errors.length) return res.status(400).json({ message: errors.join(" ") });
    const resident = await residentModel.update(req.params.id, sanitizeResidentInput(req.body));
    if (!resident) return res.status(404).json({ message: "Resident not found" });
    res.json(resident);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function remove(req, res) {
  try {
    if (!req.params.id || !String(req.params.id).trim()) {
      return res.status(400).json({ message: "Resident ID is required." });
    }
    const deleted = await residentModel.remove(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Resident not found" });
    res.json({ message: "Resident deleted." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function uploadPhoto(req, res) {
  try {
    if (!req.params.id || !String(req.params.id).trim()) {
      return res.status(400).json({ message: "Resident ID is required." });
    }
    if (!req.file) {
      return res.status(400).json({ message: "Photo file is required." });
    }
    const photoUrl = `/uploads/residents/${req.file.filename}`;
    // Reuses the update path so userId/isRegistered survive via the
    // users join re-select, and unknown ids yield 404.
    const resident = await residentModel.update(req.params.id, { photoUrl });
    if (!resident) return res.status(404).json({ message: "Resident not found" });
    res.json(resident);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = { getAll, getById, create, update, remove, uploadPhoto };

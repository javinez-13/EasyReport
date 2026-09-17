const summonModel = require("../models/summonModel");
const complaintModel = require("../models/complaintModel");
const {
  logResidentComplaintActivity,
  notifyResident,
  getComplaintMeta,
} = require("../utils/residentNotify");

async function create(req, res) {
  try {
    const { complaintId, hearingDate, hearingTime, venue, officer, summonNo } = req.body;

    const summon = await summonModel.create({
      complaintId,
      hearingDate,
      hearingTime,
      venue,
      officer,
      summonNo,
    });

    await complaintModel.updateStatus(complaintId, "Scheduled");

    await logResidentComplaintActivity(complaintId, "Hearing Scheduled", {
      hearingDate,
      hearingTime,
      venue,
      officer,
      summonNo: summon.summonNo || summonNo || null,
      status: "Scheduled",
    });

    await notifyResident(
      complaintId,
      `A hearing has been scheduled${hearingDate ? ` on ${hearingDate}` : ""}${
        hearingTime ? ` at ${hearingTime}` : ""
      }${venue ? ` (${venue})` : ""}.`,
      "hearing_scheduled"
    );

    res.status(201).json(summon);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function getByComplaint(req, res) {
  try {
    const summon = await summonModel.findByComplaintId(req.params.complaintId);
    if (!summon) return res.status(404).json({ message: "Summon not found" });
    res.json(summon);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function notifyRespondent(req, res) {
  try {
    const summon = await summonModel.findByComplaintId(req.params.complaintId);
    if (!summon) return res.status(404).json({ message: "Summon not found" });

    const complaint = await getComplaintMeta(req.params.complaintId);

    await notifyResident(
      req.params.complaintId,
      `You are summoned to appear on ${summon.hearingDate} at ${summon.hearingTime}, ${summon.venue}.`,
      "summon"
    );

    // Keep respondent notification for admin workflow compatibility
    if (summon.respondent) {
      const pool = require("../database/db");
      await pool.query(
        `INSERT INTO notifications (complaint_id, recipient, message, type, sent_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [
          req.params.complaintId,
          summon.respondent,
          `You are summoned to appear on ${summon.hearingDate} at ${summon.hearingTime}, ${summon.venue}.`,
          "summon",
        ]
      );
    }

    res.json({
      message: "Notification sent.",
      complainant: complaint?.complainant_email || null,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = { create, getByComplaint, notifyRespondent };

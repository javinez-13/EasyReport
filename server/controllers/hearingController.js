const hearingModel = require("../models/hearingModel");
const complaintModel = require("../models/complaintModel");
const {
  logResidentComplaintActivity,
  notifyResident,
} = require("../utils/residentNotify");

async function getScheduled(req, res) {
  try {
    const hearings = await hearingModel.findScheduled();
    res.json(hearings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function getByComplaint(req, res) {
  try {
    const hearings = await hearingModel.findByComplaintId(req.params.complaintId);
    res.json(hearings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function saveHearing(req, res) {
  try {
    const {
      complaintId,
      hearingNumber,
      hearingDate,
      hearingTime,
      timeConsumed,
      assignedMediator,
      venue,
      witnesses,
      decision,
      mediationNotes,
      complaintStatus,
      status,
    } = req.body;

    if (!complaintId) {
      return res.status(400).json({ message: "complaintId is required" });
    }

    const previousNotes = await hearingModel.getPreviousNotes(complaintId);
    const hearingNum = Number(hearingNumber) || (await hearingModel.getNextHearingNumber(complaintId));

    const hearing = await hearingModel.upsertHearing({
      complaintId,
      hearingNumber: hearingNum,
      hearingDate,
      hearingTime,
      timeConsumed,
      assignedMediator,
      venue,
      witnesses: Array.isArray(witnesses) ? witnesses.filter(Boolean) : [],
      decision,
      mediationNotes,
      previousNotes,
      status: status || "Scheduled",
    });

    if (complaintStatus) {
      await complaintModel.updateStatus(complaintId, complaintStatus);
    }

    const actionLabel =
      String(complaintStatus || "").toLowerCase().includes("resolved")
        ? "Resolved"
        : String(complaintStatus || "").toLowerCase().includes("progress")
          ? "In Progress"
          : "Hearing Scheduled";

    await logResidentComplaintActivity(complaintId, actionLabel, {
      hearingNumber: hearingNum,
      hearingDate,
      hearingTime,
      venue,
      status: complaintStatus || status || "Scheduled",
      decision: decision || null,
    });

    await notifyResident(
      complaintId,
      actionLabel === "Resolved"
        ? `Your complaint has been successfully resolved.`
        : actionLabel === "In Progress"
          ? `Your complaint is now In Progress.`
          : `Hearing ${hearingNum} scheduled${hearingDate ? ` on ${hearingDate}` : ""}${
              hearingTime ? ` at ${hearingTime}` : ""
            }${venue ? ` (${venue})` : ""}.`,
      actionLabel === "Resolved"
        ? "complaint_resolved"
        : actionLabel === "In Progress"
          ? "complaint_status_updated"
          : "hearing_scheduled"
    );

    res.status(200).json(hearing);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = { getScheduled, getByComplaint, create: saveHearing, saveHearing };

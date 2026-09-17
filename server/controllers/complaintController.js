const complaintModel = require("../models/complaintModel");
const {
  logResidentComplaintActivity,
  notifyResident,
} = require("../utils/residentNotify");

async function getAll(req, res) {
  try {
    const { search, status, priority, category } = req.query;
    const complaints = await complaintModel.findAll({ search, status, priority, category });
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function getCategories(req, res) {
  try {
    const categories = await complaintModel.getCategories();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function getRecent(req, res) {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    const complaints = await complaintModel.findRecent(limit);
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function getById(req, res) {
  try {
    const complaint = await complaintModel.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: "Complaint not found" });
    res.json(complaint);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

function statusActionLabel(status) {
  const value = String(status || "");
  if (/resolved/i.test(value)) return "Resolved";
  if (/scheduled/i.test(value)) return "Hearing Scheduled";
  if (/progress/i.test(value)) return "In Progress";
  if (/cancel|reject/i.test(value)) return "Cancelled";
  if (/unsettled/i.test(value)) return "Unsettled";
  if (/pending/i.test(value)) return "Reviewed by Admin";
  return "Complaint Updated";
}

async function updateStatus(req, res) {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: "Status is required" });
    const complaint = await complaintModel.updateStatus(req.params.id, status);
    if (!complaint) return res.status(404).json({ message: "Complaint not found" });

    const action = statusActionLabel(status);
    await logResidentComplaintActivity(req.params.id, action, { status });
    await notifyResident(
      req.params.id,
      action === "Resolved"
        ? `Your complaint ${complaint.complaintNo} has been successfully resolved.`
        : `Your complaint ${complaint.complaintNo} is now ${status}.`,
      action === "Resolved" ? "complaint_resolved" : "complaint_status_updated"
    );

    res.json(complaint);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function updateRespondent(req, res) {
  try {
    const complaint = await complaintModel.updateRespondent(req.params.id, req.body);
    if (!complaint) return res.status(404).json({ message: "Complaint not found" });
    res.json(complaint);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function getDashboard(req, res) {
  try {
    const counts = await complaintModel.getStatusCounts();
    const monthlyAnalytics = await complaintModel.getMonthlyAnalytics();

    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    const statusOverview = [
      { status: "Pending", count: counts.Pending },
      { status: "In Progress", count: counts["In Progress"] },
      { status: "Scheduled", count: counts.Scheduled },
      { status: "Resolved", count: counts.Resolved },
      { status: "Cancelled", count: counts.Cancelled },
      { status: "Unsettled", count: counts.Unsettled },
    ];

    res.json({
      stats: {
        pending: counts.Pending,
        inProgress: counts["In Progress"],
        scheduled: counts.Scheduled,
        resolved: counts.Resolved,
        cancelled: counts.Cancelled,
        unsettled: counts.Unsettled,
        total,
      },
      statusOverview,
      monthlyAnalytics,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function approve(req, res) {
  try {
    const complaint = await complaintModel.updateStatus(req.params.id, "In Progress");
    if (!complaint) return res.status(404).json({ message: "Complaint not found" });

    await logResidentComplaintActivity(req.params.id, "Complaint Approved", {
      status: "In Progress",
    });
    await notifyResident(
      req.params.id,
      `Your complaint ${complaint.complaintNo} was approved and is now In Progress.`,
      "complaint_approved"
    );

    res.json(complaint);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function reject(req, res) {
  try {
    const complaint = await complaintModel.updateStatus(req.params.id, "Cancelled");
    if (!complaint) return res.status(404).json({ message: "Complaint not found" });

    await logResidentComplaintActivity(req.params.id, "Cancelled", {
      status: "Cancelled",
    });
    await notifyResident(
      req.params.id,
      `Your complaint ${complaint.complaintNo} was cancelled.`,
      "complaint_cancelled"
    );

    res.json(complaint);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = {
  getAll,
  getCategories,
  getRecent,
  getById,
  updateStatus,
  updateRespondent,
  getDashboard,
  approve,
  reject,
};

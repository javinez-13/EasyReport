const complaintModel = require("../models/complaintModel");

async function getReports(req, res) {
  try {
    const {
      startDate,
      endDate,
      status,
      priority,
      category,
      search,
      year,
      month,
    } = req.query;

    const filters = {
      startDate,
      endDate,
      status,
      priority,
      category,
      search,
      year,
      month,
    };

    const [
      counts,
      monthlyAnalytics,
      categoryReports,
      priorityReports,
      avgResolutionTime,
      complaints,
      hearingAnalytics,
      categoryPerformance,
      slaCompliance,
    ] = await Promise.all([
      complaintModel.getStatusCounts(filters),
      complaintModel.getMonthlyAnalytics(filters),
      complaintModel.getCategoryCounts(filters),
      complaintModel.getPriorityCounts(filters),
      complaintModel.getAvgResolutionDays(filters),
      complaintModel.findAll(filters),
      complaintModel.getHearingAnalytics(filters),
      complaintModel.getCategoryPerformance(filters),
      complaintModel.getSlaCompliance(filters),
    ]);

    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    const resolved = counts.Resolved || 0;
    const pending = counts.Pending || 0;
    const inProgress = counts["In Progress"] || 0;
    const scheduled = counts.Scheduled || 0;
    const cancelled = counts.Cancelled || 0;
    const unsettled = counts.Unsettled || 0;
    const resolvedRate = total > 0 ? Math.round((resolved / total) * 1000) / 10 : 0;
    const activeCases = total - resolved - cancelled;

    res.json({
      stats: {
        totalComplaints: total,
        resolvedCases: resolved,
        pendingCases: pending,
        inProgressCases: inProgress,
        scheduledCases: scheduled,
        cancelledCases: cancelled,
        unsettledCases: unsettled,
        avgResolutionTime,
        resolvedRate,
        activeCases: Math.max(0, activeCases),
      },
      statusCounts: counts,
      monthlyAnalytics,
      categoryReports,
      priorityReports,
      hearingAnalytics,
      categoryPerformance,
      slaCompliance,
      complaints,
      filters,
    });
  } catch (err) {
    console.error("Error in getReports:", err);
    res.status(500).json({ message: err.message });
  }
}

module.exports = { getReports };

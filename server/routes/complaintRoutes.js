const express = require("express");
const complaintController = require("../controllers/complaintController");

const router = express.Router();

router.get("/dashboard", complaintController.getDashboard);
router.get("/recent", complaintController.getRecent);
router.get("/categories", complaintController.getCategories);
router.get("/", complaintController.getAll);
router.get("/:id", complaintController.getById);

router.put("/:id/approve", complaintController.approve);
router.put("/:id/reject", complaintController.reject);

router.patch("/:id/status", complaintController.updateStatus);
router.put("/:id/status", complaintController.updateStatus);

router.patch("/:id/respondent", complaintController.updateRespondent);
router.put("/:id/respondent", complaintController.updateRespondent);

module.exports = router;

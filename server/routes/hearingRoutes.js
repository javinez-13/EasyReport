const express = require("express");
const hearingController = require("../controllers/hearingController");

const router = express.Router();

router.get("/scheduled", hearingController.getScheduled);
router.get("/complaint/:complaintId", hearingController.getByComplaint);
router.post("/", hearingController.create);

module.exports = router;

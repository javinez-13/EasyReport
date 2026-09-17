const express = require("express");
const summonController = require("../controllers/summonController");

const router = express.Router();

router.post("/", summonController.create);
router.get("/complaint/:complaintId", summonController.getByComplaint);
router.post("/:complaintId/notify", summonController.notifyRespondent);

module.exports = router;

const express = require("express");
const { authMiddleware, requireRole } = require("../middleware/auth");
const { uploadProfile, uploadEvidence } = require("../middleware/upload");
const clientController = require("../controllers/clientController");

const router = express.Router();
const residentOnly = [authMiddleware, requireRole(["RESIDENT"])];

function runUpload(middleware) {
  return (req, res, next) => {
    middleware(req, res, (err) => {
      if (err) return res.status(400).json({ message: err.message || "Upload failed" });
      next();
    });
  };
}

router.get("/profile", residentOnly, clientController.getProfile);
router.put("/profile", residentOnly, clientController.updateProfile);
router.patch("/profile", residentOnly, clientController.updateProfile);
router.post(
  "/profile/picture",
  residentOnly,
  runUpload(uploadProfile),
  clientController.uploadProfilePicture
);
router.get("/complaints", residentOnly, clientController.getComplaints);
router.get("/complaints/:id", residentOnly, clientController.getComplaintById);
router.post(
  "/complaints",
  residentOnly,
  runUpload(uploadEvidence),
  clientController.createComplaint
);
router.get("/notifications", residentOnly, clientController.getNotifications);
router.get("/activity", residentOnly, clientController.getActivity);

module.exports = router;

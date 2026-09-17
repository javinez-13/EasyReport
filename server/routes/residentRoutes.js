const express = require("express");
const residentController = require("../controllers/residentController");
const { uploadResidentPhoto } = require("../middleware/upload");

const router = express.Router();

// Converts multer errors (wrong type, too large, ...) into JSON 400s
// instead of the default HTML 500 page. Same wrapper as clientRoutes.
function runUpload(middleware) {
  return (req, res, next) => {
    middleware(req, res, (err) => {
      if (err) return res.status(400).json({ message: err.message || "Upload failed" });
      next();
    });
  };
}

router.get("/", residentController.getAll);
router.post("/:id/photo", runUpload(uploadResidentPhoto), residentController.uploadPhoto);
router.get("/:id", residentController.getById);
router.post("/", residentController.create);
router.put("/:id", residentController.update);
router.delete("/:id", residentController.remove);

module.exports = router;

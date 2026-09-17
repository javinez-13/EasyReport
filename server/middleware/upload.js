const path = require("path");
const fs = require("fs");
const multer = require("multer");

const uploadsRoot = path.join(__dirname, "..", "uploads");
const profileDir = path.join(uploadsRoot, "profiles");
const evidenceDir = path.join(uploadsRoot, "evidence");
const residentsDir = path.join(uploadsRoot, "residents");

for (const dir of [uploadsRoot, profileDir, evidenceDir, residentsDir]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function makeStorage(folder) {
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, folder),
    filename: (_req, file, cb) => {
      const safe = String(file.originalname || "file")
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .slice(-80);
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safe}`);
    },
  });
}

function imageFilter(_req, file, cb) {
  if (!file.mimetype?.startsWith("image/")) {
    return cb(new Error("Only image uploads are allowed"));
  }
  cb(null, true);
}

const uploadProfile = multer({
  storage: makeStorage(profileDir),
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single("profilePicture");

const uploadEvidence = multer({
  storage: makeStorage(evidenceDir),
  fileFilter: imageFilter,
  limits: { fileSize: 8 * 1024 * 1024, files: 8 },
}).array("evidence", 8);

const uploadResidentPhoto = multer({
  storage: makeStorage(residentsDir),
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single("photo");

module.exports = {
  uploadsRoot,
  uploadProfile,
  uploadEvidence,
  uploadResidentPhoto,
};

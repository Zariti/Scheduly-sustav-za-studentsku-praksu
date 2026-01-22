import express from "express";
import Joi from "joi";
import multer from "multer";
import { query, params } from "../middleware/validate.js"; 
import { authorizeFaculty, authorizeMentor, authorizeStudent, jwtCheck } from "../middleware/authMiddleware.js"; // Middleware za provjeru JWT-a
import CertificatesController from "../controllers/certificatesController.js"

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB (adjust)
  },
  fileFilter: (req, file, cb) => {
    // Accept only PDFs (mimetype can be spoofed; we also verify header below)
    if (file.mimetype !== "application/pdf") return cb(new Error("Only PDF uploads allowed"));
    cb(null, true);
  },
});

/**
 * @route   GET /certificates
 * @desc    Dohvaća listu svih userovih certifikata
 * @access  Private (JWT)
 */

router.get(
    "/", 
    jwtCheck, // provjera jwt tokena
    CertificatesController.getCertificates
);

/**
 * @route   GET /certificates/:id
 * @desc    Dohvaća pdf content certifikata
 * @access  Private (JWT)
 */

router.get(
    "/:id",
    CertificatesController.getCertificateContent
);

/**
 * @route   POST /certificates
 * @desc    Inserta novi certifikat
 * @access  Private (JWT)
 */

router.post(
    "/",
    jwtCheck,
    authorizeStudent,
    upload.single("file"),
    CertificatesController.insertNewUserCertificate
);

/**
 * @route   DELETE /certificates/:id
 * @desc    Removea certifikat
 * @access  Private (JWT)
 */

router.delete(
    "/:id",
    jwtCheck,
    authorizeStudent,
    CertificatesController.removeUserCertificate
);


/**
 * @route   POST /certificates/update
 * @desc    Updatea certifikat {"id": "", "status": ""}
 * @access  Private (JWT)
 */

router.put(
    "/",
    jwtCheck,
    // authorizeMentor,
    CertificatesController.updateUserCertificateStatus
);


export default router;
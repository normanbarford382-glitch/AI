import { Router } from "express";
import { authMiddleware } from "../lib/auth";
import { v2 as cloudinary } from "cloudinary";

const router = Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

router.post("/upload", authMiddleware, async (req, res) => {
  try {
    const { base64, folder = "laptopstore" } = req.body;

    if (!base64) {
      res.status(400).json({ error: "base64 image data required" });
      return;
    }

    const result = await cloudinary.uploader.upload(base64, {
      folder,
      resource_type: "auto",
    });

    res.json({ success: true, url: result.secure_url });
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: err.message || "Upload failed" });
  }
});

export default router;

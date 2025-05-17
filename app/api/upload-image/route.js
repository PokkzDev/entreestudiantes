import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req) {
  const formData = await req.formData();
  const file = formData.get("image");
  if (!file) {
    return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 });
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    const uploadRes = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: "entreestudiantes" },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      ).end(buffer);
    });
    return NextResponse.json({ success: true, url: uploadRes.secure_url });
  } catch (err) {
    console.error("Upload handler error:", err);
    return NextResponse.json({ success: false, error: err.message || "Cloudinary upload failed" }, { status: 500 });
  }
}

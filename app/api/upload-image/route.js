import { randomBytes } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req) {
  const formData = await req.formData();
  const file = formData.get("image");
  if (!file) {
    return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 });
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split(".").pop() || "jpg";
  const filename = randomBytes(16).toString("hex") + "." + ext;
  const imagesDir = path.join(process.cwd(), "public", "images");
  await fs.mkdir(imagesDir, { recursive: true });
  const filePath = path.join(imagesDir, filename);
  await fs.writeFile(filePath, buffer);
  const url = `/images/${filename}`;
  return NextResponse.json({ success: true, url });
}

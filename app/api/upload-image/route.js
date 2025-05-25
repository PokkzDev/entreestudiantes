import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req) {
  const formData = await req.formData();
  const file = formData.get("image");
  const type = formData.get("type"); // 'profile' or 'product'
  if (!file) {
    return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 });
  }
  if (file.size && file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ success: false, error: "El archivo supera el tamaño máximo de 5MB." }, { status: 400 });
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    let session = null;
    if (type === "profile") {
      session = await getServerSession(authOptions);
      if (!session || !session.user) {
        return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
      }
    }
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
    // Only update user image if type is 'profile'
    if (type === "profile" && session?.user?.id) {
      // Get current user data to check for existing image
      const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { image: true }
      });

      // Delete old image from Cloudinary if it exists
      if (currentUser?.image) {
        try {
          // Extract public_id from Cloudinary URL
          const urlParts = currentUser.image.split('/');
          const fileWithExtension = urlParts[urlParts.length - 1];
          const publicId = fileWithExtension.split('.')[0];
          const folder = urlParts[urlParts.length - 2];
          const fullPublicId = folder ? `${folder}/${publicId}` : publicId;
          
          await cloudinary.uploader.destroy(fullPublicId);
          console.log("Old profile image deleted from Cloudinary:", fullPublicId);
        } catch (deleteError) {
          console.error("Error deleting old image from Cloudinary:", deleteError);
          // Continue with upload even if deletion fails
        }
      }

      // Update user with new image
      await prisma.user.update({
        where: { id: session.user.id },
        data: { image: uploadRes.secure_url }
      });
    }
    return NextResponse.json({ success: true, url: uploadRes.secure_url });
  } catch (err) {
    console.error("Upload handler error:", err);
    return NextResponse.json({ success: false, error: err.message || "Cloudinary upload failed" }, { status: 500 });
  }
}

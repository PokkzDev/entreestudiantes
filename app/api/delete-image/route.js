import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }

    const { imageUrl } = await request.json();
    
    if (!imageUrl) {
      return NextResponse.json({ success: false, error: "URL de imagen requerida" }, { status: 400 });
    }

    // Extract public_id from Cloudinary URL
    // Cloudinary URLs have format: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/public_id.extension
    const urlParts = imageUrl.split('/');
    const fileWithExtension = urlParts[urlParts.length - 1];
    const publicId = fileWithExtension.split('.')[0];
    const folder = urlParts[urlParts.length - 2];
    const fullPublicId = folder ? `${folder}/${publicId}` : publicId;

    // Delete image from Cloudinary
    try {
      const deleteResult = await cloudinary.uploader.destroy(fullPublicId);
      console.log("Cloudinary delete result:", deleteResult);
    } catch (cloudinaryError) {
      console.error("Error deleting from Cloudinary:", cloudinaryError);
      // Continue with database update even if Cloudinary deletion fails
    }

    // Update user in database to remove image
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { image: null },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        image: true,
        university: true,
        campus: true,
        nameChangeCount: true,
        usernameChangeCount: true,
        universityChangeCount: true,
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: "Imagen eliminada correctamente",
      user: updatedUser 
    });

  } catch (error) {
    console.error("Error deleting image:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Error al eliminar la imagen" 
    }, { status: 500 });
  }
}

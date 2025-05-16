import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function POST(req) {
  try {
    // Get the user session
    const session = await getServerSession(authOptions);
    
    // Make sure the user is authenticated
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: "No estás autenticado. Debes iniciar sesión para publicar." 
      }, { status: 401 });
    }
    
    const data = await req.json();
    let price = null;
    if (data.type === 'producto') {
      if (data.priceRange) {
        if (data.priceMin && data.priceMax) {
          price = parseFloat(data.priceMin);
        }
      } else if (data.priceMin) {
        price = parseFloat(data.priceMin);
      }
      // Si no hay precio válido, dejar como null
      if (isNaN(price)) price = null;
    } else {
      price = null; // Para servicios, siempre null
    }
    // Limitar a 4 imágenes para evitar exceder el límite del campo en la base de datos
    let imagesToStore = [];
    if (Array.isArray(data.images)) {
      if (data.images.length > 4) {
        return NextResponse.json({ 
          success: false, 
          error: "Solo se permiten un máximo de 4 imágenes por publicación." 
        }, { status: 400 });
      }
      imagesToStore = data.images.slice(0, 4);
    } else if (typeof data.images === 'string' && data.images) {
      const imageArray = data.images.split(',');
      if (imageArray.length > 4) {
        return NextResponse.json({ 
          success: false, 
          error: "Solo se permiten un máximo de 4 imágenes por publicación." 
        }, { status: 400 });
      }
      imagesToStore = imageArray.slice(0, 4);
    }
    
    const publicacion = await prisma.publicacion.create({
      data: {
        type: data.type,
        title: data.title,
        description: data.description,
        category: data.category,
        price: price, // Siempre null o número válido
        contactMethod: data.contactMethod,
        contactInfo: data.contactInfo,
        images: Array.isArray(imagesToStore) ? imagesToStore.join(",") : "",
        status: "activo",
        location: data.location || "",
        tags: data.tags || "",
        views: 0,
        featured: false,
        authorId: session.user.id, // Use the authenticated user's ID
      },
    });
    return NextResponse.json({ success: true, publicacion });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

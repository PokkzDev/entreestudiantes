import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

// POST /api/report - Create a new report
export async function POST(req) {
  try {
    const data = await req.json();
    const { publicacionId, reason, description } = data;

    // Validate required fields
    if (!publicacionId || !reason) {
      return NextResponse.json({
        success: false,
        error: "Publicación ID y razón son requeridos"
      }, { status: 400 });
    }

    // Check if the publication exists
    const publicacion = await prisma.publicacion.findUnique({
      where: { id: publicacionId }
    });

    if (!publicacion) {
      return NextResponse.json({
        success: false,
        error: "Publicación no encontrada"
      }, { status: 404 });
    }

    // Get user session (optional - reports can be anonymous)
    let reporterId = null;
    try {
      const session = await getServerSession(authOptions);
      if (session?.user?.id) {
        reporterId = session.user.id;
      }
    } catch (error) {
      // Continue without user ID if session fails
      console.log("Error getting session for report:", error);
    }

    // Get request info
    const headers = req.headers;
    const ipAddress = headers.get('x-forwarded-for') || headers.get('x-real-ip') || 'unknown';
    const userAgent = headers.get('user-agent') || 'unknown';

    // Check if user has already reported this publication (if logged in)
    if (reporterId) {
      const existingReport = await prisma.report.findFirst({
        where: {
          publicacionId,
          reporterId
        }
      });

      if (existingReport) {
        return NextResponse.json({
          success: false,
          error: "Ya has reportado esta publicación anteriormente"
        }, { status: 400 });
      }
    }

    // Create the report and update publication in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the report
      const report = await tx.report.create({
        data: {
          publicacionId,
          reporterId,
          reason,
          description: description || null,
          ipAddress,
          userAgent,
          status: "pending"
        }
      });

      // Get current report count for this publication
      const reportCount = await tx.report.count({
        where: {
          publicacionId,
          status: "pending" // Only count pending reports
        }
      });

      // Get current publication state
      const currentPublication = await tx.publicacion.findUnique({
        where: { id: publicacionId },
        select: { flagged: true, hiddenByReports: true }
      });

      // Update publication with new report count
      const updateData = {
        reportCount
      };

      let actionTaken = null;

      // Hide the publication if it has 10 or more reports and isn't already hidden
      if (reportCount >= 10 && !currentPublication.hiddenByReports) {
        updateData.hiddenByReports = true;
        updateData.hiddenAt = new Date();
        actionTaken = "hidden";
      }
      // Flag the publication if it has 5 or more reports and isn't already flagged
      else if (reportCount >= 5 && !currentPublication.flagged) {
        updateData.flagged = true;
        updateData.flaggedAt = new Date();
        actionTaken = "flagged";
      }

      // Update the publication
      await tx.publicacion.update({
        where: { id: publicacionId },
        data: updateData
      });

      return { 
        report, 
        reportCount, 
        flagged: reportCount >= 5,
        hidden: reportCount >= 10,
        actionTaken
      };
    });

    let message = "Reporte enviado correctamente. Será revisado por nuestro equipo.";
    
    if (result.actionTaken === "hidden") {
      message = "Reporte enviado correctamente. Esta publicación ha sido ocultada automáticamente debido al alto número de reportes y será revisada por nuestro equipo.";
    } else if (result.actionTaken === "flagged") {
      message = "Reporte enviado correctamente. Esta publicación ha sido marcada para revisión prioritaria debido al número de reportes.";
    }

    return NextResponse.json({
      success: true,
      message,
      report: {
        id: result.report.id,
        reason: result.report.reason,
        createdAt: result.report.createdAt
      }
    });

  } catch (error) {
    console.error("Error creating report:", error);
    return NextResponse.json({
      success: false,
      error: "Error interno del servidor"
    }, { status: 500 });
  }
} 
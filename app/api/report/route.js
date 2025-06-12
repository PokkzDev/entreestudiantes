import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

// POST /api/report - Create a new report
export async function POST(req) {
  try {
    const data = await req.json();
    const { publicacionId, ratingId, reportedUserId, reason, description } = data;
    
    // Debug logging
    console.log('Report API received data:', { publicacionId, ratingId, reportedUserId, reason, description });

    // Validate required fields - must have either publicacionId, ratingId, or reportedUserId
    if (!publicacionId && !ratingId && !reportedUserId) {
      return NextResponse.json({
        success: false,
        error: "Debe proporcionar ID de publicación, calificación o usuario para el reporte"
      }, { status: 400 });
    }

    if (!reason) {
      return NextResponse.json({
        success: false,
        error: "Debe proporcionar la razón del reporte"
      }, { status: 400 });
    }

    // Validate that only one type is provided
    const reportTypes = [publicacionId, ratingId, reportedUserId].filter(Boolean);
    if (reportTypes.length > 1) {
      return NextResponse.json({
        success: false,
        error: "Solo puede reportar una publicación, calificación o usuario a la vez"
      }, { status: 400 });
    }

    let targetItem = null;
    let targetType = null;

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

    // Check if user has already reported this item (if logged in)
    if (reporterId) {
      const whereClause = { reporterId };
      if (publicacionId) whereClause.publicacionId = publicacionId;
      if (ratingId) whereClause.ratingId = ratingId;
      if (reportedUserId) whereClause.reportedUserId = reportedUserId;

      const existingReport = await prisma.report.findFirst({
        where: whereClause
      });

      if (existingReport) {
        const itemType = publicacionId ? "publicación" : ratingId ? "calificación" : "usuario";
        return NextResponse.json({
          success: false,
          error: `Ya has reportado este/a ${itemType} anteriormente`
        }, { status: 400 });
      }
    }

    // Check if the publication exists (if reporting a publication)
    if (publicacionId) {
      const publicacion = await prisma.publicacion.findUnique({
        where: { id: publicacionId },
        include: {
          author: {
            select: { id: true }
          }
        }
      });

      if (!publicacion) {
        return NextResponse.json({
          success: false,
          error: "Publicación no encontrada"
        }, { status: 404 });
      }
      
      // Check if user is trying to report their own publication
      if (reporterId && publicacion.author.id === reporterId) {
        return NextResponse.json({
          success: false,
          error: "No puedes reportar tu propia publicación"
        }, { status: 400 });
      }
      
      targetItem = publicacion;
      targetType = "publicacion";
    }

    // Check if the rating exists (if reporting a rating)
    if (ratingId) {
      const rating = await prisma.userRating.findUnique({
        where: { id: ratingId },
        include: {
          rater: { select: { username: true, name: true } },
          rated: { select: { username: true, name: true } }
        }
      });

      if (!rating) {
        return NextResponse.json({
          success: false,
          error: "Calificación no encontrada"
        }, { status: 404 });
      }
      targetItem = rating;
      targetType = "rating";
    }

    // Check if the user exists (if reporting a user)
    if (reportedUserId) {
      const user = await prisma.user.findUnique({
        where: { id: reportedUserId },
        select: { id: true, username: true, name: true, isActive: true }
      });

      if (!user) {
        return NextResponse.json({
          success: false,
          error: "Usuario no encontrado"
        }, { status: 404 });
      }
      
      if (!user.isActive) {
        return NextResponse.json({
          success: false,
          error: "No se puede reportar un usuario inactivo"
        }, { status: 400 });
      }
      
      targetItem = user;
      targetType = "user";
    }

    // Create the report and update target item in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the report
      const reportData = {
        reporterId,
        reason,
        description: description || null,
        ipAddress,
        userAgent,
        status: "pending"
      };

      if (publicacionId) reportData.publicacionId = publicacionId;
      if (ratingId) reportData.ratingId = ratingId;
      if (reportedUserId) reportData.reportedUserId = reportedUserId;

      const report = await tx.report.create({
        data: reportData
      });

      let actionTaken = null;
      let reportCount = 0;

      if (publicacionId) {
        // Handle publication reports (existing logic)
        reportCount = await tx.report.count({
          where: {
            publicacionId,
            status: "pending"
          }
        });

        const currentPublication = await tx.publicacion.findUnique({
          where: { id: publicacionId },
          select: { flagged: true, hiddenByReports: true }
        });

        const updateData = { reportCount };

        if (reportCount >= 10 && !currentPublication.hiddenByReports) {
          updateData.hiddenByReports = true;
          updateData.hiddenAt = new Date();
          actionTaken = "hidden";
        } else if (reportCount >= 5 && !currentPublication.flagged) {
          updateData.flagged = true;
          updateData.flaggedAt = new Date();
          actionTaken = "flagged";
        }

        await tx.publicacion.update({
          where: { id: publicacionId },
          data: updateData
        });
      }

      if (ratingId) {
        // Handle rating reports (simpler - just count for now)
        reportCount = await tx.report.count({
          where: {
            ratingId,
            status: "pending"
          }
        });

        // For ratings, we might just flag for review after fewer reports
        if (reportCount >= 3) {
          actionTaken = "flagged_for_review";
          // Note: We don't automatically hide ratings, just flag them for admin review
        }
      }

      if (reportedUserId) {
        // Handle user reports
        reportCount = await tx.report.count({
          where: {
            reportedUserId,
            status: "pending"
          }
        });

        // For users, we flag for review after fewer reports and take action at higher thresholds
        if (reportCount >= 10) {
          // Suspend user temporarily after many reports
          await tx.user.update({
            where: { id: reportedUserId },
            data: {
              isSuspended: true,
              suspendedAt: new Date(),
              suspensionEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
              suspensionReason: "Reportes múltiples de usuarios - suspensión automática",
              suspensionCount: { increment: 1 }
            }
          });
          actionTaken = "suspended";
        } else if (reportCount >= 5) {
          // Flag user for admin review
          await tx.user.update({
            where: { id: reportedUserId },
            data: {
              isFlagged: true
            }
          });
          actionTaken = "flagged_for_review";
        }
      }

      return { 
        report, 
        reportCount, 
        actionTaken,
        targetType
      };
    });

    let message = "Reporte enviado correctamente. Será revisado por nuestro equipo.";
    
    if (result.targetType === "publicacion") {
      if (result.actionTaken === "hidden") {
        message = "Reporte enviado correctamente. Esta publicación ha sido ocultada automáticamente debido al alto número de reportes y será revisada por nuestro equipo.";
      } else if (result.actionTaken === "flagged") {
        message = "Reporte enviado correctamente. Esta publicación ha sido marcada para revisión prioritaria debido al número de reportes.";
      }
    } else if (result.targetType === "rating") {
      if (result.actionTaken === "flagged_for_review") {
        message = "Reporte enviado correctamente. Esta calificación ha sido marcada para revisión prioritaria debido al número de reportes.";
      } else {
        message = "Reporte enviado correctamente. Esta calificación será revisada por nuestro equipo.";
      }
    } else if (result.targetType === "user") {
      if (result.actionTaken === "suspended") {
        message = "Reporte enviado correctamente. Este usuario ha sido suspendido temporalmente debido al alto número de reportes y será revisado por nuestro equipo.";
      } else if (result.actionTaken === "flagged_for_review") {
        message = "Reporte enviado correctamente. Este usuario ha sido marcado para revisión prioritaria debido al número de reportes.";
      } else {
        message = "Reporte enviado correctamente. Este usuario será revisado por nuestro equipo.";
      }
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
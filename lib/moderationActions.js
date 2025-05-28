import prisma from "@/lib/prisma";

/**
 * Suspend all active publications from a user
 * @param {string} userId - The user ID whose publications should be suspended
 * @param {string} reason - Reason for suspending publications
 * @returns {Promise<number>} - Number of publications suspended
 */
export async function suspendUserPublications(userId, reason = "Usuario suspendido o baneado") {
  try {
    const result = await prisma.publicacion.updateMany({
      where: {
        authorId: userId,
        status: "activo"
      },
      data: {
        status: "suspendido_por_moderacion"
      }
    });

    console.log(`Suspended ${result.count} publications for user ${userId}. Reason: ${reason}`);
    return result.count;
  } catch (error) {
    console.error("Error suspending user publications:", error);
    throw error;
  }
}

/**
 * Reactivate all suspended publications from a user (when suspension is lifted)
 * @param {string} userId - The user ID whose publications should be reactivated
 * @returns {Promise<number>} - Number of publications reactivated
 */
export async function reactivateUserPublications(userId) {
  try {
    const result = await prisma.publicacion.updateMany({
      where: {
        authorId: userId,
        status: "suspendido_por_moderacion"
      },
      data: {
        status: "activo"
      }
    });

    console.log(`Reactivated ${result.count} publications for user ${userId}`);
    return result.count;
  } catch (error) {
    console.error("Error reactivating user publications:", error);
    throw error;
  }
}

/**
 * Handle user ban - suspend all publications and log the action
 * @param {string} userId - The user ID to ban
 * @param {string} reason - Reason for the ban
 * @param {string} moderatorId - ID of the admin who performed the action
 * @returns {Promise<Object>} - Result object with user and publications count
 */
export async function handleUserBan(userId, reason, moderatorId) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Update user status
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          isBanned: true,
          banReason: reason,
          bannedAt: new Date(),
          moderatedBy: moderatorId,
          isActive: false
        }
      });

      // Suspend all active publications
      const publicationsResult = await tx.publicacion.updateMany({
        where: {
          authorId: userId,
          status: "activo"
        },
        data: {
          status: "suspendido_por_moderacion"
        }
      });

      return {
        user,
        publicationsSuspended: publicationsResult.count
      };
    });

    console.log(`Banned user ${userId} and suspended ${result.publicationsSuspended} publications`);
    return result;
  } catch (error) {
    console.error("Error handling user ban:", error);
    throw error;
  }
}

/**
 * Handle user suspension - suspend all publications and log the action
 * @param {string} userId - The user ID to suspend
 * @param {string} reason - Reason for the suspension
 * @param {Date|null} suspensionEndsAt - When the suspension ends (null for indefinite)
 * @param {string} moderatorId - ID of the admin who performed the action
 * @returns {Promise<Object>} - Result object with user and publications count
 */
export async function handleUserSuspension(userId, reason, suspensionEndsAt, moderatorId) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Update user status
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          isSuspended: true,
          suspensionReason: reason,
          suspensionEndsAt: suspensionEndsAt,
          suspendedAt: new Date(),
          moderatedBy: moderatorId,
          suspensionCount: {
            increment: 1
          }
        }
      });

      // Suspend all active publications
      const publicationsResult = await tx.publicacion.updateMany({
        where: {
          authorId: userId,
          status: "activo"
        },
        data: {
          status: "suspendido_por_moderacion"
        }
      });

      return {
        user,
        publicationsSuspended: publicationsResult.count
      };
    });

    console.log(`Suspended user ${userId} and suspended ${result.publicationsSuspended} publications`);
    return result;
  } catch (error) {
    console.error("Error handling user suspension:", error);
    throw error;
  }
}

/**
 * Handle lifting user suspension - reactivate publications if appropriate
 * @param {string} userId - The user ID to unsuspend
 * @param {string} moderatorId - ID of the admin who performed the action
 * @returns {Promise<Object>} - Result object with user and publications count
 */
export async function handleLiftSuspension(userId, moderatorId) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Update user status
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          isSuspended: false,
          suspensionReason: null,
          suspensionEndsAt: null,
          moderatedBy: moderatorId
        }
      });

      // Reactivate suspended publications (only those suspended due to moderation)
      const publicationsResult = await tx.publicacion.updateMany({
        where: {
          authorId: userId,
          status: "suspendido_por_moderacion"
        },
        data: {
          status: "activo"
        }
      });

      return {
        user,
        publicationsReactivated: publicationsResult.count
      };
    });

    console.log(`Lifted suspension for user ${userId} and reactivated ${result.publicationsReactivated} publications`);
    return result;
  } catch (error) {
    console.error("Error lifting user suspension:", error);
    throw error;
  }
} 
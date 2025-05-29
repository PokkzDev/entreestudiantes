import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Safely creates a subscription with race condition handling
 * @param {Object} params - Subscription parameters
 * @param {string} params.userId - User ID
 * @param {string} params.planId - Plan ID
 * @param {string} params.paymentId - Payment ID
 * @param {number} params.amount - Payment amount
 * @param {string} params.currency - Payment currency
 * @param {string} params.context - Context for logging ('webhook' or 'api')
 * @returns {Promise<Object>} Result object with success status and subscription data
 */
export async function createSubscriptionSafely({ userId, planId, paymentId, amount, currency, context = 'api' }) {
  try {
    // Use a transaction to handle race conditions and ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // First, check if subscription already exists for this payment
      const existingSubscription = await tx.subscription.findUnique({
        where: {
          userId_paymentId: {
            userId,
            paymentId: paymentId.toString()
          }
        }
      });

      if (existingSubscription) {
        console.log(`⚠️  Subscription already exists for payment ${paymentId}, skipping creation (${context})`);
        return { alreadyExists: true, subscription: existingSubscription };
      }

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + 30); // Add exactly 30 days
      
      // Update user's subscription status
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          accountTier: planId,
          subscriptionStatus: 'active',
          tierStartDate: startDate,
          tierEndDate: endDate,
          updatedAt: new Date()
        }
      });
      
      // Create subscription record
      const newSubscription = await tx.subscription.create({
        data: {
          userId,
          planId,
          status: 'active',
          startDate: startDate,
          endDate: endDate,
          amount,
          currency,
          paymentId: paymentId.toString(),
          createdAt: new Date()
        }
      });
      
      return { alreadyExists: false, subscription: newSubscription, user: updatedUser };
    });

    if (result.alreadyExists) {
      console.log(`✅ Payment ${paymentId} already processed by another request (${context})`);
      return {
        success: true,
        alreadyExists: true,
        subscription: result.subscription,
        message: 'Payment already processed'
      };
    } else {
      console.log(`✅ Subscription activated for user ${userId} to plan ${planId} (30 days: ${result.subscription.startDate.toISOString()} - ${result.subscription.endDate.toISOString()}) via ${context}`);
      return {
        success: true,
        alreadyExists: false,
        subscription: result.subscription,
        user: result.user,
        message: 'Subscription created successfully'
      };
    }

  } catch (error) {
    // Handle specific database errors
    if (error.code === 'P2002') {
      // Unique constraint violation - another request created the subscription
      console.log(`⚠️  Subscription creation race condition detected for payment ${paymentId} in ${context}, checking existing subscription`);
      
      try {
        // Try to get the existing subscription
        const existingSubscription = await prisma.subscription.findUnique({
          where: {
            userId_paymentId: {
              userId,
              paymentId: paymentId.toString()
            }
          }
        });

        if (existingSubscription) {
          console.log(`Found existing subscription for payment ${paymentId} in ${context}, payment was processed successfully`);
          return {
            success: true,
            alreadyExists: true,
            subscription: existingSubscription,
            message: 'Payment processed by concurrent request'
          };
        } else {
          console.error(`❌ Unexpected error: subscription constraint failed but no existing subscription found for payment ${paymentId}`);
          return {
            success: false,
            error: 'Database constraint error',
            message: 'Subscription constraint failed but no existing subscription found'
          };
        }
      } catch (findError) {
        console.error(`❌ Error finding existing subscription for payment ${paymentId}:`, findError);
        return {
          success: false,
          error: 'Database query error',
          message: 'Failed to verify existing subscription'
        };
      }
    } else {
      // Log other types of errors for investigation
      console.error(`❌ Unexpected error creating subscription for payment ${paymentId} in ${context}:`, error);
      return {
        success: false,
        error: error.message || 'Database operation failed',
        message: 'Failed to create subscription'
      };
    }
  }
}

/**
 * Checks if a subscription already exists for a payment
 * @param {string} userId - User ID
 * @param {string} paymentId - Payment ID
 * @returns {Promise<Object|null>} Existing subscription or null
 */
export async function findExistingSubscription(userId, paymentId) {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: {
        userId_paymentId: {
          userId,
          paymentId: paymentId.toString()
        }
      }
    });
    return subscription;
  } catch (error) {
    console.error(`Error finding existing subscription for user ${userId}, payment ${paymentId}:`, error);
    return null;
  }
}

export { prisma }; 
# Flow.cl Payment Integration Setup

This document explains how to set up and configure the Flow.cl payment integration for the EntreEstudiantes platform.

## Overview

Flow.cl is a Chilean payment gateway that allows businesses to accept online payments through various methods including credit cards, debit cards, bank transfers, and digital wallets.

## Prerequisites

1. A Flow.cl merchant account
2. API credentials from Flow.cl
3. Access to your application's environment variables
4. Database migration capabilities

## Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
# Flow.cl Configuration
FLOW_API_KEY=your_flow_api_key_here
FLOW_API_SECRET=your_flow_api_secret_here
FLOW_API_URL=https://sandbox.flow.cl/api  # Use https://www.flow.cl/api for production
FLOW_WEBHOOK_SECRET=your_webhook_secret
FLOW_WEBHOOK_URL=https://yourdomain.com/api/flow/webhook
FLOW_ENVIRONMENT=sandbox

# Plan pricing (CLP)
FLOW_BASIC_PLAN_AMOUNT=2990
```

### Getting Flow.cl Credentials

1. Log in to your Flow.cl merchant account
2. Navigate to "Mis datos" (My Data)
3. Go to the "Seguridad" (Security) section
4. Copy your `apiKey` and `secretKey`

## Database Migration

The integration requires new database fields. Run the following migration:

```bash
npx prisma db push
```

This will add the following fields to your User model:
- `subscriptionTier`: Current subscription tier from Flow.cl
- `subscriptionActive`: Boolean indicating if subscription is active
- `subscriptionEndDate`: When the current subscription expires

And create a new `PaymentLog` model to track all payments.

## API Endpoints

The integration creates three new API endpoints:

### 1. Create Payment (`/api/flow/create-payment`)
- **Method**: POST
- **Purpose**: Creates a payment order with Flow.cl
- **Body**: `{ planId: string }`
- **Returns**: Payment URL and token for redirection

### 2. Verify Payment (`/api/flow/verify`)
- **Method**: POST
- **Purpose**: Verifies payment status and updates user subscription
- **Body**: `{ token: string }`
- **Returns**: Payment verification result

### 3. Webhook (`/api/flow/webhook`)
- **Method**: POST
- **Purpose**: Handles payment confirmations from Flow.cl
- **Security**: Validates webhook signature
- **Action**: Updates user subscription automatically

## Payment Flow

1. User selects a plan on `/planes` page
2. Frontend calls `/api/flow/create-payment` with plan ID
3. User is redirected to Flow.cl payment page
4. After payment, user returns to `/planes?status=success&token=xxx`
5. Frontend calls `/api/flow/verify` to confirm payment
6. Flow.cl also sends webhook to `/api/flow/webhook` for server-side confirmation

## URL Configuration

Make sure your Flow.cl account has the correct URLs configured:

- **Confirmation URL**: `https://yourdomain.com/api/flow/webhook`
- **Return URL**: `https://yourdomain.com/planes?status=success`

## Testing

### Sandbox Mode
- Use `https://sandbox.flow.cl/api` as the API URL
- Use sandbox credentials from Flow.cl
- Test with Flow.cl's test payment methods

### Production Mode
- Use `https://www.flow.cl/api` as the API URL
- Use production credentials from Flow.cl
- Ensure SSL certificate is valid

## Security Considerations

1. **Environment Variables**: Never commit API keys to version control
2. **Webhook Validation**: All webhooks are signature-validated
3. **User Verification**: Payment verification checks user ownership
4. **HTTPS Required**: Flow.cl requires HTTPS for webhooks in production

## Troubleshooting

### Common Issues

1. **Invalid Signature Error**
   - Check that `FLOW_API_SECRET` is correct
   - Ensure webhook URL is accessible from Flow.cl servers

2. **Payment Not Updating Subscription**
   - Check webhook logs in server console
   - Verify database connection
   - Ensure user ID matches in payment data

3. **Redirect Issues**
   - Verify `NEXTAUTH_URL` is set correctly
   - Check Flow.cl return URL configuration

### Debugging

Enable debug logging by checking server console for:
- Flow.cl API responses
- Webhook payloads
- Database update results

## Plan Configuration

Plans are defined in `/lib/accountTiers.js`:

```javascript
export const ACCOUNT_TIERS = {
  free: {
    name: "Gratuito",
    publicationLimit: 3,
    price: 0, // Free plan
    // ...
  },
  basic: {
    name: "Básico", 
    publicationLimit: 10,
    price: 100, // CLP per month
    // ...
  }
  // ... more plans
};
```

## Support

For Flow.cl specific issues:
- Email: soporte@flow.cl
- Phone: +56 2 2583 0102
- Documentation: https://www.flow.cl/docs/api.html

For integration issues, check the server logs and ensure all environment variables are properly configured. 
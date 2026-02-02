import { prisma } from '@/infra/prisma/prisma';
import { successResponse } from '@/lib/utils/api-response';
import type { HubSpotWebhookEvent } from '@/server/integrations/hubspot';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Verify HubSpot webhook signature
 *
 * HubSpot signs webhook requests using the client secret.
 * @see https://developers.hubspot.com/docs/api/webhooks/validating-requests
 */
function verifyHubSpotSignature(
  requestBody: string,
  signature: string | null,
  signatureVersion: string | null
): boolean {
  const clientSecret = process.env.HUBSPOT_CLIENT_SECRET;

  if (!clientSecret || !signature) {
    console.warn('[HubSpot Webhook] Missing client secret or signature');
    return false;
  }

  if (signatureVersion === 'v3') {
    // v3 signature includes timestamp
    const timestamp = signature.split(':')[0];
    const providedHash = signature.split(':')[1];

    if (!timestamp || !providedHash) {
      return false;
    }

    // Check timestamp is within 5 minutes
    const timestampMs = parseInt(timestamp, 10);
    const now = Date.now();
    if (Math.abs(now - timestampMs) > 5 * 60 * 1000) {
      console.warn('[HubSpot Webhook] Signature timestamp expired');
      return false;
    }

    const dataToSign = `${clientSecret}${timestamp}${requestBody}`;
    const expectedHash = crypto
      .createHash('sha256')
      .update(dataToSign)
      .digest('base64');

    return crypto.timingSafeEqual(
      new Uint8Array(Buffer.from(providedHash)),
      new Uint8Array(Buffer.from(expectedHash))
    );
  } else if (signatureVersion === 'v2') {
    // v2 signature (legacy)
    const sourceString = clientSecret + requestBody;
    const expectedHash = crypto
      .createHash('sha256')
      .update(sourceString)
      .digest('hex');

    return crypto.timingSafeEqual(
      new Uint8Array(Buffer.from(signature)),
      new Uint8Array(Buffer.from(expectedHash))
    );
  }

  // v1 signature (oldest)
  const expectedHash = crypto
    .createHmac('sha256', clientSecret)
    .update(requestBody)
    .digest('hex');

  return crypto.timingSafeEqual(
    new Uint8Array(Buffer.from(signature)),
    new Uint8Array(Buffer.from(expectedHash))
  );
}

/**
 * POST /api/v1/integrations/hubspot/webhooks
 * Handle incoming HubSpot webhooks
 *
 * Processes CRM events like contact updates, deletions, etc.
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-hubspot-signature');
    const signatureVersion = request.headers.get('x-hubspot-signature-version');

    // Verify signature in production
    if (process.env.NODE_ENV === 'production') {
      if (!verifyHubSpotSignature(rawBody, signature, signatureVersion)) {
        console.error('[HubSpot Webhook] Invalid signature');
        return new NextResponse('Invalid signature', { status: 401 });
      }
    }

    const events: HubSpotWebhookEvent[] = JSON.parse(rawBody);

    console.log(
      `[HubSpot Webhook] Received ${events.length} event(s)`,
      events.map((e) => e.subscriptionType)
    );

    // Process events
    for (const event of events) {
      await processWebhookEvent(event);
    }

    // HubSpot expects a 200 response to acknowledge receipt
    return successResponse({ received: true, processed: events.length });
  } catch (error) {
    console.error('[HubSpot Webhook] Error processing webhook:', error);
    // Still return 200 to prevent HubSpot from retrying
    // Log the error for debugging
    return successResponse({ received: true, error: 'Processing failed' });
  }
}

/**
 * Process a single webhook event
 */
async function processWebhookEvent(event: HubSpotWebhookEvent): Promise<void> {
  const { subscriptionType, objectId, propertyName, propertyValue } = event;

  console.log(`[HubSpot Webhook] Processing ${subscriptionType} for object ${objectId}`);

  switch (subscriptionType) {
    case 'contact.creation':
      // A new contact was created in HubSpot
      // We might want to check if it should be synced to our system
      console.log(`[HubSpot Webhook] New contact created: ${objectId}`);
      break;

    case 'contact.deletion':
      // A contact was deleted in HubSpot
      // Clear the hubspotContactId from our user if it exists
      await prisma.user.updateMany({
        where: { hubspotContactId: String(objectId) },
        data: { hubspotContactId: null },
      });
      console.log(`[HubSpot Webhook] Contact deleted, cleared local reference: ${objectId}`);
      break;

    case 'contact.propertyChange':
      // A contact property was changed in HubSpot
      // We could sync certain properties back to our system
      console.log(
        `[HubSpot Webhook] Contact ${objectId} property changed: ${propertyName} = ${propertyValue}`
      );

      // Example: Sync email changes back to our system
      if (propertyName === 'email' && propertyValue) {
        const user = await prisma.user.findFirst({
          where: { hubspotContactId: String(objectId) },
        });

        if (user) {
          // Note: Be careful with email changes - might need verification
          console.log(
            `[HubSpot Webhook] Email change detected for user ${user.id}: ${propertyValue}`
          );
          // Uncomment to sync email changes:
          // await prisma.user.update({
          //   where: { id: user.id },
          //   data: { email: propertyValue },
          // });
        }
      }
      break;

    case 'company.creation':
    case 'company.deletion':
    case 'company.propertyChange':
      // Handle company events if needed
      console.log(`[HubSpot Webhook] Company event: ${subscriptionType} for ${objectId}`);
      break;

    case 'deal.creation':
    case 'deal.deletion':
    case 'deal.propertyChange':
      // Handle deal events if needed
      console.log(`[HubSpot Webhook] Deal event: ${subscriptionType} for ${objectId}`);
      break;

    default:
      console.log(`[HubSpot Webhook] Unhandled event type: ${subscriptionType}`);
  }
}

/**
 * GET /api/v1/integrations/hubspot/webhooks
 * Health check for webhook endpoint
 *
 * HubSpot might ping this to verify the endpoint is valid.
 */
export async function GET() {
  return successResponse({
    status: 'ready',
    message: 'HubSpot webhook endpoint is ready to receive events',
  });
}

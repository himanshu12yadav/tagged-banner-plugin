/**
 * @author Sprinix Team
 * @copyright Copyright (c) 2023 Sprinix Technolabs (https://www.sprinix.com).
 */

import crypto from 'crypto';
import db from '../db.server';
import { authenticate } from '../shopify.server';
import {
  deleteMetaobjectDefinition,
  metaobjectByDefinitionType,
} from './graphql/query.jsx';

export async function handleAppUninstall(shop, admin) {
  const metaobjectTypes = ['sliders', 'tag_collection', 'pointers'];

  for (const type of metaobjectTypes) {
    try {
      const metaobjectDefinition = await metaobjectByDefinitionType(
        admin,
        type
      );

      const definitionId = metaobjectDefinition?.metaobjectDefinitionByType?.id;

      if (definitionId) {
        await deleteMetaobjectDefinition(admin, definitionId);
      }
    } catch (error) {
      console.log(error);
    }
  }
}

export const action = async ({ request }) => {
  const requestClone = request.clone();
  const rawPayload = await requestClone.text();

  const signature = request.headers.get('x-shopify-hmac-sha256');
  const generateSignature = crypto
    .createHmac('sha256', process.env.SHOPIFY_API_SECRET)
    .update(rawPayload)
    .digest('base64');
  if (signature !== generateSignature) {
    throw new Response(null, { status: 401 });
  }

  const { topic, shop, session, payload, admin } =
    await authenticate.webhook(request);

  if (!admin && topic !== 'SHOP_REDACT') {
    // The admin context isn't returned if the webhook fired after a shop was uninstalled.
    // The SHOP_REDACT webhook will be fired up to 48 hours after a shop uninstalls the app.
    // Because of this, no admin context is available.
    throw new Response();
  }

  // The topics handled here should be declared in the shopify.app.toml.
  // More info: https://shopify.dev/docs/apps/build/cli-for-apps/app-configuration
  switch (topic) {
    case 'APP_UNINSTALLED':
      console.log('entered in app uninstalled');
      if (session) {
        try {
          await db.session.deleteMany({ where: { shop } });
        } catch (err) {
          throw new Error(err.target);
        }
      }
      break;
    case 'CUSTOMERS_DATA_REQUEST':
    case 'CUSTOMERS_REDACT':
    case 'SHOP_REDACT':
    default:
      throw new Response('Unhandled webhook topic', { status: 200 });
  }

  throw new Response();
};

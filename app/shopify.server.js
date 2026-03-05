/**
 * @author Sprinix Team
 * @copyright Copyright (c) 2023 Sprinix Technolabs (https://www.sprinix.com).
 */

import { restResources } from "@shopify/shopify-api/rest/admin/2025-01";
import "@shopify/shopify-app-remix/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  DeliveryMethod,
  shopifyApp,
} from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";
import {
  createMetaobjectDefinition,
  metaobjectByDefinitionType,
} from "./routes/graphql/query";

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.January25,
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  restResources,
  webhooks: {
    APP_UNINSTALLED: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks",
    },
  },
  hooks: {
    afterAuth: async ({ admin, session }) => {
      await shopify.registerWebhooks({ session });

      const metaobjectTypes = [
        {
          type: "sliders",
          displayNameKey: "title",
          fields: [
            {
              name: "Title",
              key: "title",
              type: "single_line_text_field",
            },
          ],
        },
        {
          type: "pointers",

          fields: [
            {
              name: "sku",
              key: "sku",
              type: "single_line_text_field",
            },
            {
              name: "Pointer_id",
              key: "pointer_id",
              type: "single_line_text_field",
            },
            {
              name: "slider id",
              key: "slider_id",
              type: "single_line_text_field",
            },
            { name: "tag_id", key: "tag_id", type: "single_line_text_field" },
            { name: "data", key: "data", type: "single_line_text_field" },
            { name: "pos_x", key: "pos_x", type: "single_line_text_field" },
            { name: "pos_y", key: "pos_y", type: "single_line_text_field" },
          ],
        },
        {
          type: "tag_collection",
          displayNameKey: "pointer_name",
          fields: [
            {
              name: "pointer name",
              key: "pointer_name",
              type: "single_line_text_field",
            },
            {
              name: "Slider id",
              key: "slider_id",
              type: "single_line_text_field",
            },
            { name: "image_id", key: "image_id", type: "file_reference" },
          ],
        },
      ];

      for (const { type, fields, displayNameKey } of metaobjectTypes) {
        try {
          const existingDefinition = await metaobjectByDefinitionType(
            admin,
            type,
          );

          const { metaobjectDefinitionByType } = existingDefinition;

          if (!metaobjectDefinitionByType) {
            await createMetaobjectDefinition(
              admin,
              type,
              fields,
              displayNameKey,
            );
          }
        } catch (error) {
          console.error(`Failed to process metaobject type ${type}:`, error);
          // Continue with other metaobject types even if one fails
        }
      }
    },
  },
  future: {
    unstable_newEmbeddedAuthStrategy: false,
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

export default shopify;
export const apiVersion = ApiVersion.January25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const login = shopify.login;

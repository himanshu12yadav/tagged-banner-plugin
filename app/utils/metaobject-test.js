/**
 * @author Sprinix Team
 * @copyright Copyright (c) 2023 Sprinix Technolabs (https://www.sprinix.com).
 */

/**
 * Test utilities for metaobject operations
 */

// Mock data for testing
export const mockSliderData = {
  id: "gid://shopify/Metaobject/1234567890",
  handle: "test-slider",
  displayName: "Test Slider",
  fields: [
    {
      key: "title",
      value: "Test Slider"
    }
  ]
};

export const mockTagCollectionData = {
  id: "gid://shopify/Metaobject/1234567891",
  handle: "test-tag-collection",
  displayName: "Test Tag Collection",
  fields: [
    {
      key: "title",
      value: "Test Tag Collection"
    },
    {
      key: "description",
      value: "A test tag collection"
    },
    {
      key: "image",
      reference: {
        image: {
          url: "https://example.com/test-image.jpg"
        }
      }
    }
  ]
};

export const mockPointerData = {
  id: "gid://shopify/Metaobject/1234567892",
  handle: "test-pointer",
  fields: [
    {
      key: "sku",
      value: "TEST-SKU-001"
    },
    {
      key: "pointerId",
      value: "pointer-123"
    },
    {
      key: "sliderId",
      value: "gid://shopify/Metaobject/1234567890"
    },
    {
      key: "tagId",
      value: "gid://shopify/Metaobject/1234567891"
    },
    {
      key: "data",
      value: "Test pointer data"
    },
    {
      key: "pos_x",
      value: "50"
    },
    {
      key: "pos_y",
      value: "50"
    }
  ]
};

/**
 * Test helper to simulate GraphQL responses
 */
export function createMockGraphQLResponse(data, errors = null) {
  return {
    data: data || null,
    errors: errors || null,
    extensions: {}
  };
}

/**
 * Test helper to simulate metaobject definition responses
 */
export function createMockMetaobjectDefinition(type, count = 0) {
  return {
    metaobjectDefinitionByType: {
      name: type,
      type: type,
      id: `gid://shopify/MetaobjectDefinition/${type}`,
      fieldDefinitions: [
        {
          key: "title",
          name: "Title"
        }
      ],
      metaobjectsCount: count
    }
  };
}

/**
 * Test helper to validate metaobject structure
 */
export function validateMetaobjectStructure(metaobject) {
  const required = ['id', 'handle'];
  const missing = required.filter(field => !metaobject[field]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
  
  return true;
}

/**
 * Test helper to simulate API delays
 */
export function delay(ms = 1000) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Test helper to simulate network errors
 */
export function createNetworkError(message = "Network error") {
  const error = new Error(message);
  error.code = 'NETWORK_ERROR';
  return error;
}

/**
 * Test helper to simulate GraphQL errors
 */
export function createGraphQLError(message = "GraphQL error") {
  return {
    message,
    locations: [{ line: 1, column: 1 }],
    path: ["test"]
  };
}

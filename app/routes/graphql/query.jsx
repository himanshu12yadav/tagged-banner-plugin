/**
 * @author Sprinix Team
 * @copyright Copyright (c) 2023 Sprinix Technolabs (https://www.sprinix.com).
 */

export const deleteMetaobjectById = async (admin, id) => {
  try {
    return await (
      await admin.graphql(
        `
    #graphql
    mutation DeleteMetaobject($id: ID!){
      metaobjectDelete(id:$id){
        deletedId
        userErrors{
          field
          message
          code
        }
      }
    }
  `,
        {
          variables: {
            id: `${id}`,
          },
        }
      )
    )?.json();
  } catch (err) {
    throw err;
  }
};

export const createMetaobject = async (admin, data) => {
  const metaobjectInput = {
    type: data.table,
    fields: [
      {
        key: 'sku',
        value: data.sku,
      },
      {
        key: 'pointer_id',
        value: data.id,
      },
      {
        key: 'slider_id',
        value: `${data.sliderId}`,
      },
      {
        key: 'tag_id',
        value: `${data.tagId}`,
      },
      {
        key: 'data',
        value: data.data,
      },
      {
        key: 'pos_x',
        value: `${data.x}`,
      },
      {
        key: 'pos_y',
        value: `${data.y}`,
      },
    ],
  };

  try {
    return await (
      await admin.graphql(
        `#graphql
       mutation CreateMetaobject($metaobject: MetaobjectCreateInput!){
              metaobjectCreate(metaobject: $metaobject){
                metaobject{
                  handle
                  id
                }
                userErrors{
                  field
                  message
                  code
                }
              }
            }
        `,
        {
          variables: { metaobject: metaobjectInput },
        }
      )
    )?.json();
  } catch (err) {
    throw err;
  }
};

export const updateMetaobjectById = async (admin, data, id) => {
  try {
    const metaobjectInput = {
      fields: [
        {
          key: 'sku',
          value: data.sku,
        },
        {
          key: 'slider_id',
          value: `${data.sliderId}`,
        },
        {
          key: 'tag_id',
          value: `${data.tagId}`,
        },
        {
          key: 'data',
          value: data.data,
        },
        {
          key: 'pos_x',
          value: `${parseInt(data.x)}`,
        },
        {
          key: 'pos_y',
          value: `${parseInt(data.y)}`,
        },
      ],
    };

    return await (
      await admin.graphql(
        `
  #graphql
  mutation UpdateMetaobject($id:ID!, $metaobject: MetaobjectUpdateInput!){
    metaobjectUpdate(id:$id, metaobject:$metaobject){
      metaobject{
        handle
        id
      }
      userErrors{
        field
        message
        code
      }
    }
  }
  `,
        {
          variables: {
            id: `${id}`,
            metaobject: metaobjectInput,
          },
        }
      )
    )?.json();
  } catch (err) {
    throw err;
  }
};

export const metaobjectByHandle = async (admin, handle, type) => {
  try {
    const graphqlResponse = await admin.graphql(`
    query {
          metaobjectByHandle(handle: {
            type: "${type}",
            handle:"${handle}"
           }){
            displayName
            handle
            id
          }
        }
    `);

    if (!graphqlResponse) {
      throw new Error('No response from GraphQL client');
    }

    const response = await graphqlResponse.json();
    return response || {};
  } catch (err) {
    console.error(
      `Error fetching metaobject by handle ${handle}, type ${type}:`,
      err
    );
    return { data: { metaobjectByHandle: null } };
  }
};

export const metaobjectByHandleWithImage = async (admin, handle, type) => {
  try {
    const graphqlResponse = await admin.graphql(`
     query {
        metaobjectByHandle(handle: {
        type: "${type}",
        handle:"${handle}"
       }){
       displayName
        fields{
            key
            reference{
                ... on MediaImage{
                    image{
                        url
                    }
                 }
            }

            value
        }
        handle
        id
      }
    }
    `);

    if (!graphqlResponse) {
      throw new Error('No response from GraphQL client');
    }

    const response = await graphqlResponse.json();
    return response?.data || {};
  } catch (error) {
    console.error(
      `Error fetching metaobject with image for handle ${handle}, type ${type}:`,
      error
    );
    return { metaobjectByHandle: null };
  }
};

export const metaobjectByDefinitionType = async (admin, type) => {
  try {
    const graphqlResponse = await admin.graphql(`
      query{
        metaobjectDefinitionByType(type: "${type}") {
          name
          type
          id
          fieldDefinitions {
            key
            name
          }
          metaobjectsCount
        }
      }
      `);

    if (!graphqlResponse) {
      throw new Error('No response from GraphQL client');
    }

    const response = await graphqlResponse.json();

    return response?.data || {};
  } catch (err) {
    console.error(
      `Error fetching metaobject definition for type ${type}:`,
      err
    );
    console.error('Error details:', {
      message: err.message,
      stack: err.stack,
      name: err.name,
    });

    // Return a safe fallback instead of throwing
    return {
      metaobjectDefinitionByType: {
        name: type,
        type: type,
        id: null,
        fieldDefinitions: [],
        metaobjectsCount: 0,
      },
    };
  }
};

export const createMetaobjectDefinition = async (
  admin,
  name,
  fields,
  displayNameKey
) => {
  try {
    // Build definition input as per new API spec – exclude access/admin fields
    const definitionInput = {
      name: `${name}`,
      type: `${name}`,
      capabilities: {
        translatable: {
          enabled: true,
        },
      },
      fieldDefinitions: [...fields],
    };
    if (displayNameKey) {
      definitionInput.displayNameKey = `${displayNameKey}`;
    }
    return await (
      await admin.graphql(
        `
        mutation CreateMetaobjectDefinition($definition: MetaobjectDefinitionCreateInput!) {
          metaobjectDefinitionCreate(definition: $definition) {
            metaobjectDefinition {
              name
              type
              displayNameKey
              fieldDefinitions {
                name
                key
              }
            }
            userErrors {
              field
              message
              code
            }
          }
        }`,
        {
          variables: { definition: definitionInput },
        }
      )
    ).json();
  } catch (error) {
    throw error;
  }
};

export const deleteMetaobjectDefinition = async (admin, id) => {
  try {
    return await (
      await admin.graphql(
        `#graphql
  mutation DeleteMetaobjectDefinition($id: ID!) {
    metaobjectDefinitionDelete(id: $id) {
      deletedId
      userErrors {
        field
        message
        code
      }
    }
  }`,
        {
          variables: {
            id: `${id}`,
          },
        }
      )
    )?.json();
  } catch (error) {
    throw error;
  }
};

export const getSubscriptionStatus = async (graphql) => {
  const request = await graphql(
    `
      query {
        currentAppInstallation {
          activeSubscriptions {
            createdAt
            currentPeriodEnd
            id
            lineItems {
              id
              plan {
                pricingDetails {
                  ... on AppRecurringPricing {
                    interval
                    price {
                      amount
                      currencyCode
                    }
                  }
                }
              }
            }
            returnUrl
            name
            status
            test
            trialDays
          }
        }
      }
    `,
    {
      variables: {},
    }
  );
  return await request.json();
};


export const subscriptionMetafield = async (graphql, value) => {
  const appInstallationIdRequest = await graphql(`
    query {
      currentAppInstallation {
        id
      }
    }
  `);

  const appInstallationIDResponse = await appInstallationIdRequest.json();
  const appInstallationId =
    appInstallationIDResponse?.data?.currentAppInstallation?.id;

  const appMetafield = await graphql(
    `
      mutation CreateAppDataMetafield($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields {
            id
            namespace
            key
          }
          userErrors {
            field
            message
          }
        }
      }
    `,
    {
      variables: {
        metafields: [
          {
            namespace: 'sprinix',
            key: 'hasPlan',
            type: 'boolean',
            value: String(value),
            ownerId: appInstallationId,
          },
        ],
      },
    }
  );

  const metafieldResponse = await appMetafield.json();

  return new Response(JSON.stringify(metafieldResponse), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};


export const createMetaobjectCommon = async (admin, fields) => {
  try {
    const response = await admin.graphql(
      `
  mutation CreateMetaobject($metaobject: MetaobjectCreateInput!) {
    metaobjectCreate(metaobject: $metaobject) {
      metaobject {
        handle
        id
      }
      userErrors {
        field
        message
        code
      }
    }
  }`,
      {
        variables: {
          metaobject: fields,
        },
      }
    );

    return await response.json();
  } catch (error) {
    throw error;
  }
};

export const getListData = async (admin, type, count) => {
  const response = await admin.graphql(`
      query {
        metaobjects(first:${count}, type: "${type}") {

          nodes {
            fields {
              key
              reference {
                ... on MediaImage {
                  image {
                    url
                  }
                }
              }
              value
            }
            handle
            id
            updatedAt
          }
          pageInfo {
            endCursor
            hasNextPage
            hasPreviousPage
            startCursor
          }
        }
      }
  `);

  return await (
    await response.json()
  )?.data;
};

export const getPointerData = async (admin, type, count) => {
  try {
    const response = await admin.graphql(`
  query{
     metaobjects(first: ${count}, type: "${type}"){
        nodes{
           fields{
              key
              value
           }
           handle
           id
           updatedAt
                  }
               }
       }
  `);

    return await (
      await response.json()
    )?.data;
  } catch (error) {
    throw error;
  }
};

export const appSubscriptionCreate = async (admin, returnUrl) => {
  const response = await admin.graphql(
    `mutation AppSubscriptionCreate($name: String!, $lineItems: [AppSubscriptionLineItemInput!]!, $returnUrl: URL!, $test: Boolean, $trialDays: Int) {
      appSubscriptionCreate(name: $name, returnUrl: $returnUrl, lineItems: $lineItems, test: $test, trialDays: $trialDays) {
        userErrors {
          field
          message
        }
        appSubscription {
          id
          status
        }
        confirmationUrl
      }
    }`,
    {
      variables: {
        name: 'Tag Banner Monthly Plan',
        returnUrl: `${returnUrl}`,
        test: false,
        lineItems: [
          {
            plan: {
              appRecurringPricingDetails: {
                price: {
                  amount: 2.0,
                  currencyCode: 'USD',
                },
                interval: 'EVERY_30_DAYS',
              },
            },
          },
        ],
        trialDays: 1,
      },
    }
  );

  return await response.json();
};

export const appSubscriptionCancel = async (admin, subscriptionId) => {
  const response = await admin.graphql(
    `
  mutation AppSubscriptionCancel($id: ID!, $prorate:Boolean) {
    appSubscriptionCancel(id: $id, prorate: $prorate) {
      userErrors {
        field
        message
      }
      appSubscription {
        id
        status
        returnUrl
      }
    }
  }`,
    {
      variables: {
        id: `${subscriptionId}`,
        prorate: true,
      },
    }
  );

  const responseData = await response.json();
  return responseData.data;
};

export const sliderResult = async (admin, sliderCount) => {
  const response = (
    await (
      await admin.graphql(`
      query{
        metaobjects(first:${sliderCount || 10}, type: "sliders"){
          nodes{
            fields{
              key
              reference{
                ... on MediaImage{
                  image{
                    url
                  }
                }
              }
              value
            }
            handle
            id
            updatedAt
          }
          pageInfo{
            endCursor
            hasNextPage
            hasPreviousPage
            startCursor
          }
        }
      }`)
    ).json()
  )?.data;

  return response ? response : null;
};

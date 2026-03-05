/**
 * @author Sprinix Team
 * @copyright Copyright (c) 2023 Sprinix Technolabs (https://www.sprinix.com).
 */




// Mutation to create staged uploads
const stagedUploadsCreate = async (admin, file) => {
  try {
    const response = await (
      await admin.graphql(
        `#graphql
    mutation stagedUploadsCreate($input: [StagedUploadInput!]!){
      stagedUploadsCreate(input: $input){
        stagedTargets{
          url
          resourceUrl
          parameters{
            name
            value
          }
        }
      }
    }`,
        {
          variables: {
            input: [
              {
                filename: file.name,
                mimeType: file.type,
                httpMethod: "POST",
                resource: "IMAGE",
              },
            ],
          },
        },
      )
    ).json();

    const { data } = response;
    return data;
  } catch (err) {
    return err.message;
  }
};

// Mutation to create file records
const createFile = async (admin, file, resourceUrl) => {
  try {
    const response = await admin.graphql(
      `
    #graphql
    mutation fileCreate($files: [FileCreateInput!]!){
      fileCreate(files:$files){
        files{
          alt
          createdAt
          id
        }
      }
    }
  `,
      {
        variables: {
          files: {
            alt: file.name,
            contentType: "IMAGE",
            originalSource: resourceUrl,
          },
        },
      },
    );

    return response.json();
  } catch (err) {
    return err.message;
  }
};

// Query to get metaobject definition by type
const getMetaDefinitionByType = async (admin, type) => {
  try {
    const response = await admin.graphql(`
    query{
      metaobjectDefinitionByType(type: "pointers") {
        metaobjectsCount
        type
      }
    }
  `);
    return await response.json();
  } catch (err) {
    return new Error("Unable to get meta definition");
  }
};

// Mutation to delete a metaobject by ID

const metaobjectDeleteById = async (admin, id) => {
  try {
    const response = await admin.graphql(
      `#graphql
        mutation DeleteMetaobject($id: ID!) {
          metaobjectDelete(id: $id) {
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
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    // Ensure the response is in JSON format
    const { data } = await response.json();
    const { metaobjectDelete } = data;

    // Check for user errors
    if (metaobjectDelete.userErrors.length > 0) {
      const errorMessages = metaobjectDelete.userErrors.map(
        (error) => `${error.field}: ${error.message}`,
      );
      throw new Error(`GraphQL errors: ${errorMessages.join(", ")}`);
    }

    // Return the deleted ID if there are no user errors
    return metaobjectDelete.deletedId;
  } catch (err) {
    console.error("Error deleting metaobject:", err);
    throw new Error("Unable to delete metaobject: " + err.message);
  }
};

const fileDelete = async (admin, id) => {
  try {
    const response = await admin.graphql(
      `#graphql
   mutation fileDelete($input: [ID!]!) {
    fileDelete(fileIds: $input) {
      deletedFileIds
    }
  }
  `,
      {
        variables: {
          input: [`${id}`],
        },
      },
    );

    return response.json();
  } catch (error) {
    throw error;
  }
};

const uploadNewFile = async (admin, file, accessToken) => {
  try {
    const result = await stagedUploadsCreate(admin, file);
    const {
      stagedUploadsCreate: { stagedTargets },
    } = result;

    const { url, resourceUrl, parameters } = stagedTargets[0];
    await uploadToCloud(parameters, file, url, accessToken);
    const { files } = (await createFile(admin, file, resourceUrl)).data
      .fileCreate;
    return files[0]?.id;
  } catch (error) {
    throw error;
  }
};

const createMetaobject = async (admin, metaobjectInput) =>
  admin.graphql(
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
    },
  );

const createPointerMetaobject = async (
  admin,
  currentData,
  width,
  height,
) => {
  const keys = Object.keys(currentData);

  try {
    for (let p of keys) {
      const pos_x = pixelToPercentage(currentData[p].x, width);
      const pos_y = pixelToPercentage(currentData[p].y, height);

      const metaobjectInput = {
        type: "pointers",
        fields: [
          {
            key: "sku",
            value: currentData[p].sku,
          },
          {
            key: "pointer_id",
            value: currentData[p].pointerId,
          },
          {
            key:"slider_id",
            value:currentData[p].sliderId
          },
          {
            key:"tag_id",
            value:currentData[p].tagId
          },
          {
            key: "data",
            value: currentData[p].data,
          },
          {
            key: "pos_x",
            value: `${pos_x}`,
          },
          {
            key: "pos_y",
            value: `${pos_y}`,
          },
        ],
      };

      await createMetaobject(admin, metaobjectInput);
    }

    return { status: 200, message: "Updated successfully" };
  } catch (error) {
    return { status: 500, message: "Something went wrong ", error };
  }
};

// Function to upload files to the cloud
const uploadToCloud = async (parameters, file, url, accessToken) => {
  let uploadData = new FormData();

  parameters.forEach(({ name, value }) => {
    uploadData.append(name, value);
  });

  uploadData.append("file", file);

  try {
    await fetch(url, {
      method: "POST",
      body: uploadData,
      headers: {
        "X-Shopify-Access-Token": `${accessToken}`,
      },
    });
  } catch (e) {
    throw new Error(e.message);
  }
};

// Utility functions for conversion
const percentageToPixel = (percentage, dimension) =>
  (percentage / 100) * dimension;

const convertTo12HoursForm = () => {
  const date = new Date();
  const option = {
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: true,
  };

  return date.toLocaleString("en-US", option);
};

const pixelToPercentage = (pixel, dimension) => (pixel / dimension) * 100;

const checkFieldIsEmpty = (tag) =>
  tag.every(({ sku, data }) => {
    return sku !== null && sku !== "" && data !== null && data !== "";
  });

const areObjectEqual = (obj1, obj2) => {
  const keys = Object.keys(obj1);
  return keys.every((key) => obj1[key] === obj2[key]);
};

const isThereChange = (previous, current) => {
  const result = current.every((curr, index) => {
    if (index >= previous.length) return false;
    return areObjectEqual(curr, previous[index]);
  });

  return result;
};

export {
  stagedUploadsCreate,
  createFile,
  metaobjectDeleteById,
  getMetaDefinitionByType,
  uploadToCloud,
  pixelToPercentage,
  percentageToPixel,
  checkFieldIsEmpty,
  isThereChange,
  fileDelete,
  createPointerMetaobject,
  uploadNewFile,
  createMetaobject,
  convertTo12HoursForm,
};

/**
 * @author Sprinix Team
 * @copyright Copyright (c) 2023 Sprinix Technolabs (https://www.sprinix.com).
 */

import {
  useIndexResourceState,
  BlockStack,
  Box,
  Button,
  Card,
  DropZone,
  EmptyState,
  FormLayout,
  IndexTable,
  Page,
  Text,
  TextField,
  Thumbnail,
  useBreakpoints,
  Layout,
  Spinner,
} from "@shopify/polaris";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { authenticate } from "../shopify.server";
import { DeleteIcon, NoteIcon } from "@shopify/polaris-icons";
import { useAppBridge } from "@shopify/app-bridge-react";
import {
  createMetaobject,
  uploadNewFile,
} from "./helper.jsx";
import {useLoaderData, useActionData, useSubmit, useNavigate} from "@remix-run/react";

import {deleteMetaobjectById, getListData, metaobjectByDefinitionType} from "./graphql/query.jsx";
import {json} from "@remix-run/node";
import useIsomorphicLayoutEffect from "../component/customHook/useIsomorphicLayoutEffect";
import { Error, ErrorTypes } from "../component/Error/Error";
import { ErrorHandler } from "../utils/errorHandler";


function ClientOnly({ children, fallback = null }) {
  const [hasMounted, setHasMounted] = useState(false);
  useIsomorphicLayoutEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return fallback;
  }
  return children;
}


export const loader = async ({ request, params }) => {
  const { admin } = await authenticate.admin(request);
  let paramId = params.sliderId;

  const [sliderData, tagCollectionData, pointerData] = await Promise.all([
    (await admin.graphql(`
      query {
        metaobjectByHandle(handle: {
          type: "sliders",
          handle:"${paramId}"
         }) {
          displayName
          id
        }
      }`)).json(),
    metaobjectByDefinitionType(admin, "tag_collection"),
    metaobjectByDefinitionType(admin, "pointers")
  ]);

  const metaobjectByHandle = sliderData.data?.metaobjectByHandle;

  if (!metaobjectByHandle) {
    ErrorHandler.logError(new Error("Slider not found"), { route: 'app.slider.$sliderId', params: { sliderId: paramId } });
    throw new Response("Slider not found", { status: 404 });
  }

  const { id } = metaobjectByHandle;

  const tagCollectionCount = tagCollectionData?.metaobjectDefinitionByType?.metaobjectsCount;
  const pointerCount = pointerData?.metaobjectDefinitionByType?.metaobjectsCount;

  const [tagCollections, pointers] = await Promise.all([
    getListData(admin, "tag_collection", tagCollectionCount),
    getListData(admin, "pointers", pointerCount)
  ]);

  const result = processTagCollectionsAndPointers(tagCollections, pointers, id);

  return json({
    nodes: result.length > 0 ? result : null,
    sliderId: id,
    sliderHandle: paramId
  }, {
    headers: {
      "Cache-Control": "public, max-age=300"
    }
  });
};

const saving = async (admin, accessToken, formData) => {
  const file = formData.get("file");
  const pointerName = formData.get("pointerName");
  const sliderId = formData.get("sliderId");

if (file.size > 520 * 1024) {
    console.log("file size ->", file);
    return {
      type: "file_error",
      status: 400,
      message: "File size should be less than 520KB",
    };
  }


  const fileId = await uploadNewFile(admin, file, accessToken);
  const metaobjectInput = {
    type: "tag_collection",
    fields: [
      {
        key: "pointer_name",
        value: pointerName,
      },
      {
        key: "slider_id",
        value: `${sliderId}`,
      },
      {
        key: "image_id",
        value: fileId,
      },
    ],
  };

  const response = await (
    await createMetaobject(admin, metaobjectInput)
  ).json();

  const {
    metaobjectCreate: { userErrors },
  } = response?.data;

  return userErrors.length <= 0
    ? { status: 200, message: "Successfully created" }
    : null;
};

export const action = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const { accessToken } = session;
  const formData = await request.formData();
  const type = formData.get("type");
  const id = JSON.parse(formData.get("id"));

  if (type === "save") {
    return await saving(admin, accessToken, formData);
  }

  if (type === "delete") {
    if (id && id.length > 0) {
      const promises = await id.map(
        async (id) => await deleteMetaobjectById(admin, id),
      );
      return await Promise.all(promises);
    }
  }

  return null;
};

const SpacingBackground = ({ children }) => {
  return (
    <div
      style={{
        background: `#F4F6F8`,
        padding: "16px",
        borderRadius: "8px",
        margin: "16px 0",
      }}
    >
      {children}
    </div>
  );
};

const Placeholder = ({ height = "auto", file, validImageTypes }) => {
  return (
    <div
      style={{
        backgroundColor: `#D3E3D5`,
        padding: `14px var(--p-space-200)`,
        borderRadius: "8px",
        display: "flex",
        alignItems: "center",
        height: height,
        gap: "12px",
      }}
    >
      <Thumbnail
        size="small"
        source={
          validImageTypes.includes(file.type)
            ? window.URL.createObjectURL(file)
            : NoteIcon
        }
        alt={file.title}
        style={{ borderRadius: "4px" }}
      />
      <div>
        {file.name}
        {""}
      </div>
    </div>
  );
};

const processData = (nodes) =>
  nodes?.map((el) => {
    const { fields, handle, id, updatedAt, pointers } = el;
    const title = fields[0]?.value || "";
    const handleId = handle || "";
    const slider = { ...fields[1]?.reference } || "";
    const image = { ...fields[2]?.reference } || "";
    return { title, handleId, slider, image, id, updatedAt, pointers };
  });

function deletedRow(row) {
  return row?.every(({ id }) => id !== null);
}


export default function Tag() {
  const { sliderId, sliderHandle } = useLoaderData();
  const [pointerName, setPointerName] = useState("");
  const [file, setFile] = useState(null);
  const shopify = useAppBridge();
  const actionData = useActionData();
  const [loader, setLoader] = useState(false);
  const submit = useSubmit();
  const loaderData = useLoaderData();
  const navigate = useNavigate();


 useEffect(() => {
    if (actionData?.type === "file_error") {

      setLoader(false);
      shopify.toast.show(actionData?.message, {
        duration: 3000,
        type: "error",
        isError: true,
      });
    }
  }, [actionData, shopify]);

  const data = useMemo(
    () =>
      actionData?.paginate
        ? processData(actionData.paginate.data.metaobjects.nodes)
        : processData(loaderData?.nodes || []),
    [actionData, loaderData],
  );

  console.log(data);

  const {
    selectedResources = [],
    allResourcesSelected = false,
    handleSelectionChange,
  } = useIndexResourceState(data || []);

  const clearIt = () => {
    setPointerName("");
    setFile(null);
  };

  const validImageTypes = ["image/png", "image/jpeg"];
  const fileUpload = !file && <DropZone.FileUpload />;
  const handleDropzone = useCallback(
    (acceptedFiles) => setFile(acceptedFiles[0]),
    [],
  );

  useEffect(() => {
    if (actionData) {
      if (actionData?.status === 200) {
        setLoader(false);
        shopify.toast.show(actionData?.message, {
          isError: false,
          duration: 1000,
        });

        clearIt();
      } else {
        shopify.toast.show({
          isError: true,
          duration: 1000,
        });
      }
    }
  }, [shopify, actionData]);

  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault();
      if (pointerName && file) {
        let formData = new FormData();
        formData.append("file", file);
        formData.append("pointerName", pointerName);
        formData.append("type", "save");
        formData.append("sliderId", sliderId);
        submit(formData, {
          replace: true,
          method: "POST",
          encType: "multipart/form-data",
        });

        setLoader(true);
      }
    },
    [pointerName, file, sliderId, submit],
  );

  const uploadFile = file && (
    <SpacingBackground>
      <BlockStack>
        <Placeholder file={file} validImageTypes={validImageTypes} />
      </BlockStack>
    </SpacingBackground>
  );

  const bulkActions = [
    {
      icon: DeleteIcon,
      destructive: true,
      content: "Delete",
      onAction: useCallback(() => {
        let formData = new FormData();
        formData.append("type", "delete");
        formData.append("id", JSON.stringify(selectedResources));
        submit(formData, { method: "POST" });
      }),
    },
  ];

  if (actionData?.deletedRow) {
    deletedRow(actionData?.deletedRow)
      ? shopify.toast.show("Selected row deleted,", { duration: 2000 })
      : shopify.toast.show("Something went wrong.", {
          isError: true,
          duration: 2000,
        });

    actionData.deletedRow = null;
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Page fullWidth={true} title={"Slide Dashboard"}>
        <Layout>
          <Layout.Section>
            <Card>
              <Box>
                <FormLayout>
                  <TextField
                    label="Tag Name"
                    autoComplete="off"
                    placeholder="Tag name"
                    value={pointerName}
                    onChange={(value) => setPointerName(value)}
                  />
                  <DropZone
                    allowMultiple={false}
                    onDrop={handleDropzone}
                    style={{
                      borderRadius: "8px",
                      padding: "16px",
                      textAlign: "center",
                      backgroundColor: "#F4F6F8",
                    }}
                  >
                    {uploadFile}
                    {fileUpload}
                  </DropZone>

                  <Button variant={"primary"} onClick={handleSubmit}>
                    {loader ? (
                      <Spinner
                        accessibilityLabel="Small spinner example"
                        size="small"
                      />
                    ) : (
                      "Create"
                    )}
                  </Button>
                </FormLayout>
              </Box>
            </Card>
          </Layout.Section>
          <Layout.Section>
            <Card>
              {data.length > 0 ? (
                <ClientOnly fallback={<Spinner />}>
                <IndexTable
                  headings={[
                    { title: "title" },
                    { title: "Thumbnail" },
                    { title: "Count" }
                  ]}
                  condensed={useBreakpoints.smDown}
                  bulkActions={bulkActions}
                  resourceName={{ singular: "slider", plural: "sliders" }}
                  itemCount={data.length}
                  selectedItemsCount={
                    allResourcesSelected ? "All" : selectedResources.length
                  }
                  onSelectionChange={handleSelectionChange}
                >
                  {data?.map(
                    ({ title, handleId, image, id, updatedAt, pointers }, index) => (
                      <IndexTable.Row
                        id={id}
                        key={id}
                        selected={selectedResources.includes(id)}
                        position={index}
                        onClick={() => {
                          navigate(`/app/slider/${sliderHandle}/${handleId}`)
                        }}
                      >
                        <IndexTable.Cell>
                          <Text variant="bodyMd" fontWeight="bold" as="span">
                            {title}
                          </Text>
                        </IndexTable.Cell>
                        <IndexTable.Cell>
                          <Thumbnail source={image?.image?.url} alt={title} />
                        </IndexTable.Cell>
                        <IndexTable.Cell>{pointers ? pointers.length : 0}</IndexTable.Cell>

                      </IndexTable.Row>
                    ),
                  )}
                	</IndexTable>
                </ClientOnly>
              ) : (
                <EmptyState
                  heading="No pointers found"
                  image="https://cdn.shopify.com/s/files/1/0757/9955/files/empty-state.svg"
                >
                  <p>Try adding a Pointer to get started.</p>
                </EmptyState>
              )}
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    </Suspense>
  );
}

function processTagCollectionsAndPointers(tagCollections, pointers, sliderId) {
  const { nodes } = tagCollections.metaobjects;
  const pointersData = pointers.metaobjects.nodes;

  return nodes
    .filter(({ fields }) => fields[1].value === sliderId)
    .map(item => {
      const pointerList = pointersData.filter(({fields}) => {
        const { value } = fields[3];
        return value === item.id;
      });

      return {
        ...item,
        pointers: pointerList?.length > 0 ? pointerList : null,
      };
    });
}

export const ErrorBoundary = () => {
  return (
    <Error
      type={ErrorTypes.GENERAL}
      title="Slider Dashboard Error"
      message="An error occurred while loading the slider dashboard."
      showHome={true}
      showRetry={true}
    />
  );
};


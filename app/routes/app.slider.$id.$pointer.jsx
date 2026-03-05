/**
 * @author Sprinix Team
 * @copyright Copyright (c) 2023 Sprinix Technolabs (https://www.sprinix.com).
 */

import {useActionData, useLoaderData, useSubmit, useNavigate, useLocation} from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { useDragAndDrop } from "../component/customHook/useDragAndDrop";
import { useAppBridge } from "@shopify/app-bridge-react";
import { useCallback, useEffect, useState } from "react";
import { BlockStack, Button, Card, Grid, Page } from "@shopify/polaris";
import { DragAndDrop } from "../component/DragAndDrop/DragAndDrop";
import { FormControl } from "../component/FormControl/FormControl";
import { Error, ErrorTypes } from "../component/Error/Error";
import { ErrorHandler } from "../utils/errorHandler";
import img from "./images/default.png";
import { PlusIcon } from "@shopify/polaris-icons";
import "@coreui/coreui/dist/css/coreui.min.css";

import {
  percentageToPixel,
  pixelToPercentage,
} from "./helper";
import {
  createMetaobject,
  deleteMetaobjectById,
  metaobjectByHandle,
  updateMetaobjectById,
  metaobjectByDefinitionType, getPointerData, metaobjectByHandleWithImage,
} from "./graphql/query.jsx";

export const loader = async ({ request, params }) => {
  const { admin } = await authenticate.admin(request);

  const {id:sliderId, pointer:tagId} = params;

  try {
    // Fetch slider data
    const sliderResponse = await metaobjectByHandle(admin, sliderId, "sliders");
    if (!sliderResponse?.data?.metaobjectByHandle) {
      throw new Response("Slider not found", { status: 404 });
    }

    // Fetch tag collection data
    const tagResponse = await metaobjectByHandleWithImage(admin, tagId, "tag_collection");
    if (!tagResponse?.metaobjectByHandle) {
      throw new Response("Tag collection not found", { status: 404 });
    }

    // Fetch pointer definitions
    const pointerDefinitons = await metaobjectByDefinitionType(admin, "pointers");
    
    const tagGid = tagResponse.metaobjectByHandle.id;
    const sliderGid = sliderResponse.data.metaobjectByHandle.id;
    const numberOfPointer = pointerDefinitons?.metaobjectDefinitionByType?.metaobjectsCount || 0;

    const pointerData = await getPointerData(admin, "pointers", numberOfPointer);
    let imageUrl = tagResponse.metaobjectByHandle.fields[2]?.reference?.image?.url;

    if (pointerData) {
      const result = pointerData.metaobjects.nodes
          .filter(({fields}) =>
              fields[2]?.value === sliderGid && fields[3]?.value === tagGid
          )
          .map(({fields, handle, id, updatedAt}) => ({
            sku: fields[0]?.value || "",
            data: fields[4]?.value || "",
            pos_x: fields[5]?.value || "",
            pos_y: fields[6]?.value || "",
            pointerId: fields[1]?.value || "",
            id,
            handle,
            updatedAt,
          }));

      return {
        nodes: result.length > 0 ? result : null,
        sliderGid,
        tagGid,
        imageUrl,
      }
    }

    return {
      nodes: null,
      sliderGid,
      tagGid,
      imageUrl,
    }

  } catch (err) {
    ErrorHandler.logError(err, { route: 'app.slider.$id.$pointer', params: { sliderId, tagId } });
    
    // If it's already a Response, re-throw it
    if (err instanceof Response) {
      throw err;
    }
    
    // Handle GraphQL errors
    const processedError = ErrorHandler.handleGraphQLError(err);
    if (processedError.type === "NETWORK") {
      throw new Response("Network error occurred", { status: 503 });
    }
    
    throw new Response("Error fetching data", { status: 500 });
  }
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();

  const type = formData.get("type");

  if (type === "DELETE") {
    const deletedId = formData.get("deletedId");
    const response = await deleteMetaobjectById(admin, deletedId);
    let id = response?.data?.metaobjectDelete?.deletedId;
    return {
      delete: Boolean(id),
      message: id ? "Tag deleted successfully." : "Tag deletion unsuccessful",
      error: !id,
      deletedId: deletedId, // Include this to identify which item was deleted
    };
  }

  if (type === "CREATE") {
    const createData = JSON.parse(formData.get("createData"));
    const response = await createMetaobject(admin, createData);
    console.log(
      "Create :",
      response?.data?.metaobjectCreate?.metaobject?.handle,
    );
    const handle = response?.data?.metaobjectCreate?.metaobject?.handle;
    const createDataID = response?.data?.metaobjectCreate?.metaobject?.id;
    return {
      create: Boolean(handle),
      message: handle
        ? "Tag Created successfully."
        : "Tag Creation unsuccessful.",
      error: !handle,
      createdId: createDataID, // Include this to identify which item was created
    };
  }

  if (type === "UPDATE") {
    const updatedId = formData.get("updatedId");
    const data = JSON.parse(formData.get("updatedData"));
    const response = await updateMetaobjectById(admin, data, updatedId);
    const handle = response?.data?.metaobjectUpdate?.metaobject?.id;
    const id = response?.data?.metaobjectUpdate?.metaobject?.id;
    console.log("handle update:", response?.data?.metaobjectUpdate?.metaobject);
    return {
      update: Boolean(handle),
      message: handle ? "Tag updated successfully." : "Tag update unsuccessful",
      error: !handle,
      updatedId: id,
    };
  }

  return null;
};

// utility component

const SpacingBackground = ({ children }) => (
  <div style={{ height: "auto", padding: "10px 10px" }}>{children}</div>
);

// default component

export default function Pointer() {
  const loaderData = useLoaderData();
  const {
    tags,
    setTag,
    pointers,
    setPointer,
    handleAdd,
    handleDelete,
    handleDragStart,
    handleUpdateTag,
    drop,
    isOver,
  } = useDragAndDrop();
  const shopify = useAppBridge();
  const actionData = useActionData();

  const [temp, setTemp] = useState(null);
  const [iWidth, setIwidth] = useState(null);
  const [iHeight, setIHeight] = useState(null);
  const [sliderId, setSliderId] = useState(null);
  const [tagId, setTagId] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const submit = useSubmit();

  // loader state
  const [createLoader, setCreateLoader] = useState({});
  const [updateLoader, setUpdateLoader] = useState({});
  const [deleteLoader, setDeleteLoader] = useState({});

  useEffect(() => {
    if (actionData?.update) {
      setUpdateLoader((prevState) => ({
        ...prevState,
        [actionData.updatedId]: false,
      }));
      // setUpdateLoader((prevState) => !prevState);
      shopify.toast.show(actionData?.message, {
        duration: 2000,
        isError: actionData?.error,
      });
    }

    if (actionData?.create) {
      // setCreateLoader((prevState) => !prevState);
      setCreateLoader((prevState) => ({
        ...prevState,
        [actionData.createdId]: false,
      }));
      shopify.toast.show(actionData?.message, {
        duration: 2000,
        isError: actionData?.error,
      });
    }

    if (actionData?.delete) {
      // setDeleteLoader((prevState) => !prevState);
      setDeleteLoader((prevState) => ({
        ...prevState,
        [actionData.deletedId]: false,
      }));

      shopify.toast.show(actionData?.message, {
        duration: 2000,
        isError: actionData?.error,
      });
    }
  }, [actionData, shopify]);


  const handleBack = () => {
    const pathArray = location.pathname.split('/');
    pathArray.pop(); // Removes the last segment
    const newPath = pathArray.join('/');
    navigate(newPath);
  };

  // handle delete tag
  let handleDeleteFromBackend = useCallback(
    async (id) => {
      if (!id) return;
      if (id.includes("gid") && Boolean(tags.find((tag) => tag.id === id))) {
        setDeleteLoader((prevState) => ({ ...prevState, [id]: true }));
        const formData = new FormData();
        formData.append("deletedId", id);
        formData.append("type", "DELETE");

        return submit(formData, {
          method: "POST",
          replace: true,
        });
      } else {
        handleDelete(id);
      }
    },
    [tags, submit],
  );

  // handle create tag
  let handleCreate = useCallback(
    async (id) => {
      // get data from array
      // setCreateLoader((prevState) => !prevState);
      setCreateLoader((prevState) => ({ ...prevState, [id]: true }));
      let tag = tags.find((tag) => tag.id === id) || {};
      let pointer = pointers.find((pointer) => pointer.id === id) || {};
      let table = "pointers";

      let data = {
        ...tag,
        ...pointer,
        sliderId,
        tagId,
        iWidth,
        iHeight,
        table,
      };

      const pos_x = pixelToPercentage(data.x, data.iWidth);
      const pos_y = pixelToPercentage(data.y, data.iHeight);
      data.x = pos_x;
      data.y = pos_y;

      // process data
      let formData = new FormData();
      formData.append("createData", JSON.stringify(data));
      formData.append("type", "CREATE");
      return submit(formData, {
        method: "POST",
        replace: true,
      });
    },
    [tags, pointers, submit],
  );

  // handle update tag
  let handleUpdate = useCallback(
    async (id) => {
      if (id && Boolean(tags.find((tag) => tag.id === id))) {
        // setUpdateLoader((prevState) => !prevState);
        setUpdateLoader((prevState) => ({ ...prevState, [id]: true }));
        let tag = tags.find((tag) => tag.id === id) || {};
        let pointer = pointers.find((pointer) => pointer.id === id) || {};
        let table = "pointers";

        let data = {
          ...tag,
          ...pointer,
          sliderId,
          tagId,
          iWidth,
          iHeight,
          table,
        };

        const pos_x = pixelToPercentage(data.x, data.iWidth);
        const pos_y = pixelToPercentage(data.y, data.iHeight);
        data.x = pos_x;
        data.y = pos_y;

        // sending request for update.
        const formData = new FormData();
        formData.append("updatedId", id);
        formData.append("updatedData", JSON.stringify(data));
        formData.append("type", "UPDATE");

        return submit(formData, {
          method: "POST",
          replace: true,
        });
      }
    },
    [tags, pointers, submit],
  );

  /** useEffect here */

  useEffect(() => {
    const { imageUrl, sliderGid, tagGid } = loaderData;
    setTemp(imageUrl);
    setSliderId(sliderGid);
    setTagId(tagGid);
  }, [loaderData]);

  useEffect(() => {
    let prevTags = [];
    let prevPointers = [];


    loaderData?.nodes?.forEach(({ data, id, pos_x, pos_y, sku, pointerId }) => {
      const x = percentageToPixel(pos_x, iWidth);
      const y = percentageToPixel(pos_y, iHeight);

      prevTags.push({ id, sku, data });
      prevPointers.push({ id, pointerId, x, y });
    });

    setTag(prevTags);
    setPointer(prevPointers);
  }, [loaderData, iWidth, iHeight]);

  useEffect(() => {
    const dropTarget = document.querySelector("#dropTarget");
    if (!dropTarget) return;
    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setIwidth(width);
      setIHeight(height);
    });

    resizeObserver.observe(dropTarget);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  /** end */

  return (
    <>
      <Page fullWidth>
        <Card sectioned>
          <div style={{ marginBottom: "16px" }}>
            <Button onClick={handleBack} primary>
              Back
            </Button>
          </div>
          <Grid>
            <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 9 }}>
              <div
                ref={drop}
                id="dropTarget"
                style={{
                  height: `100%`,
                  width: `100%`,
                  maxWidth: `100%`,
                  position: "relative",
                  outline: isOver ? "2px dashed green" : "2px solid grey",
                  maxHeight: "640px",
                }}
              >
                <img src={temp || img} height="100%" width="100%" alt={"image"}/>

                {pointers.map((p) => (
                  <DragAndDrop
                    key={p.id}
                    id={p.id}
                    x={p.x}
                    y={p.y}
                    data={tags?.find((t) => t.id === p.id)?.data}
                    handleDragStart={handleDragStart}
                  />
                ))}
              </div>
            </Grid.Cell>
            <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 3 }}>
              <SpacingBackground>
                <BlockStack as="section" gap={200}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "14px var(--p-space-200)",
                      border: "1px solid  var(--p-color-text-info)",
                      borderRadius: "10px",
                    }}
                  >
                    <Button source={PlusIcon} onClick={handleAdd}>
                      Add
                    </Button>
                  </div>
                  <div
                    style={{
                      minHeight: "565px",
                      overflowY: "scroll",
                    }}
                  >
                    {tags?.map((t) => (
                      <FormControl
                        key={t.id}
                        id={t.id}
                        tag={t}
                        updateTag={handleUpdateTag}
                        deleteForm={handleDeleteFromBackend}
                        handleCreate={handleCreate}
                        handleUpdate={handleUpdate}
                        loaderData={loaderData}
                        createLoader={createLoader[t.id]}
                        updateLoader={updateLoader[t.id]}
                        deleteLoader={deleteLoader[t.id]}
                      />
                    ))}
                  </div>
                </BlockStack>
              </SpacingBackground>
            </Grid.Cell>
          </Grid>
        </Card>
      </Page>
    </>
  );
}


export const ErrorBoundary = () => {
  return (
    <Error
      type={ErrorTypes.GENERAL}
      title="Slider Error"
      message="An error occurred while loading the slider data."
      showHome={true}
      showRetry={true}
    />
  );
};

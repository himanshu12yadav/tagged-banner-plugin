/**
 * @author Sprinix Team
 * @copyright Copyright (c) 2023 Sprinix Technolabs (https://www.sprinix.com).
 */

import {
  Card,
  Button,
  Icon,
  Collapsible,
  FormLayout,
  TextField,
  Spinner,
} from "@shopify/polaris";
import {
  MinusIcon,
  PlusIcon,
  DeleteIcon,
  SaveIcon,
} from "@shopify/polaris-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./FormControl.module.css";

export const FormControl = ({
  id,
  tag,
  updateTag,
  deleteForm,
  hover,
  handleCreate,
  handleUpdate,
  loaderData,
  createLoader,
  deleteLoader,
  updateLoader,
}) => {
  const [open, setOpen] = useState(hover);
  const [sku, setSku] = useState(tag.sku || "");
  const [data, setData] = useState(tag.data || "");
  const handleToggle = useCallback(() => {
    setOpen((open) => !open);
  }, []);

  const handleProductskuChange = useCallback(
    (value) => {
      setSku(value);
      updateTag(id, { id, sku: value, data });
    },
    [id, data, updateTag]
  );

  const handleDataChange = useCallback(
    (value) => {
      setData(value);
      updateTag(id, { id, sku, data: value });
    },
    [id, sku, updateTag]
  );

  useEffect(() => {
    console.log(
      "Delete item -",
      Boolean(deleteLoader && loaderData?.nodes?.find((n) => n.id === id))
    );
  }, [deleteLoader, id]);

  const isLoading = useMemo(
    () => Boolean(loaderData?.nodes?.find((n) => n.id === id)),
    [loaderData, id]
  );

  return (
    <Card sectioned>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Button
          onClick={handleToggle}
          aria-expanded={open}
          aria-controls="basic-collapsible"
          variant="primary"
          size="micro"
        >
          {!open ? (
            <Icon source={PlusIcon} tone="interactive" />
          ) : (
            <Icon source={MinusIcon} tone="interactive" />
          )}
        </Button>

        <Button variant="primary" size="micro" onClick={() => deleteForm(id)}>
          {deleteLoader ? (
            <Spinner accessibilityLabel="Small spinner example" size="small" />
          ) : (
            <Icon source={DeleteIcon} tone="base" />
          )}
        </Button>
      </div>

      <Collapsible
        id={`collapsible-${id}`}
        open={open}
        transition={{ duration: "500ms", timingFunction: "ease-in-out" }}
      >
        <FormLayout className={styles.formContainer}>
          <TextField
            type="text"
            autoComplete="off"
            label="Product SKU"
            placeholder="product sku"
            value={sku}
            onChange={handleProductskuChange}
          />

          <TextField
            autoComplete="off"
            label="Data"
            placeholder="hold product details"
            value={data}
            onChange={handleDataChange}
          />
          {loaderData &&
          Boolean(loaderData?.nodes?.find((n) => n.id === id)) ? (
            <Button variant="primary" onClick={() => handleUpdate(id)}>
              {updateLoader ? <Spinner size="small" /> : "Update"}
            </Button>
          ) : (
            <Button variant="primary" onClick={() => handleCreate(id)}>
              {createLoader ? <Spinner size="small" /> : "Create"}
            </Button>
          )}
        </FormLayout>
      </Collapsible>
    </Card>
  );
};

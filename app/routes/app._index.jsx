/**
 * @author Sprinix Team
 * @copyright Copyright (c) 2023 Sprinix Technolabs (https://www.sprinix.com).
 */

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import useIsomorphicLayoutEffect from '../component/customHook/useIsomorphicLayoutEffect';

import {
  Box,
  Button,
  Card,
  EmptyState,
  FormLayout,
  IndexTable,
  Layout,
  Page,
  Spinner,
  Text,
  TextField,
  useBreakpoints,
  useIndexResourceState,
} from '@shopify/polaris';

import {
  useActionData,
  useFetcher,
  useLoaderData,
  useNavigate,
  useSubmit,
} from '@remix-run/react';
import { useAppBridge } from '@shopify/app-bridge-react';
import { DeleteIcon } from '@shopify/polaris-icons';
import { Error, ErrorTypes } from '../component/Error/Error';
import { authenticate } from '../shopify.server';
import {
  createMetaobjectCommon,
  deleteMetaobjectById,
  metaobjectByDefinitionType,
  sliderResult,
} from './graphql/query.jsx';

// loader function for initial rendering

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

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);



  try {
    const sliderResponse = await metaobjectByDefinitionType(admin, 'sliders');

    const sliderCount =
      sliderResponse?.metaobjectDefinitionByType?.metaobjectsCount || 0;


    const response = await sliderResult(admin, sliderCount);

    return {
      response,
    };
  } catch (err) {

    throw new Response('Error loading dashboard', { status: 500 });
  }
};

// action function processing
export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const formData = await request.formData();
  const title = formData.get('title');
  const ids = JSON.parse(formData.get('id'));

  if (ids && ids?.length > 0) {
    const promises = await ids.map(async (id) =>
      deleteMetaobjectById(admin, id)
    );
    return Promise.all(promises);
  }

  const metaobjectInput = {
    type: 'sliders',
    handle: title,
    fields: [
      {
        key: 'title',
        value: title,
      },
    ],
  };

  const response = await createMetaobjectCommon(admin, metaobjectInput);
  const {
    data: {
      metaobjectCreate: { userErrors },
    },
  } = response;

  if (userErrors.length <= 0) {
    return {
      status: 200,
      message: 'Slider added successfully',
    };
  }

  return {
    status: 500,
    message: 'Something went wrong',
  };
};

// process data

const processData = (nodes) =>
  nodes.map((el) => {
    const { fields, handle, id, updatedAt } = el;
    const title = fields[0]?.value || '';
    const handleId = handle || '';
    return { title, handleId, id, updatedAt };
  });

function deletedRow(row) {
  return row?.every(({ id }) => id !== null);
}

// app function
export function Slider() {
  const [sliderName, setSliderName] = useState('');
  const [loader, setLoader] = useState(false);
  const navigate = useNavigate();
  const fetcher = useFetcher();

  const actionData = useActionData();
  const loaderData = useLoaderData();
  const submit = useSubmit();

  const shopify = useAppBridge();

  const handleSliderNameChange = useCallback(async (value) => {
    setSliderName(value);
  }, []);

  const data = useMemo(
    () =>
      actionData?.paginate
        ? processData(actionData.paginate.data.metaobjects.nodes)
        : processData(loaderData?.response?.metaobjects?.nodes || []),
    [actionData, loaderData]
  );

  const {
    selectedResources = [],
    allResourcesSelected = false,
    handleSelectionChange,
  } = useIndexResourceState(data || []);

  useEffect(() => {
    if (actionData?.status === 200) {
      shopify.toast.show(actionData?.message, {
        duration: 2000,
        isError: false,
      });
      setLoader((prevState) => !prevState);
    }
  }, [actionData, shopify]);

  const handleSubmit = useCallback(() => {
    if (sliderName) {
      setLoader((prevState) => !prevState);
      submit({ title: sliderName }, { method: 'POST', replace: true });
    }
  }, [sliderName, submit]);

  const bulkActions = [
    {
      icon: DeleteIcon,
      destructive: true,
      content: 'Delete',
      onAction: useCallback(() => {
        let formData = new FormData();
        formData.append('id', JSON.stringify(selectedResources));
        submit(formData, { method: 'POST' });
      }, [selectedResources, submit]),
    },
  ];

  if (actionData?.deletedRow) {
    deletedRow(actionData?.deletedRow)
      ? shopify.toast.show('Selected row deleted,', { duration: 2000 })
      : shopify.toast.show('Something went wrong.', {
          isError: true,
          duration: 2000,
        });

    actionData.deletedRow = null;
  }

  return (
    <Page fullWidth={true} title={'Slider Management'}>
      <Layout>
        <Layout.Section>
          <Card title="Add New Slider" sectioned>
            <Box>
              <FormLayout>
                <TextField
                  label="Slider Name"
                  value={sliderName}
                  onChange={handleSliderNameChange}
                  placeholder={'Enter slider name'}
                  autoComplete="off"
                />
                <Button
                  variant="primary"
                  primary
                  submit={true}
                  onClick={handleSubmit}
                >
                  {loader ? (
                    <Spinner
                      accessibilityLabel="Small spinner example"
                      size="small"
                    />
                  ) : (
                    'Add Slider'
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
                  headings={[{ title: 'title' }]}
                  condensed={useBreakpoints.smDown}
                  bulkActions={bulkActions}
                  resourceName={{ singular: 'slider', plural: 'sliders' }}
                  itemCount={data.length}
                  selectedItemsCount={
                    allResourcesSelected ? 'All' : selectedResources.length
                  }
                  onSelectionChange={handleSelectionChange}
                >
                  {data?.map(({ title, handleId, id }, index) => {
                    return (
                      <IndexTable.Row
                        id={id}
                        key={id}
                        selected={selectedResources.includes(id)}
                        position={index}
                        onClick={() => {
                          // prefetch the data while navigating
                          fetcher.load(`/app/slider/${handleId}`);
                          navigate(`/app/slider/${handleId}`);
                        }}
                      >
                        <IndexTable.Cell>
                          <Text variant="bodyMd" fontWeight="bold" as="span">
                            {title}
                          </Text>
                        </IndexTable.Cell>
                      </IndexTable.Row>
                    );
                  })}
                </IndexTable>
              </ClientOnly>
            ) : (
              <EmptyState
                heading="No sliders found"
                image="https://cdn.shopify.com/s/files/1/0757/9955/files/empty-state.svg"
              >
                <p>Try adding a new slider to get started.</p>
              </EmptyState>
            )}
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

export default function App() {
  return (
    <Suspense fallback={<Page></Page>}>
      <Slider />
    </Suspense>
  );
}

export const ErrorBoundary = () => {
  return (
    <Error
      type={ErrorTypes.GENERAL}
      title="Dashboard Error"
      message="An error occurred while loading the dashboard."
      showHome={false}
      showRetry={true}
    />
  );
};

import { json } from "@remix-run/node";
import { Page } from "@shopify/polaris";
import { authenticate } from "../../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  return null;
};

export default function Auth() {
  return (
    <Page>
      <h1>You are being redirected to the Shopify login...</h1>
    </Page>
  );
}

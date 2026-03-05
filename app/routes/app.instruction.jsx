import { authenticate } from "../shopify.server.js";
import { Page } from "@shopify/polaris";
import storefront_added from "./images/instructions/added_to_storefront.png";
import storefront_add_section from "./images/instructions/storefront_add_section.png";
import storefront_add_app from "./images/instructions/storefront_add_app.png";
import storefront_app_fields from "./images/instructions/storefront_app_fields.png";
import storefront_display_single from "./images/instructions/storefront_field_entered.png";
import storefront_display_multiple from "./images/instructions/storefront_multiple_slides.png";
import storefront_showcasing_pointer from "./images/instructions/showcasing_pointer_tooltip.png";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

export default function HowToUsePage() {
  return (
    <Page title="How to Add Widgets to Your Storefront">
      <div
        style={{
          padding: "1rem",
          fontFamily: "Arial, sans-serif",
          lineHeight: "1.6",
        }}
      >
        <h2 style={{ color: "#0070f3", marginBottom: "1rem" }}>
          Step 1: Access the Online Store Editor
        </h2>
        <p style={{ fontSize: "1.1rem" }}>
          Navigate to your Shopify Admin, then go to
          <strong> Online Store &gt; Themes &gt; Customize</strong>.
        </p>
        <img
          src={storefront_add_section}
          alt="Access Online Store Editor"
          style={{
            width: "100%",
            marginBottom: "2rem",
            borderRadius: "8px",
            boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
          }}
          loading="lazy"
        />

        <h2 style={{ color: "#0070f3", margin: "1rem" }}>
          Step 2: Add the App Block
        </h2>
        <p style={{ marginBottom: "1.1rem" }}>
          In the editor, click on the desired section (e.g., homepage), then
          click **Add Block**. Look for the block named "
          <strong>TaggedBanner</strong>" and add it.
        </p>
        <img
          src={storefront_add_app}
          alt="Add App Block"
          style={{
            width: "100%",
            marginBottom: "1rem",
            borderRadius: "8px",
            boxShadow: "0 4px 8px rgba(0, 0, 0,0.1)",
          }}
          loading="lazy"
        />
        <img
          src={storefront_added}
          alt="Add App Block"
          style={{
            width: "100%",
            marginBottom: "1rem",
            borderRadius: "8px",
            boxShadow: "0 4px 8px rgba(0, 0, 0,0.1)",
          }}
          loading="lazy"
        />
        <img
          src={storefront_app_fields}
          alt="App Block Fields"
          style={{
            width: "100%",
            marginBottom: "1rem",
            borderRadius: "8px",
            boxShadow: "0 4px 8px rgba(0, 0, 0,0.1)",
          }}
          loading="lazy"
        />

        <h2 style={{ color: "#0070f3", marginBottom: "1rem" }}>
          Step 3: Customize and Save
        </h2>
        <p style={{ fontSize: "1.1rem" }}>
          After adding the block, customize its settings as needed, then click
          **Save** to apply the changes.
        </p>
        <img
          src={storefront_display_single}
          alt="Customize and Save Block"
          style={{
            width: "100%",
            marginBottom: "2rem",
            borderRadius: "8px",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
          }}
          loading="lazy"
        />

        <img
          src={storefront_showcasing_pointer}
          alt="Customize and Save Block"
          style={{
            width: "100%",
            marginBottom: "2rem",
            borderRadius: "8px",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
          }}
          loading="lazy"
        />

        <h2 style={{ color: "#0070f3", marginBottom: "1rem" }}>
          If adding multiple Slides
        </h2>

        <img
          src={storefront_display_multiple}
          alt="Display with Multiple Slides"
          style={{
            width: "100%",
            marginBottom: "2rem",
            borderRadius: "8px",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
          }}
          loading="lazy"
        />

        <h2 style={{ color: "#0070f3", marginBottom: "1rem" }}>
          Having Issues?
        </h2>
        <p style={{ fontSize: "1.1rem" }}>
          If you encounter any issues, please{" "}
          <a
            href="mailto:support@taggedbanner.com"
            style={{ color: "#0070f3", textDecoration: "none" }}
          >
            contact our support team
          </a>
          .
        </p>
      </div>
    </Page>
  );
}

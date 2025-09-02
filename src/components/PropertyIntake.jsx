import React, { useEffect, useState } from "react";
import Form from "@rjsf/core";
import validator from "@rjsf/validator-ajv8";
import schema from "./schema.json";
import uiSchema from "./uiSchema.json";

/** Field template to toggle aria-invalid on fields with errors */
function FieldTemplate(props) {
  const { children, rawErrors } = props;
  const hasError = Array.isArray(rawErrors) && rawErrors.length > 0;

  // Try to add aria-invalid to the rendered field control
  let content = children;
  if (React.isValidElement(children)) {
    content = React.cloneElement(children, {
      "aria-invalid": hasError ? true : undefined,
    });
  }

  return <div className="mb-4">{content}</div>;
}

export default function PropertyIntake() {
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error

  const handleSubmit = async ({ formData }) => {
    setStatus("submitting");
    try {
      const url = new URL(window.location.href);
      formData.meta = formData.meta || {};
      formData.meta.utm = {
        utm_source: url.searchParams.get("utm_source") || undefined,
        utm_medium: url.searchParams.get("utm_medium") || undefined,
        utm_campaign: url.searchParams.get("utm_campaign") || undefined,
        utm_term: url.searchParams.get("utm_term") || undefined,
        utm_content: url.searchParams.get("utm_content") || undefined,
      };

      const res = await fetch("/.netlify/functions/submit-property", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error(await res.text());
      setStatus("success");
    } catch (e) {
      console.error(e);
      setStatus("error");
    }
  };

  // Announce status changes
  useEffect(() => {
    const el = document.getElementById("intake-status");
    if (!el) return;
    if (status === "submitting") el.textContent = "Submitting your property…";
    else if (status === "success") el.textContent = "Submission received.";
    else if (status === "error") el.textContent = "Submission failed. Try again.";
    else el.textContent = "";
  }, [status]);

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">List Your Property</h1>

      <Form
        schema={schema}
        uiSchema={uiSchema}
        validator={validator}
        templates={{ FieldTemplate }}
        showErrorList={false}
        onSubmit={handleSubmit}
        // Inputs inherit focus styles via global.css (focus:ring-[color:var(--color-cta)])
        noHtml5Validate={false}
      >
        <div className="pt-2 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="btn-cta rounded-md"
            disabled={status === "submitting"}
          >
            {status === "submitting" ? "Submitting…" : "Submit"}
          </button>

          <button
            type="reset"
            className="btn-outline rounded-md"
            onClick={() => setStatus("idle")}
          >
            Reset
          </button>

          <a href="/" className="btn-outline rounded-md">
            Cancel
          </a>
        </div>
      </Form>

      {/* Live region for status updates */}
      <p id="intake-status" className="sr-only" aria-live="polite"></p>

      {status === "success" && (
        <p className="mt-3 text-green-700">
          Thanks! We’ve received your submission. We’ll reach out shortly.
        </p>
      )}
      {status === "error" && (
        <p className="mt-3 text-red-700">
          Sorry—something went wrong. Please try again.
        </p>
      )}
    </div>
  );
}

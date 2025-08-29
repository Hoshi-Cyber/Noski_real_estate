import React, { useState } from "react";
import Form from "@rjsf/core";
import validator from "@rjsf/validator-ajv8";
import schema from "./schema.json";
import uiSchema from "./uiSchema.json";

export default function PropertyIntake() {
  const [status, setStatus] = useState("idle");

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
        utm_content: url.searchParams.get("utm_content") || undefined
      };

      const res = await fetch("/.netlify/functions/submit-property", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error(await res.text());
      setStatus("success");
    } catch (e) {
      console.error(e);
      setStatus("error");
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">List Your Property</h1>
      <Form
        schema={schema}
        uiSchema={uiSchema}
        validator={validator}
        onSubmit={handleSubmit}
        showErrorList={false}
      >
        <button
          type="submit"
          className="mt-4 px-4 py-2 rounded bg-black text-white"
          disabled={status === "submitting"}
        >
          {status === "submitting" ? "Submitting..." : "Submit"}
        </button>
      </Form>

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

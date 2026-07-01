/**
 * Vintage64TX Contact Form Worker
 * Receives POST from contact.html, sends email via ForwardEmail API
 * Deploy as a new Worker named: vintage64tx-contact
 *
 * Required environment secret (set in Cloudflare dashboard):
 *   FORWARDEMAIL_API_KEY  — your ForwardEmail API key
 */

const ALLOWED_ORIGIN = "https://vintage64tx.com";
const TO_ADDRESS     = "dewayne@vintage64tx.com";
const FROM_ADDRESS   = "noreply@vintage64tx.com";
const FROM_NAME      = "Vintage64TX Contact Form";

// CORS headers returned on every response
function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

function jsonResponse(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(origin),
    },
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin),
      });
    }

    // Only accept POST
    if (request.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405, origin);
    }

    // Parse body
    let data;
    try {
      data = await request.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON" }, 400, origin);
    }

    const { first_name, last_name, email, service, message } = data;

    // Server-side validation
    if (!first_name || !last_name) {
      return jsonResponse({ error: "Name is required" }, 400, origin);
    }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRe.test(email)) {
      return jsonResponse({ error: "Valid email is required" }, 400, origin);
    }
    if (!service) {
      return jsonResponse({ error: "Service selection is required" }, 400, origin);
    }
    if (!message || message.trim().length < 10) {
      return jsonResponse({ error: "Message is too short" }, 400, origin);
    }

    // Build plain-text email body
    const emailBody = [
      "New contact form submission from vintage64tx.com",
      "─────────────────────────────────────────────",
      `Name:     ${first_name} ${last_name}`,
      `Email:    ${email}`,
      `Service:  ${service}`,
      "",
      "Message:",
      message.trim(),
      "─────────────────────────────────────────────",
      "Reply directly to this email to respond to the customer.",
    ].join("\n");

    // Send via ForwardEmail API
    // Docs: https://forwardemail.net/en/email-api
    const payload = {
      from: `${FROM_NAME} <${FROM_ADDRESS}>`,
      to: TO_ADDRESS,
      replyTo: `${first_name} ${last_name} <${email}>`,
      subject: `[Contact Form] ${service} — ${first_name} ${last_name}`,
      text: emailBody,
    };

    let apiResponse;
    try {
      apiResponse = await fetch("https://api.forwardemail.net/v1/emails", {
        method: "POST",
        headers: {
          "Authorization": `Basic ${btoa(env.FORWARDEMAIL_API_KEY + ":")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error("ForwardEmail fetch error:", err);
      return jsonResponse({ error: "Failed to reach email service" }, 502, origin);
    }

    if (!apiResponse.ok) {
      const errText = await apiResponse.text();
      console.error("ForwardEmail API error:", apiResponse.status, errText);
      return jsonResponse({ error: "Email service error" }, 502, origin);
    }

    return jsonResponse({ success: true }, 200, origin);
  },
};

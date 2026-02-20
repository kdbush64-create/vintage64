export async function onRequest(context) {
  const { request, env } = context;
  
  // 1. Dynamically identify the origin from the request
  const origin = request.headers.get("Origin") || "https://dashboard.vintage64tx.com";

  // 2. Handle Preflight (OPTIONS) Requests
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "0",
        "Vary": "Origin"
      },
    });
  }

  // 3. Main Logic for Data Requests
  const token = env.API_TOKEN; 
  const response = await fetch("https://api.cloudflare.com/client/v4/graphql", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      query: `query { viewer { zones(filter: { zoneTag: "69b08f8ce5cc1e1329d04c13a8981e97" }) { httpRequests1dGroups(filter: { date: "2026-02-20" }, limit: 1) { sum { requests } } } } }`
    })
  });

  const data = await response.json();

  // 4. Return data with dynamic headers and cache-busting
  return new Response(JSON.stringify(data), {
  headers: {
    "X-Debug-Version": "TEST_BUILD_V2", // Add this line
    "Access-Control-Allow-Origin": "*"  // Change to star for a quick test
  }
});

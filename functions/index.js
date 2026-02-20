export async function onRequest(context) {
  const { request, env } = context;

  // 1. Handle CORS Preflight (OPTIONS) Requests
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "0",
      },
    });
  }

  // 2. Fetch Data from Cloudflare API
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

  // 3. Return data with explicit Cache-Busting and Content-Type
  return new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Version": "TEST_BUILD_V2",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0"
    }
  });
}

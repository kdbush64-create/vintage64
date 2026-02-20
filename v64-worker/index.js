export default {
  async fetch(request, env, ctx) {
    // 1. Handle Preflight (OPTIONS) Requests
    // This answers the "Are you allowed to talk to me?" ping from your browser
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "https://dashboard.vintage64tx.com",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    // 2. Main Logic for Data Requests
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

    // 3. Return data with necessary headers to allow browser access
    return new Response(JSON.stringify(data), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'https://vintage64tx.com',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }
};

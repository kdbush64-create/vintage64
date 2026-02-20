export default {
  async fetch(request, env, ctx) {
    // This looks for the secret we will set in the Cloudflare Dashboard
    const token = env.API_TOKEN; 

    const response = await fetch("https://api.cloudflare.com/client/v4/graphql", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query: `query { viewer { zones(filter: { zoneTag: "YOUR_ZONE_TAG" }) { httpRequests1dGroups(filter: { date: "2026-02-20" }, limit: 1) { sum { requests } } } } }`
      })
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'https://vintage64tx.com'
      }
    });
  }
};

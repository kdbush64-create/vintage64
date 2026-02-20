// Vintage64TX_Telemetry_Bridge
const workerUrl = 'https://v64-analytics-proxy.kdbush64.workers.dev/';

async function updateTelemetry() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second timeout

    try {
        const response = await fetch(workerUrl, { signal: controller.signal });
        
        if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
        }

        const data = await response.json();
        const stats = data.data.viewer.zones[0].httpRequests1dGroups[0].sum;

        document.getElementById('site-status').textContent = "ONLINE_SECURE";
        document.getElementById('site-status').className = 'status-ok';
        document.getElementById('last-audit').textContent = new Date().toLocaleTimeString();
        document.getElementById('request-count').textContent = stats.requests.toLocaleString();
    } catch (e) {
        console.error("Telemetry Bridge Offline:", e);
        document.getElementById('site-status').textContent = "ERROR_OFFLINE";
        document.getElementById('site-status').className = 'status-err';
    } finally {
        clearTimeout(timeoutId);
    }
}

// Initialization
updateTelemetry();
setInterval(updateTelemetry, 60000);

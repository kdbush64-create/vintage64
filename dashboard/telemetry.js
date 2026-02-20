// Vintage64TX_Telemetry_Bridge
const workerUrl = 'https://v64-analytics-proxy.kdbush64.workers.dev/';

async function updateTelemetry() {
    try {
        const response = await fetch(workerUrl);
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
    }
}

// Initialization
updateTelemetry();
setInterval(updateTelemetry, 60000);

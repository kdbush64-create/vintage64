// Vintage64TX Telemetry Bridge
// Fetches analytics from the v64-analytics-proxy Worker (deployed separately)

const WORKER_URL = 'https://v64-analytics-proxy.kdbush64.workers.dev/';
const REFRESH_INTERVAL = 60000; // 60 seconds

function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function setStatus(id, text, cls) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
    el.className = cls;
}

async function updateTelemetry() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
        const response = await fetch(WORKER_URL, { signal: controller.signal });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();

        // Guard against malformed API response
        if (!data?.data?.viewer?.zones?.[0]) {
            throw new Error('Unexpected API response structure');
        }

        const zone = data.data.viewer.zones[0];
        const stats = zone.httpRequests1dGroups?.[0]?.sum;

        if (!stats) throw new Error('No stats returned');

        // Populate dashboard cards
        setStatus('site-status',    'ONLINE_SECURE',                         'status-ok');
        setStatus('request-count',  stats.requests?.toLocaleString() ?? '—', 'status-ok');
        setStatus('bandwidth',      formatBytes(stats.bytes ?? 0),            'status-ok');
        setStatus('cache-rate',     stats.cachedRequests && stats.requests
                                    ? Math.round((stats.cachedRequests / stats.requests) * 100) + '%'
                                    : '—',                                    'status-ok');
        setStatus('threats',        stats.threats?.toLocaleString() ?? '0',   'status-ok');
        setStatus('visitors',       stats.uniqIps?.toLocaleString() ?? '—',   'status-ok');

        const now = new Date();
        document.getElementById('last-audit').textContent   = now.toLocaleTimeString();
        document.getElementById('last-refresh').textContent = now.toLocaleString();

    } catch (e) {
        console.error('Telemetry Bridge Offline:', e.message);
        const ids = ['site-status', 'request-count', 'bandwidth', 'cache-rate', 'threats', 'visitors'];
        ids.forEach(id => setStatus(id, 'OFFLINE', 'status-err'));
        setStatus('site-status', 'ERROR_OFFLINE', 'status-err');
    } finally {
        clearTimeout(timeoutId);
    }
}

// Boot
updateTelemetry();
setInterval(updateTelemetry, REFRESH_INTERVAL);

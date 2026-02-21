// Vintage64TX Telemetry Bridge v2
// Fetches analytics from the v64-analytics-proxy Worker (deployed separately)
// Worker URL — only line that changes between clients:
const WORKER_URL = 'https://v64-analytics-proxy.kdbush64.workers.dev/';
const REFRESH_INTERVAL = 60000; // 60 seconds

// ── Formatters ──────────────────────────────────────────────────────────────
function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function pct(numerator, denominator) {
    if (!numerator || !denominator) return '—';
    return Math.round((numerator / denominator) * 100) + '%';
}

function setStatus(id, text, cls) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
    el.className = cls;
}

function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

// ── Country map helpers ──────────────────────────────────────────────────────
const COUNTRY_NAMES = {
    US:'United States', GB:'United Kingdom', CA:'Canada', AU:'Australia',
    DE:'Germany', FR:'France', NL:'Netherlands', IN:'India', CN:'China',
    BR:'Brazil', RU:'Russia', JP:'Japan', KR:'South Korea', MX:'Mexico',
    SG:'Singapore', IE:'Ireland', VN:'Vietnam', PL:'Poland', UA:'Ukraine',
    SE:'Sweden', NO:'Norway', FI:'Finland', DK:'Denmark', IT:'Italy',
    ES:'Spain', CH:'Switzerland', BG:'Bulgaria', HK:'Hong Kong', TW:'Taiwan',
    ZA:'South Africa', AR:'Argentina', CO:'Colombia', PH:'Philippines',
    ID:'Indonesia', TH:'Thailand', MY:'Malaysia', PK:'Pakistan', TR:'Turkey',
    EG:'Egypt', NG:'Nigeria', IL:'Israel', SA:'Saudi Arabia', AE:'UAE',
    T1:'Tor Network', XX:'Unknown'
};

function countryLabel(code) {
    return COUNTRY_NAMES[code] || code;
}

// Build the top-countries display string (top 5 by requests, formatted as list)
function buildCountryList(countryMap) {
    if (!countryMap || countryMap.length === 0) return '—';
    const sorted = [...countryMap]
        .sort((a, b) => b.requests - a.requests)
        .slice(0, 5);
    return sorted
        .map(c => `${countryLabel(c.clientCountryName)}: ${c.requests.toLocaleString()}`)
        .join(' | ');
}

// Build status code summary — group into 2xx / 3xx / 4xx / 5xx
function buildStatusSummary(statusMap) {
    if (!statusMap || statusMap.length === 0) return '—';
    const buckets = { '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0 };
    statusMap.forEach(s => {
        const code = s.edgeResponseStatus;
        if (code >= 200 && code < 300) buckets['2xx'] += s.requests;
        else if (code >= 300 && code < 400) buckets['3xx'] += s.requests;
        else if (code >= 400 && code < 500) buckets['4xx'] += s.requests;
        else if (code >= 500 && code < 600) buckets['5xx'] += s.requests;
    });
    return Object.entries(buckets)
        .filter(([, v]) => v > 0)
        .map(([k, v]) => `${k}: ${v.toLocaleString()}`)
        .join(' | ');
}

// Build 7-day totals by summing the daily rollup array
function build7DayTotals(week7d) {
    const totals = {
        requests: 0, pageViews: 0, bytes: 0,
        cachedRequests: 0, threats: 0, encryptedRequests: 0, uniques: 0
    };
    if (!week7d || week7d.length === 0) return totals;
    week7d.forEach(day => {
        totals.requests          += day.sum.requests          || 0;
        totals.pageViews         += day.sum.pageViews         || 0;
        totals.bytes             += day.sum.bytes             || 0;
        totals.cachedRequests    += day.sum.cachedRequests    || 0;
        totals.threats           += day.sum.threats           || 0;
        totals.encryptedRequests += day.sum.encryptedRequests || 0;
        totals.uniques           += day.uniq?.uniques         || 0;
    });
    return totals;
}

// ── Main fetch & populate ───────────────────────────────────────────────────
async function updateTelemetry() {
    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), 10000);

    try {
        const response = await fetch(WORKER_URL, { signal: controller.signal });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        if (!data?.data?.viewer?.zones?.[0]) {
            throw new Error('Unexpected API response structure');
        }

        const zone    = data.data.viewer.zones[0];
        const today   = zone.today1d?.[0];
        const week7d  = zone.week7d;

        if (!today) throw new Error('No daily stats returned');

        const sum   = today.sum;
        const uniq  = today.uniq;

        // ── SITE INTEGRITY ─────────────────────────────────────────────────
        setStatus('site-status', 'ONLINE_SECURE', 'status-ok');

        // ── TRAFFIC ────────────────────────────────────────────────────────
        setStatus('request-count',    sum.requests?.toLocaleString()          ?? '—', 'status-ok');
        setStatus('page-views',       sum.pageViews?.toLocaleString()         ?? '—', 'status-ok');
        setStatus('unique-visitors',  uniq?.uniques?.toLocaleString()         ?? '—', 'status-ok');

        // ── BANDWIDTH ──────────────────────────────────────────────────────
        setStatus('bandwidth',        formatBytes(sum.bytes        ?? 0),              'status-ok');
        setStatus('cached-bandwidth', formatBytes(sum.cachedBytes  ?? 0),              'status-ok');
        setStatus('cache-rate',       pct(sum.cachedRequests, sum.requests),           'status-ok');
        setStatus('uncached-bytes',   formatBytes((sum.bytes ?? 0) - (sum.cachedBytes ?? 0)), 'status-ok');

        // ── SECURITY ───────────────────────────────────────────────────────
        setStatus('threats',          sum.threats?.toLocaleString()           ?? '0',  'status-ok');
        setStatus('https-rate',       pct(sum.encryptedRequests, sum.requests),         'status-ok');
        setStatus('encrypted-bytes',  formatBytes(sum.encryptedBytes          ?? 0),   'status-ok');

        // ── RESPONSE CODES ─────────────────────────────────────────────────
        setStatus('response-codes',   buildStatusSummary(sum.responseStatusMap),        'status-ok');

        // Error rate: 4xx + 5xx / total
        const errors = (sum.responseStatusMap || [])
            .filter(s => s.edgeResponseStatus >= 400)
            .reduce((a, s) => a + s.requests, 0);
        setStatus('error-rate', pct(errors, sum.requests), errors > 0 ? 'status-warn' : 'status-ok');

        // ── GEO ────────────────────────────────────────────────────────────
        setStatus('top-countries',    buildCountryList(sum.countryMap),                 'status-ok');

        // Top threat country
        const threatCountry = (sum.countryMap || [])
            .filter(c => c.threats > 0)
            .sort((a, b) => b.threats - a.threats)[0];
        setStatus('threat-origin',
            threatCountry
                ? `${countryLabel(threatCountry.clientCountryName)} (${threatCountry.threats})`
                : 'None detected',
            threatCountry ? 'status-warn' : 'status-ok'
        );

        // ── 7-DAY TOTALS ───────────────────────────────────────────────────
        const w = build7DayTotals(week7d);
        setStatus('week-requests',    w.requests.toLocaleString(),                      'status-ok');
        setStatus('week-pageviews',   w.pageViews.toLocaleString(),                     'status-ok');
        setStatus('week-bandwidth',   formatBytes(w.bytes),                             'status-ok');
        setStatus('week-threats',     w.threats.toLocaleString(),                       'status-ok');
        setStatus('week-https-rate',  pct(w.encryptedRequests, w.requests),             'status-ok');

        // ── TIMESTAMPS ─────────────────────────────────────────────────────
        const now = new Date();
        document.getElementById('last-audit').textContent   = now.toLocaleTimeString();
        document.getElementById('last-refresh').textContent = now.toLocaleString();

    } catch (e) {
        console.error('Telemetry Bridge Offline:', e.message);
        const ids = [
            'site-status', 'request-count', 'page-views', 'unique-visitors',
            'bandwidth', 'cached-bandwidth', 'cache-rate', 'uncached-bytes',
            'threats', 'https-rate', 'encrypted-bytes',
            'response-codes', 'error-rate',
            'top-countries', 'threat-origin',
            'week-requests', 'week-pageviews', 'week-bandwidth',
            'week-threats', 'week-https-rate'
        ];
        ids.forEach(id => setStatus(id, 'OFFLINE', 'status-err'));
        setStatus('site-status', 'ERROR_OFFLINE', 'status-err');

    } finally {
        clearTimeout(timeoutId);
    }
}

// Boot
updateTelemetry();
setInterval(updateTelemetry, REFRESH_INTERVAL);

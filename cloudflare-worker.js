// CloudFlare Worker for Droplet Hibernation
// Version: 1.0
// Purpose: Wake up sleeping droplets and proxy requests seamlessly

// ========================
// CONFIGURATION
// ========================

const CONFIG = {
  DO_API_TOKEN: 'YOUR_DIGITALOCEAN_API_TOKEN',

  DROPLETS: {
    messenger: {
      id: 522123449,
      ip: '64.227.116.250',
      port: 80
    },
    turn: {
      id: 522123497,
      ip: '64.226.72.235',
      port: 3478
    }
  },

  WAKE_UP_TIMEOUT: 120000, // 2 minutes max wait
  HEALTH_CHECK_INTERVAL: 3000, // Check every 3 seconds
  MAX_HEALTH_CHECKS: 40, // Max 40 checks (2 minutes)

  CACHE_TTL: 10 // Cache status for 10 seconds
};

// ========================
// MAIN HANDLER
// ========================

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const startTime = Date.now();

  console.log(`[${new Date().toISOString()}] Request: ${request.method} ${url.pathname}`);

  try {
    // Determine target droplet
    const target = determineTarget(url);
    console.log(`Target droplet: ${target}`);

    // Special handling for TURN server (WebRTC)
    if (target === 'turn') {
      // TURN uses UDP/TCP on port 3478, not HTTP
      // We can only wake it up, not proxy
      const status = await getDropletStatus(target);
      if (status !== 'active') {
        await wakeUpDroplet(target);
        return createResponse(503, {
          error: 'TURN server is starting up',
          message: 'Please wait 15 seconds and reconnect',
          retry_after: 15
        });
      }
      // If active, return success (client will connect directly)
      return createResponse(200, {
        status: 'active',
        message: 'TURN server is ready',
        host: CONFIG.DROPLETS.turn.ip,
        port: CONFIG.DROPLETS.turn.port
      });
    }

    // Check droplet status (with cache)
    const status = await getDropletStatusCached(target);
    console.log(`Droplet ${target} status: ${status}`);

    // Handle different states
    if (status === 'off') {
      console.log(`Waking up ${target}...`);
      await wakeUpDroplet(target);

      // Wait for droplet to become active
      const ready = await waitForDropletReady(target);

      if (!ready) {
        return createLoadingResponse(request.url,
          'Server is taking longer than expected...',
          30);
      }

      // Droplet is ready, proxy the request
      return await proxyRequest(request, target);

    } else if (status === 'new') {
      // Just started, wait a bit more
      return createLoadingResponse(request.url,
        'Server is booting up...',
        10);

    } else if (status === 'active') {
      // Check if services are ready
      const healthy = await checkHealth(target);

      if (!healthy) {
        return createLoadingResponse(request.url,
          'Server is starting services...',
          5);
      }

      // Everything ready, proxy request
      return await proxyRequest(request, target);

    } else {
      // Unknown status
      return createResponse(503, {
        error: 'Server is in unexpected state',
        status: status,
        message: 'Please try again in a minute'
      });
    }

  } catch (error) {
    console.error('Error handling request:', error);
    return createResponse(500, {
      error: 'Internal server error',
      message: error.message,
      debug: error.stack
    });
  }
}

// ========================
// DROPLET MANAGEMENT
// ========================

function determineTarget(url) {
  const hostname = url.hostname.toLowerCase();
  const pathname = url.pathname.toLowerCase();

  // TURN server detection
  if (hostname.includes('turn') ||
      pathname.includes('/turn') ||
      url.port === '3478') {
    return 'turn';
  }

  // Default to messenger
  return 'messenger';
}

async function getDropletStatus(droplet) {
  const config = CONFIG.DROPLETS[droplet];

  try {
    const response = await fetch(
      `https://api.digitalocean.com/v2/droplets/${config.id}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${CONFIG.DO_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`DO API error: ${response.status}`);
    }

    const data = await response.json();
    return data.droplet.status;

  } catch (error) {
    console.error(`Failed to get status for ${droplet}:`, error);
    return 'unknown';
  }
}

async function getDropletStatusCached(droplet) {
  const cacheKey = `status:${droplet}`;

  // Try to get from cache
  const cached = await DROPLET_CACHE.get(cacheKey);
  if (cached) {
    console.log(`Cache hit for ${droplet}: ${cached}`);
    return cached;
  }

  // Get fresh status
  const status = await getDropletStatus(droplet);

  // Cache it
  await DROPLET_CACHE.put(cacheKey, status, {
    expirationTtl: CONFIG.CACHE_TTL
  });

  return status;
}

async function wakeUpDroplet(droplet) {
  const config = CONFIG.DROPLETS[droplet];

  console.log(`Sending power_on action to ${droplet} (ID: ${config.id})`);

  try {
    const response = await fetch(
      `https://api.digitalocean.com/v2/droplets/${config.id}/actions`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CONFIG.DO_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'power_on'
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error(`Failed to wake ${droplet}:`, error);
      return false;
    }

    const data = await response.json();
    console.log(`Wake action initiated for ${droplet}:`, data.action.id);

    // Clear cache
    await DROPLET_CACHE.delete(`status:${droplet}`);

    return true;

  } catch (error) {
    console.error(`Error waking ${droplet}:`, error);
    return false;
  }
}

async function waitForDropletReady(droplet) {
  console.log(`Waiting for ${droplet} to become ready...`);

  for (let i = 0; i < CONFIG.MAX_HEALTH_CHECKS; i++) {
    await sleep(CONFIG.HEALTH_CHECK_INTERVAL);

    const status = await getDropletStatus(droplet);
    console.log(`Check ${i + 1}/${CONFIG.MAX_HEALTH_CHECKS}: ${status}`);

    if (status === 'active') {
      // Droplet is active, check if services are ready
      const healthy = await checkHealth(droplet);
      if (healthy) {
        console.log(`${droplet} is ready after ${(i + 1) * CONFIG.HEALTH_CHECK_INTERVAL}ms`);
        return true;
      }
    }
  }

  console.log(`${droplet} did not become ready in time`);
  return false;
}

async function checkHealth(droplet) {
  const config = CONFIG.DROPLETS[droplet];

  // TURN server doesn't have HTTP health check
  if (droplet === 'turn') {
    return true;
  }

  try {
    const healthUrl = `http://${config.ip}/api/health`;
    console.log(`Health check: ${healthUrl}`);

    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'CloudFlare-Worker-HealthCheck'
      },
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });

    if (!response.ok) {
      console.log(`Health check failed: ${response.status}`);
      return false;
    }

    const data = await response.json();
    console.log(`Health check result:`, data);

    return data.status === 'ready';

  } catch (error) {
    console.log(`Health check error:`, error.message);
    return false;
  }
}

// ========================
// REQUEST PROXYING
// ========================

async function proxyRequest(request, droplet) {
  const config = CONFIG.DROPLETS[droplet];
  const url = new URL(request.url);

  // Modify URL to point to droplet
  url.hostname = config.ip;
  url.port = config.port;

  console.log(`Proxying to: ${url.toString()}`);

  // Create new request
  const modifiedRequest = new Request(url.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.body,
    redirect: 'follow'
  });

  // Add custom headers
  modifiedRequest.headers.set('X-Forwarded-For', request.headers.get('CF-Connecting-IP'));
  modifiedRequest.headers.set('X-Real-IP', request.headers.get('CF-Connecting-IP'));
  modifiedRequest.headers.set('X-Forwarded-Proto', url.protocol.replace(':', ''));

  try {
    const response = await fetch(modifiedRequest);

    // Clone response and add custom headers
    const modifiedResponse = new Response(response.body, response);
    modifiedResponse.headers.set('X-Droplet', droplet);
    modifiedResponse.headers.set('X-Served-By', 'CloudFlare-Worker');

    return modifiedResponse;

  } catch (error) {
    console.error(`Proxy error:`, error);
    return createResponse(502, {
      error: 'Bad Gateway',
      message: 'Failed to connect to server',
      droplet: droplet
    });
  }
}

// ========================
// RESPONSE HELPERS
// ========================

function createResponse(status, data) {
  return new Response(JSON.stringify(data, null, 2), {
    status: status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

function createLoadingResponse(originalUrl, message = 'Server is waking up...', refreshAfter = 15) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="refresh" content="${refreshAfter};url=${originalUrl}">
  <title>Starting Server...</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      color: white;
    }

    .container {
      text-align: center;
      padding: 40px;
      max-width: 600px;
    }

    .spinner {
      width: 80px;
      height: 80px;
      margin: 0 auto 40px;
      border: 8px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    h1 {
      font-size: 36px;
      font-weight: 700;
      margin-bottom: 16px;
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
    }

    p {
      font-size: 18px;
      opacity: 0.95;
      margin-bottom: 12px;
      line-height: 1.6;
    }

    .timer {
      font-size: 64px;
      font-weight: 700;
      margin-top: 32px;
      text-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }

    .info {
      margin-top: 32px;
      padding: 20px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      backdrop-filter: blur(10px);
    }

    .info p {
      font-size: 14px;
      opacity: 0.8;
    }

    .icon {
      font-size: 48px;
      margin-bottom: 24px;
      animation: float 3s ease-in-out infinite;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">🌙</div>
    <div class="spinner"></div>
    <h1>${message}</h1>
    <p>The server was sleeping to save resources</p>
    <p>It will be ready in about <strong>${refreshAfter} seconds</strong></p>
    <div class="timer" id="timer">${refreshAfter}</div>
    <div class="info">
      <p>💡 This page will automatically refresh when ready</p>
      <p>🌱 Eco-friendly: Saves energy when not in use</p>
    </div>
  </div>

  <script>
    let seconds = ${refreshAfter};
    const timerEl = document.getElementById('timer');

    const countdown = setInterval(() => {
      seconds--;
      if (seconds >= 0) {
        timerEl.textContent = seconds;
      } else {
        timerEl.textContent = '0';
        clearInterval(countdown);
      }
    }, 1000);

    // Ping server to check if ready sooner
    const checkInterval = setInterval(async () => {
      try {
        const response = await fetch('${originalUrl}', {
          method: 'HEAD',
          cache: 'no-store'
        });
        if (response.ok) {
          clearInterval(checkInterval);
          clearInterval(countdown);
          timerEl.textContent = '✓';
          window.location.href = '${originalUrl}';
        }
      } catch (e) {
        // Server not ready yet
      }
    }, 2000);
  </script>
</body>
</html>`;

  return new Response(html, {
    status: 503,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Retry-After': String(refreshAfter)
    }
  });
}

// ========================
// UTILITIES
// ========================

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ========================
// KV NAMESPACE (for caching)
// Note: You need to bind a KV namespace called "DROPLET_CACHE" in CloudFlare dashboard
// ========================

// Mock KV if not available (for testing)
if (typeof DROPLET_CACHE === 'undefined') {
  global.DROPLET_CACHE = {
    cache: new Map(),
    async get(key) {
      return this.cache.get(key);
    },
    async put(key, value, options) {
      this.cache.set(key, value);
      if (options?.expirationTtl) {
        setTimeout(() => this.cache.delete(key), options.expirationTtl * 1000);
      }
    },
    async delete(key) {
      this.cache.delete(key);
    }
  };
}

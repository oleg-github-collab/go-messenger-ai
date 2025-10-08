// Railway Hibernation Proxy Server
// Purpose: Wake up sleeping DigitalOcean droplets and proxy requests
// Deploy on Railway.app - Always-on proxy

const express = require('express');
const axios = require('axios');
const NodeCache = require('node-cache');
const http = require('http');
const httpProxy = require('http-proxy');

const app = express();
const server = http.createServer(app);

// Create HTTP proxy for WebSocket support
const proxy = httpProxy.createProxyServer({
  ws: true,
  secure: false,  // Accept self-signed certs
  changeOrigin: true
});

// Middleware - use raw for proxying, but save original buffer
app.use((req, res, next) => {
  let data = '';
  req.on('data', chunk => { data += chunk; });
  req.on('end', () => {
    req.rawBody = data;
    next();
  });
});

const cache = new NodeCache({ stdTTL: 10 }); // 10 second cache

// ========================
// CONFIGURATION
// ========================

const CONFIG = {
  DO_API_TOKEN: process.env.DO_API_TOKEN || 'your_digitalocean_api_token_here',

  DROPLETS: {
    messenger: {
      id: 522123497,
      ip: '64.227.116.250',
      port: 443,
      protocol: 'https',
      healthPath: '/api/health'
    },
    turn: {
      id: 522123449,
      ip: '64.226.72.235',
      port: 443,
      protocol: 'https',
      healthPath: '/health' // TURN server health check
    }
  },

  WAKE_UP_TIMEOUT: 120000, // 2 minutes max wait
  HEALTH_CHECK_INTERVAL: 3000, // Check every 3 seconds
  MAX_HEALTH_CHECKS: 40, // Max 40 checks

  PORT: process.env.PORT || 3000,

  // Target domain to droplet mapping
  DOMAIN_MAPPING: {
    'messenger.kaminskyi.chat': 'messenger',
    'turn.kaminskyi.chat': 'turn'
  }
};

// ========================
// DIGITALOCEAN API
// ========================

async function getDropletStatus(dropletId) {
  const cacheKey = `status_${dropletId}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    console.log(`📦 Cache hit for droplet ${dropletId}: ${cached}`);
    return cached;
  }

  try {
    const response = await axios.get(
      `https://api.digitalocean.com/v2/droplets/${dropletId}`,
      {
        headers: {
          'Authorization': `Bearer ${CONFIG.DO_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const status = response.data.droplet.status;
    cache.set(cacheKey, status);
    console.log(`✅ Droplet ${dropletId} status: ${status}`);
    return status;
  } catch (error) {
    console.error(`❌ Error getting droplet status:`, error.message);
    return 'unknown';
  }
}

async function wakeUpDroplet(dropletId) {
  console.log(`🌅 Sending wake-up command to droplet ${dropletId}`);

  try {
    const response = await axios.post(
      `https://api.digitalocean.com/v2/droplets/${dropletId}/actions`,
      { type: 'power_on' },
      {
        headers: {
          'Authorization': `Bearer ${CONFIG.DO_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const actionId = response.data.action.id;
    console.log(`✅ Wake-up command sent. Action ID: ${actionId}`);
    return actionId;
  } catch (error) {
    console.error(`❌ Error waking droplet:`, error.message);
    throw error;
  }
}

async function checkHealth(dropletConfig) {
  try {
    const protocol = dropletConfig.protocol || 'http';
    const healthUrl = `${protocol}://${dropletConfig.ip}:${dropletConfig.port}${dropletConfig.healthPath}`;
    console.log(`🏥 Health check: ${healthUrl}`);

    const response = await axios.get(healthUrl, {
      timeout: 5000,
      httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false }), // Accept self-signed certs
      validateStatus: (status) => status === 200
    });

    if (response.data && response.data.status === 'ready') {
      console.log(`✅ Health check passed`);
      return true;
    }

    console.log(`⏳ Health check: service starting...`);
    return false;
  } catch (error) {
    console.log(`❌ Health check failed: ${error.message}`);
    return false;
  }
}

async function waitForDropletReady(dropletConfig, maxWaitMs = 120000) {
  const startTime = Date.now();
  const maxChecks = Math.floor(maxWaitMs / CONFIG.HEALTH_CHECK_INTERVAL);

  console.log(`⏰ Waiting for droplet to be ready (max ${maxWaitMs}ms)`);

  for (let i = 0; i < maxChecks; i++) {
    const elapsed = Date.now() - startTime;

    // First check if droplet is "active" status
    const status = await getDropletStatus(dropletConfig.id);

    if (status === 'active') {
      // Droplet is active, now check health
      const healthy = await checkHealth(dropletConfig);

      if (healthy) {
        console.log(`✅ Droplet ready in ${elapsed}ms`);
        return true;
      }
    }

    console.log(`⏳ Waiting... (${i + 1}/${maxChecks}) - Status: ${status}`);
    await new Promise(resolve => setTimeout(resolve, CONFIG.HEALTH_CHECK_INTERVAL));
  }

  console.log(`⏱️ Timeout waiting for droplet`);
  return false;
}

// ========================
// PROXY HANDLERS
// ========================

async function proxyRequest(req, res, dropletConfig) {
  const protocol = dropletConfig.protocol || 'http';
  const targetUrl = `${protocol}://${dropletConfig.ip}:${dropletConfig.port}${req.url}`;

  console.log(`🔄 Proxying: ${req.method} ${targetUrl}`);
  console.log(`📦 Content-Type: ${req.get('content-type') || 'none'}`);
  console.log(`📏 Body size: ${req.rawBody ? req.rawBody.length : 0} bytes`);

  try {
    const response = await axios({
      method: req.method,
      url: targetUrl,
      headers: {
        ...req.headers,
        host: dropletConfig.ip,
        'x-forwarded-for': req.ip,
        'x-forwarded-proto': req.protocol,
        'x-real-ip': req.ip
      },
      data: req.rawBody || '',
      responseType: 'stream',
      httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false }), // Accept self-signed certs
      validateStatus: () => true, // Accept any status
      timeout: 30000,
      maxRedirects: 5
    });

    console.log(`✅ Response status: ${response.status}`);

    // Copy headers
    Object.keys(response.headers).forEach(key => {
      res.setHeader(key, response.headers[key]);
    });

    res.status(response.status);
    response.data.pipe(res);

  } catch (error) {
    console.error(`❌ Proxy error:`, error.message);
    console.error(`❌ Error code:`, error.code);
    console.error(`❌ Error stack:`, error.stack);
    res.status(502).send('Bad Gateway - Droplet unreachable');
  }
}

function sendLoadingPage(res, targetName, estimatedSeconds = 20) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Retry-After', Math.max(estimatedSeconds, 10));
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(503).send(`
<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Запуск сервера...</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .container {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            padding: 60px 40px;
            max-width: 500px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            text-align: center;
        }

        .spinner {
            width: 80px;
            height: 80px;
            margin: 0 auto 30px;
            border: 6px solid rgba(102, 126, 234, 0.2);
            border-top-color: #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        h1 {
            color: #2d3748;
            font-size: 28px;
            margin-bottom: 15px;
            font-weight: 700;
        }

        .subtitle {
            color: #718096;
            font-size: 16px;
            margin-bottom: 30px;
            line-height: 1.6;
        }

        .countdown {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 25px;
        }

        .countdown-number {
            font-size: 48px;
            font-weight: 700;
            margin-bottom: 5px;
        }

        .countdown-label {
            font-size: 14px;
            opacity: 0.9;
        }

        .progress-bar {
            width: 100%;
            height: 6px;
            background: rgba(102, 126, 234, 0.2);
            border-radius: 3px;
            overflow: hidden;
            margin-bottom: 20px;
        }

        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
            animation: progress ${estimatedSeconds}s linear;
            transform-origin: left;
        }

        @keyframes progress {
            from { transform: scaleX(0); }
            to { transform: scaleX(1); }
        }

        .info {
            background: #f7fafc;
            border-left: 4px solid #667eea;
            padding: 15px;
            text-align: left;
            border-radius: 6px;
            font-size: 14px;
            color: #4a5568;
            line-height: 1.6;
        }

        .info strong {
            color: #2d3748;
        }

        @media (max-width: 480px) {
            .container {
                padding: 40px 25px;
            }

            h1 {
                font-size: 24px;
            }

            .countdown-number {
                font-size: 36px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="spinner"></div>
        <h1>🚀 Запуск сервера</h1>
        <p class="subtitle">Сервер "${targetName}" зараз запускається. Це займе близько ${estimatedSeconds} секунд.</p>

        <div class="countdown">
            <div class="countdown-number" id="countdown">${estimatedSeconds}</div>
            <div class="countdown-label">секунд до готовності</div>
        </div>

        <div class="progress-bar">
            <div class="progress-fill"></div>
        </div>

        <div class="info">
            <strong>💡 Що відбувається?</strong><br>
            Для економії ресурсів сервер автоматично вимикається після періоду неактивності.
            Зараз він запускається спеціально для вас. Це відбудеться лише раз, далі сайт буде працювати швидко.
        </div>
    </div>

    <script>
        let seconds = ${estimatedSeconds};
        const countdownEl = document.getElementById('countdown');

        const timer = setInterval(() => {
            seconds--;
            countdownEl.textContent = seconds;

            if (seconds <= 0) {
                clearInterval(timer);
                countdownEl.textContent = '✓';
                // Try to reload
                setTimeout(() => location.reload(), 1000);
            }
        }, 1000);

        // Health check polling
        let healthCheckAttempts = 0;
        const maxHealthChecks = 40;

        const healthCheck = setInterval(async () => {
            healthCheckAttempts++;

            try {
                const response = await fetch(window.location.href, {
                    method: 'HEAD',
                    cache: 'no-cache'
                });

                if (response.status === 200) {
                    clearInterval(healthCheck);
                    clearInterval(timer);
                    location.reload();
                }
            } catch (e) {
                // Still waiting...
            }

            if (healthCheckAttempts >= maxHealthChecks) {
                clearInterval(healthCheck);
            }
        }, 3000);
    </script>
</body>
</html>
  `);
}

// ========================
// MAIN REQUEST HANDLER
// ========================

async function handleDropletRequest(req, res, targetName) {
  const dropletConfig = CONFIG.DROPLETS[targetName];

  if (!dropletConfig) {
    return res.status(404).send('Droplet configuration not found');
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📥 Request to ${targetName}: ${req.method} ${req.url}`);
  console.log(`🌍 Client IP: ${req.ip}`);

  try {
    // Check droplet status
    const status = await getDropletStatus(dropletConfig.id);
    console.log(`📊 Droplet status: ${status}`);

    if (status === 'off') {
      console.log(`💤 Droplet is sleeping, waking up...`);

      // Send loading page immediately
      sendLoadingPage(res, targetName, 20);

      // Wake up droplet in background
      await wakeUpDroplet(dropletConfig.id);

      // Wait for ready
      const ready = await waitForDropletReady(dropletConfig, CONFIG.WAKE_UP_TIMEOUT);

      if (!ready) {
        console.error(`⏱️ Timeout waiting for droplet to be ready`);
      }

      return;
    }

    if (status === 'active') {
      // Droplet is active - just proxy the request
      // Health check is optional - let nginx/app handle errors
      console.log(`✅ Droplet active, proxying request`);
      return await proxyRequest(req, res, dropletConfig);
    }

    // Status is "new" or other - show loading page
    console.log(`⏳ Droplet status: ${status}, showing loading page`);
    return sendLoadingPage(res, targetName, 15);

  } catch (error) {
    console.error(`❌ Error handling request:`, error.message);
    res.status(500).send('Internal Server Error');
  }
}

// ========================
// EXPRESS ROUTES
// ========================

// Health check for Railway
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'hibernation-proxy',
    timestamp: Date.now(),
    uptime: process.uptime()
  });
});

// Proxy all requests
app.all('*', async (req, res) => {
  const host = req.get('host') || '';
  const targetName = CONFIG.DOMAIN_MAPPING[host];

  console.log(`\n🌐 Incoming request:`);
  console.log(`   Host header: ${host}`);
  console.log(`   Target: ${targetName || 'default (messenger)'}`);
  console.log(`   Method: ${req.method}`);
  console.log(`   Path: ${req.url}`);

  if (!targetName) {
    // Default to messenger if domain not recognized
    console.log(`⚠️  Domain not in mapping, defaulting to messenger`);
    return handleDropletRequest(req, res, 'messenger');
  }

  return handleDropletRequest(req, res, targetName);
});

// ========================
// WEBSOCKET UPGRADE HANDLER
// ========================

server.on('upgrade', async (req, socket, head) => {
  const host = req.headers.host || '';
  const targetName = CONFIG.DOMAIN_MAPPING[host] || 'messenger';
  const dropletConfig = CONFIG.DROPLETS[targetName];

  console.log(`\n🔌 WebSocket upgrade request:`);
  console.log(`   Host: ${host}`);
  console.log(`   Target: ${targetName}`);
  console.log(`   Path: ${req.url}`);

  if (!dropletConfig) {
    console.error(`❌ No droplet config for: ${targetName}`);
    socket.destroy();
    return;
  }

  try {
    // Check if droplet is active
    const status = await getDropletStatus(dropletConfig.id);
    console.log(`📊 Droplet status for WebSocket: ${status}`);

    if (status === 'off') {
      console.log(`💤 Droplet sleeping, waking up for WebSocket...`);
      await wakeUpDroplet(dropletConfig.id);
      await waitForDropletReady(dropletConfig, CONFIG.WAKE_UP_TIMEOUT);
    }

    // Proxy WebSocket connection
    const protocol = dropletConfig.protocol || 'http';
    const wsProtocol = protocol === 'https' ? 'wss' : 'ws';
    const target = `${wsProtocol}://${dropletConfig.ip}:${dropletConfig.port}`;

    console.log(`🔄 Proxying WebSocket to: ${target}${req.url}`);

    proxy.ws(req, socket, head, {
      target: target,
      secure: false,
      ws: true
    });

  } catch (error) {
    console.error(`❌ WebSocket upgrade error:`, error.message);
    socket.destroy();
  }
});

// Handle proxy errors
proxy.on('error', (err, req, res) => {
  console.error('❌ Proxy error:', err.message);
  if (res && res.writeHead) {
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('Bad Gateway - Proxy Error');
  }
});

// ========================
// START SERVER
// ========================

server.listen(CONFIG.PORT, () => {
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 Hibernation Proxy Server Started
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 Port: ${CONFIG.PORT}
🌐 Domain Mapping:
   - messenger.kaminskyi.chat → Droplet ${CONFIG.DROPLETS.messenger.id}
   - turn.kaminskyi.chat → Droplet ${CONFIG.DROPLETS.turn.id}
💾 Cache TTL: ${cache.options.stdTTL} seconds
⏱️  Wake timeout: ${CONFIG.WAKE_UP_TIMEOUT}ms
🔌 WebSocket: Enabled
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

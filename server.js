const express = require('express');
const path = require('path');
const TrafficGenerator = require('./trafficGenerator.js');
const ProxyScraper = require('./proxyScraper.js');

const app = express();
const PORT = process.env.PORT || 3000;

// Enhanced middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static('public', {
  maxAge: '1d',
  etag: false
}));

const trafficBot = new TrafficGenerator();

// Auto-loop configuration
let autoLoopConfig = {
    enabled: false,
    interval: 30 * 60 * 1000,
    maxSessions: 5,
    targetUrl: '',
    proxySource: 'auto'
};

let autoLoopInterval = null;

// 🆕 NEW ENDPOINT: Get Web Proxies
app.get('/api/web-proxies', async (req, res) => {
    try {
        const proxyScraper = new ProxyScraper();
        const webProxies = await proxyScraper.getWebProxies(10);
        
        res.json({
            success: true,
            webProxies: webProxies,
            count: webProxies.length,
            message: `✅ ${webProxies.length} web proxies gratis tersedia`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 🆕 NEW ENDPOINT: Test Web Proxy
app.post('/api/test-web-proxy', async (req, res) => {
    try {
        const { webProxyUrl, testUrl } = req.body;
        
        if (!webProxyUrl) {
            return res.status(400).json({
                success: false,
                error: 'Web proxy URL diperlukan'
            });
        }

        const puppeteer = require('puppeteer-extra');
        const StealthPlugin = require('puppeteer-extra-plugin-stealth');
        puppeteer.use(StealthPlugin());

        const browser = await puppeteer.launch({ 
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null,
            timeout: 60000
        });
        
        const page = await browser.newPage();
        
        // Setup no interception
        await page.setRequestInterception(false);
        
        let success = false;
        let errorMessage = '';
        
        try {
            // Navigate ke web proxy
            await page.goto(webProxyUrl, {
                waitUntil: 'domcontentloaded',
                timeout: 30000
            });
            
            await page.waitForTimeout(5000);
            
            // Coba isi form jika testUrl provided
            if (testUrl) {
                const filled = await page.evaluate((url) => {
                    const inputSelectors = [
                        'input[type="url"]', 'input[name="url"]', 'input[placeholder*="URL"]',
                        '#url', '.url-input', 'input.form-control'
                    ];
                    
                    for (const selector of inputSelectors) {
                        const input = document.querySelector(selector);
                        if (input) {
                            input.value = url;
                            input.dispatchEvent(new Event('input', { bubbles: true }));
                            
                            // Coba submit
                            const submitSelectors = [
                                'button[type="submit"]', 'input[type="submit"]',
                                'button:contains("Go")', '.btn-primary'
                            ];
                            
                            for (const btnSelector of submitSelectors) {
                                if (btnSelector.includes('contains')) {
                                    const text = btnSelector.split('contains("')[1].split('")')[0];
                                    const buttons = document.querySelectorAll('button');
                                    for (const btn of buttons) {
                                        if (btn.textContent.includes(text)) {
                                            btn.click();
                                            return true;
                                        }
                                    }
                                } else {
                                    const btn = document.querySelector(btnSelector);
                                    if (btn) {
                                        btn.click();
                                        return true;
                                    }
                                }
                            }
                            
                            // Fallback: press Enter
                            input.dispatchEvent(new KeyboardEvent('keydown', { 
                                key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true 
                            }));
                            return true;
                        }
                    }
                    return false;
                }, testUrl);
                
                if (filled) {
                    await page.waitForTimeout(10000);
                    success = true;
                }
            } else {
                success = true; // Berhasil load web proxy
            }
            
        } catch (error) {
            errorMessage = error.message;
            success = false;
        }
        
        await browser.close();
        
        res.json({
            success: true,
            testResult: {
                webProxyUrl: webProxyUrl,
                accessible: success,
                error: errorMessage,
                worksWithForm: testUrl ? success : 'not_tested'
            },
            message: success ? '✅ Web proxy dapat diakses' : '❌ Web proxy tidak dapat diakses'
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 🆕 NEW ENDPOINT: Get Proxy Statistics
app.get('/api/proxy-stats', (req, res) => {
    try {
        const proxyStatus = trafficBot.getProxyStatus();
        const proxyHandler = trafficBot.proxyHandler;
        const stats = proxyHandler.getStats();
        
        res.json({
            success: true,
            stats: {
                totalProxies: proxyStatus.totalActive,
                ipProxies: proxyStatus.ipProxies,
                webProxies: proxyStatus.webProxies,
                qualityProxies: proxyStatus.qualityProxies,
                requests: stats.requests,
                webProxies: stats.webProxyDetails
            },
            message: `📊 Proxy Statistics: ${stats.ipProxies} IP + ${stats.webProxies} Web proxies`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Enhanced Health Check
app.get('/health', async (req, res) => {
    try {
        const puppeteer = require('puppeteer-extra');
        const StealthPlugin = require('puppeteer-extra-plugin-stealth');
        puppeteer.use(StealthPlugin());

        const browser = await puppeteer.launch({ 
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null,
            timeout: 180000
        });
        
        const version = await browser.version();
        await browser.close();

        const proxyStatus = trafficBot.getProxyStatus();
        
        res.status(200).json({ 
            status: 'OK', 
            timestamp: new Date().toISOString(),
            service: 'Advanced Traffic Bot - WEB PROXY SUPPORT',
            version: '4.5.0',
            puppeteer: {
                status: 'WORKING',
                version: version
            },
            proxies: {
                total: proxyStatus.totalActive,
                ipProxies: proxyStatus.ipProxies,
                webProxies: proxyStatus.webProxies,
                quality: proxyStatus.qualityProxies
            },
            features: [
                '🌐 WEB PROXY SUPPORT',
                '🔀 Mixed Proxy Selection',
                '🚫 NO RESOURCE BLOCKING',
                '🎯 Enhanced Ad Detection'
            ]
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'ERROR', 
            error: 'Puppeteer test failed',
            message: error.message
        });
    }
});

// Enhanced Start Session Endpoint (mendukung web proxy)
app.post('/api/start-session', async (req, res) => {
    try {
        console.log('📦 Received start session request:', {
            targetUrl: req.body.targetUrl ? '***' : 'missing',
            proxySource: req.body.proxySource
        });

        const { targetUrl, profiles, deviceType, proxySource, proxies, proxyCount, autoLoop } = req.body;
        
        if (!targetUrl) {
            return res.status(400).json({ 
                success: false, 
                error: 'Target URL wajib diisi' 
            });
        }

        try {
            new URL(targetUrl);
        } catch (e) {
            return res.status(400).json({ 
                success: false, 
                error: 'Format URL tidak valid' 
            });
        }

        const config = {
            targetUrl,
            profileCount: parseInt(profiles) || 1,
            deviceType: deviceType || 'desktop',
            proxySource: proxySource || 'auto', // 🆕 default ke auto (IP + Web)
            proxyList: proxies || [],
            proxyCount: parseInt(proxyCount) || 5,
            isAutoLoop: autoLoop || false
        };

        console.log('🚀 Starting session with config:', {
            targetUrl: config.targetUrl,
            proxySource: config.proxySource,
            profileCount: config.profileCount
        });

        const sessionId = await trafficBot.startNewSession(config);
        
        res.json({ 
            success: true, 
            sessionId,
            message: 'Session started dengan WEB PROXY SUPPORT',
            details: {
                sessionId,
                targetUrl: config.targetUrl,
                profiles: config.profileCount,
                deviceType: config.deviceType,
                proxySource: config.proxySource,
                features: [
                    '🌐 Web Proxy Support',
                    '🔀 Mixed Proxy Selection',
                    '🚫 No Resource Blocking',
                    '🎯 Enhanced Ad Detection'
                ]
            }
        });
    } catch (error) {
        console.error('❌ Session creation error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message
        });
    }
});

// Endpoint lainnya tetap sama seperti sebelumnya
app.get('/api/auto-loop/status', (req, res) => {
    try {
        const sessions = trafficBot.getAllSessions();
        const activeSessions = sessions.filter(s => s.status === 'running').length;
        
        res.json({
            success: true,
            activeSessions,
            totalSessions: sessions.length,
            config: autoLoopConfig,
            timestamp: new Date().toISOString(),
            features: '🌐 WEB PROXY SUPPORT - Mixed Proxy Selection'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.post('/api/auto-loop/start', (req, res) => {
    try {
        const { interval, maxSessions, targetUrl, proxySource, proxies, proxyCount } = req.body;
        
        if (!targetUrl) {
            return res.status(400).json({
                success: false,
                error: 'Target URL wajib diisi untuk auto-loop'
            });
        }

        autoLoopConfig = {
            enabled: true,
            interval: interval || 30 * 60 * 1000,
            maxSessions: maxSessions || 5,
            targetUrl: targetUrl,
            proxySource: proxySource || 'auto', // 🆕 default ke auto
            proxyList: proxies || [],
            proxyCount: proxyCount || 5
        };

        if (autoLoopInterval) {
            clearInterval(autoLoopInterval);
        }

        autoLoopInterval = setInterval(async () => {
            if (!autoLoopConfig.enabled) return;
            
            const sessions = trafficBot.getAllSessions();
            const runningSessions = sessions.filter(s => s.status === 'running').length;
            
            if (runningSessions < autoLoopConfig.maxSessions) {
                try {
                    const config = {
                        targetUrl: autoLoopConfig.targetUrl,
                        profileCount: 1,
                        deviceType: Math.random() > 0.5 ? 'desktop' : 'mobile',
                        proxySource: autoLoopConfig.proxySource,
                        proxyList: autoLoopConfig.proxyList,
                        proxyCount: autoLoopConfig.proxyCount,
                        isAutoLoop: true
                    };
                    
                    await trafficBot.startNewSession(config);
                    console.log(`🔄 Auto-loop: Started new session dengan ${config.proxySource} proxy`);
                } catch (error) {
                    console.error('❌ Auto-loop error:', error.message);
                }
            }
        }, autoLoopConfig.interval);

        res.json({ 
            success: true, 
            message: `Auto-loop started dengan ${autoLoopConfig.proxySource} proxy`,
            config: autoLoopConfig
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

app.post('/api/auto-loop/stop', (req, res) => {
    try {
        autoLoopConfig.enabled = false;
        if (autoLoopInterval) {
            clearInterval(autoLoopInterval);
            autoLoopInterval = null;
        }
        
        trafficBot.stopAllSessions();
        
        res.json({ 
            success: true, 
            message: 'Auto-loop stopped'
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Enhanced Monitoring Endpoints
app.get('/api/all-sessions', (req, res) => {
    try {
        const sessions = trafficBot.getAllSessions();
        
        res.json({ 
            success: true, 
            sessions,
            timestamp: new Date().toISOString(),
            totalCount: sessions.length,
            features: '🌐 WEB PROXY SUPPORT'
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

app.get('/api/session-logs/:sessionId', (req, res) => {
    try {
        const logs = trafficBot.getSessionLogs(req.params.sessionId);
        
        res.json({ 
            success: true, 
            logs,
            sessionId: req.params.sessionId,
            logCount: logs.length
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

app.post('/api/stop-session/:sessionId', (req, res) => {
    try {
        trafficBot.stopSession(req.params.sessionId);
        res.json({ 
            success: true, 
            message: 'Session stopped'
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

app.post('/api/stop-all-sessions', (req, res) => {
    try {
        trafficBot.stopAllSessions();
        res.json({ 
            success: true, 
            message: 'All sessions stopped'
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

app.post('/api/clear-sessions', (req, res) => {
    try {
        trafficBot.clearAllSessions();
        res.json({ 
            success: true, 
            message: 'All sessions cleared'
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Enhanced System Info
app.get('/api/system-info', (req, res) => {
    try {
        const proxyStatus = trafficBot.getProxyStatus();
        const sessions = trafficBot.getAllSessions();
        
        res.json({
            success: true,
            system: {
                version: '4.5.0',
                mode: '🌐 WEB PROXY SUPPORT + Mixed Proxy Selection'
            },
            currentStatus: {
                activeSessions: sessions.filter(s => s.status === 'running').length,
                totalSessions: sessions.length,
                ipProxies: proxyStatus.ipProxies,
                webProxies: proxyStatus.webProxies,
                qualityProxies: proxyStatus.qualityProxies
            },
            configuration: {
                proxySelection: '60% IP + 40% Web Proxy',
                requestInterception: 'DISABLED',
                resourceBlocking: 'DISABLED'
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/monitoring', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'monitoring.html'));
});

// 404 Handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        availableEndpoints: [
            'GET  /health',
            'GET  /api/web-proxies',
            'POST /api/test-web-proxy',
            'GET  /api/proxy-stats',
            'POST /api/start-session',
            'GET  /api/auto-loop/status',
            'POST /api/auto-loop/start', 
            'POST /api/auto-loop/stop',
            'GET  /api/all-sessions',
            'GET  /api/session-logs/:sessionId',
            'GET  /api/system-info'
        ]
    });
});

// Global Error Handler
app.use((error, req, res, next) => {
    console.error('🚨 Global error handler:', error);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
    });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('🔄 Received SIGTERM, shutting down gracefully...');
    trafficBot.stopAllSessions();
    if (autoLoopInterval) {
        clearInterval(autoLoopInterval);
    }
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('🔄 Received SIGINT, shutting down gracefully...');
    trafficBot.stopAllSessions();
    if (autoLoopInterval) {
        clearInterval(autoLoopInterval);
    }
    process.exit(0);
});

// Start Server
app.listen(PORT, () => {
    console.log(`\n🚀 Advanced Traffic Bot Server v4.5.0 - WEB PROXY SUPPORT`);
    console.log(`🌐 http://localhost:${PORT}`);
    console.log(`⚡ Mode: MIXED PROXY (IP + Web) - No Resource Blocking`);
    console.log(`🎯 Fitur Baru:`);
    console.log(`   ✅ Web Proxy Gratis Support`);
    console.log(`   🔀 Mixed Proxy Selection (60% IP + 40% Web)`);
    console.log(`   🌐 Auto Web Proxy Navigation`);
    console.log(`   📊 Enhanced Proxy Statistics`);
    console.log(`🏗️ Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`💾 Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB\n`);
});

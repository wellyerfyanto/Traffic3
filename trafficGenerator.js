const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const ProxyHandler = require('./proxyHandler.js');
const ProxyScraper = require('./proxyScraper.js');

puppeteer.use(StealthPlugin());

class TrafficGenerator {
  constructor() {
    this.activeSessions = new Map();
    this.sessionLogs = new Map();
    this.proxyHandler = new ProxyHandler();
    this.proxyScraper = new ProxyScraper();
    this.autoRestartEnabled = true;
    
    // ✅ ENHANCED CONFIGURATION - No Blocking
    this.iterationConfig = {
      minIterations: 3,
      maxIterations: 5,
      adPageMultiplier: 2.0,
      baseInteractionTime: 1.5,
      viewableMinTime: 5000,
      scrollDwellTime: 4000,
      minPageReadTime: 25000,
      maxPageReadTime: 60000,
      adLoadingWait: 15000,
      networkIdleWait: 10000
    };
    
    // 🎯 EXTENDED USER AGENTS 2025
    this.userAgents = {
      desktop: [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
      ],
      mobile: [
        'Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Mobile Safari/537.36',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Mobile Safari/537.36'
      ]
    };

    // 🎯 ENHANCED BEHAVIOR PATTERNS
    this.sessionPatterns = {
      FAST_READER: { multiplier: 0.9, description: "Pembaca cepat" },
      NORMAL_READER: { multiplier: 1.2, description: "Pembaca normal" },
      SLOW_READER: { multiplier: 1.5, description: "Pembaca lambat" },
      DETAILED_READER: { multiplier: 1.8, description: "Pembaca detail" }
    };

    // 🎯 EXTENDED AD DOMAINS - No Blocking
    this.adDomains = [
      'googleads', 'doubleclick', 'googlesyndication', 'google-analytics',
      'adsystem', 'amazon-adsystem', 'facebook.com/tr', 'fbcdn',
      'adnxs', 'rubiconproject', 'pubmatic', 'openx', 'criteo'
    ];

    // ✅ PROXY QUALITY MANAGEMENT
    this.proxyQuality = new Map();

    // 🆕 WEB PROXY CONFIGURATION
    this.webProxyConfig = {
      navigationTimeout: 120000,
      waitAfterLoad: 10000,
      retryCount: 2,
      formSelectors: [
        'input[type="url"]', 'input[name="url"]', 'input[placeholder*="URL"]',
        'input[placeholder*="url"]', 'input[placeholder*="Enter"]', '#url',
        '.url-input', 'input.form-control', 'input#search', 'input[class*="url"]'
      ],
      buttonSelectors: [
        'button[type="submit"]', 'input[type="submit"]', 'button:contains("Go")',
        'button:contains("GO")', 'button:contains("Browse")', 'button:contains("BROWSE")',
        'button:contains("Visit")', '.btn-primary', '.btn-success', '.submit-btn'
      ]
    };
  }

  // 🎯 ENHANCED BROWSER LAUNCH - No Resource Blocking
  async launchBrowser(config, proxyInfo) {
    console.log('🚀 Launching browser dengan NO RESOURCE BLOCKING...');
    
    const args = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--disable-web-security',
      '--disable-features=SitePerProcess',
      '--disable-blink-features=AutomationControlled',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-features=VizDisplayCompositor',
      '--disable-ipc-flooding-protection',
      '--aggressive-cache-discard',
      '--disable-application-cache',
      '--disable-offline-load-stale-cache',
      '--disk-cache-size=0'
    ];

    // 🆕 TAMBAH PROXY SERVER ARGS JIKA IP PROXY
    if (proxyInfo && proxyInfo.type === 'ip') {
      args.push(`--proxy-server=${this.formatProxyForBrowser(proxyInfo.url)}`);
    }

    const launchOptions = {
      headless: "new",
      args: args,
      ignoreHTTPSErrors: true,
      timeout: 180000,
      protocolTimeout: 180000
    };

    // ✅ Gunakan environment Chromium jika tersedia
    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
      launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
      console.log('🔧 Using system Chromium:', process.env.PUPPETEER_EXECUTABLE_PATH);
    }

    try {
      const browser = await puppeteer.launch(launchOptions);
      console.log('✅ Browser launched dengan NO RESOURCE BLOCKING');
      return browser;
    } catch (error) {
      console.error('❌ Browser launch failed:', error.message);
      throw error;
    }
  }

  // 🆕 NEW METHOD: Navigate using Web Proxy
  async navigateWithWebProxy(page, targetUrl, sessionId, webProxyUrl) {
    this.log(sessionId, 'WEB_PROXY_NAVIGATION', `Menggunakan web proxy: ${webProxyUrl} untuk target: ${targetUrl}`);
    
    try {
      // Navigate ke web proxy
      await page.goto(webProxyUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 45000
      });
      
      this.log(sessionId, 'WEB_PROXY_LOADED', 'Web proxy berhasil dimuat, mengisi form target URL...');
      
      // Tunggu sebentar untuk memastikan web proxy fully loaded
      await this.waitForTimeout(5000);
      
      // Coba temukan input field untuk URL dan isi dengan target URL
      const navigationSuccess = await page.evaluate((targetUrl) => {
        try {
          // Coba berbagai selector input URL yang umum di web proxy
          const inputSelectors = [
            'input[type="url"]',
            'input[name="url"]',
            'input[placeholder*="URL"]',
            'input[placeholder*="url"]',
            'input[placeholder*="Enter"]',
            '#url',
            '.url-input',
            'input.form-control',
            'input#search',
            'input[class*="url"]'
          ];
          
          let inputField = null;
          for (const selector of inputSelectors) {
            const element = document.querySelector(selector);
            if (element && element.offsetParent !== null) {
              inputField = element;
              break;
            }
          }
          
          if (inputField) {
            // Clear field dan isi dengan target URL
            inputField.value = targetUrl;
            
            // Trigger events
            inputField.dispatchEvent(new Event('input', { bubbles: true }));
            inputField.dispatchEvent(new Event('change', { bubbles: true }));
            
            // Cari tombol submit/go/browse
            const buttonSelectors = [
              'button[type="submit"]',
              'input[type="submit"]',
              'button:contains("Go")',
              'button:contains("GO")',
              'button:contains("Browse")',
              'button:contains("BROWSE")',
              'button:contains("Visit")',
              '.btn-primary',
              '.btn-success',
              '.submit-btn'
            ];
            
            let submitButton = null;
            for (const selector of buttonSelectors) {
              if (selector.includes('contains')) {
                const text = selector.split('contains("')[1].split('")')[0];
                const buttons = document.querySelectorAll('button');
                for (const btn of buttons) {
                  if (btn.textContent.includes(text)) {
                    submitButton = btn;
                    break;
                  }
                }
              } else {
                const element = document.querySelector(selector);
                if (element && element.offsetParent !== null) {
                  submitButton = element;
                  break;
                }
              }
              if (submitButton) break;
            }
            
            if (submitButton) {
              submitButton.click();
              return true;
            } else {
              // Jika tidak ada tombol, coba tekan Enter
              inputField.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
              return true;
            }
          }
          
          return false;
        } catch (e) {
          console.error('Error dalam web proxy navigation:', e);
          return false;
        }
      }, targetUrl);
      
      if (navigationSuccess) {
        this.log(sessionId, 'WEB_PROXY_SUBMITTED', 'Target URL berhasil disubmit ke web proxy, menunggu redirect...');
        
        // Tunggu redirect dan loading
        await this.waitForTimeout(15000);
        
        // Check jika kita sudah di target URL
        const currentUrl = page.url();
        if (currentUrl.includes(targetUrl.replace('https://', '').replace('http://', ''))) {
          this.log(sessionId, 'WEB_PROXY_SUCCESS', 'Berhasil mencapai target URL melalui web proxy!');
          return true;
        } else {
          this.log(sessionId, 'WEB_PROXY_PARTIAL', 'Masih di web proxy, tetapi melanjutkan dengan session...');
          return true; // Tetap lanjut meskipun tidak redirect sempurna
        }
      } else {
        this.log(sessionId, 'WEB_PROXY_MANUAL', 'Tidak bisa mengisi form web proxy otomatis, menggunakan fallback...');
        // Fallback: langsung inject JavaScript untuk redirect
        await page.evaluate((targetUrl) => {
          window.location.href = targetUrl;
        }, targetUrl);
        
        await this.waitForTimeout(10000);
        return true;
      }
      
    } catch (error) {
      this.log(sessionId, 'WEB_PROXY_ERROR', `Error menggunakan web proxy: ${error.message}`);
      return false;
    }
  }

  // 🆕 NEW METHOD: Enhanced Proxy Selection dengan Web Proxy Support
  getEnhancedProxy(sessionId) {
    const proxies = this.proxyHandler.getAllProxiesDetailed();
    
    if (proxies.total === 0) {
      this.log(sessionId, 'NO_PROXIES_AVAILABLE', 'Tidak ada proxy yang tersedia (IP atau Web)');
      return null;
    }
    
    // Prioritaskan berdasarkan kualitas
    const qualityProxies = [];
    const allProxies = [];
    
    // Tambahkan IP proxies dengan quality data
    proxies.ipProxies.forEach(proxy => {
      const qualityData = this.proxyQuality.get(proxy.url);
      if (qualityData && ['EXCELLENT', 'GOOD', 'FAIR'].includes(qualityData.quality)) {
        qualityProxies.push({
          type: 'ip',
          url: proxy.url,
          quality: qualityData.quality,
          loadTime: qualityData.loadTime
        });
      }
      allProxies.push({
        type: 'ip', 
        url: proxy.url,
        quality: qualityData?.quality || 'UNKNOWN'
      });
    });
    
    // Tambahkan web proxies
    proxies.webProxies.forEach(webProxy => {
      allProxies.push({
        type: 'web',
        url: webProxy.url,
        name: webProxy.name,
        quality: 'WEB_PROXY'
      });
    });
    
    // Prioritaskan quality proxies terlebih dahulu
    if (qualityProxies.length > 0) {
      const selected = qualityProxies[Math.floor(Math.random() * qualityProxies.length)];
      this.log(sessionId, 'QUALITY_PROXY_SELECTED', `Menggunakan quality ${selected.quality} proxy: ${selected.url}`);
      return selected;
    }
    
    // Fallback ke random proxy (60% IP, 40% Web)
    const useWebProxy = Math.random() < 0.4 && proxies.webProxies.length > 0;
    
    if (useWebProxy) {
      const webProxy = proxies.webProxies[Math.floor(Math.random() * proxies.webProxies.length)];
      this.log(sessionId, 'WEB_PROXY_SELECTED', `Menggunakan web proxy: ${webProxy.name} (${webProxy.url})`);
      return {
        type: 'web',
        url: webProxy.url,
        name: webProxy.name,
        quality: 'WEB_PROXY'
      };
    } else if (proxies.ipProxies.length > 0) {
      const ipProxy = proxies.ipProxies[Math.floor(Math.random() * proxies.ipProxies.length)];
      this.log(sessionId, 'IP_PROXY_SELECTED', `Menggunakan IP proxy: ${ipProxy.url}`);
      return {
        type: 'ip',
        url: ipProxy.url,
        quality: 'UNKNOWN'
      };
    }
    
    // Final fallback ke web proxy jika ada
    if (proxies.webProxies.length > 0) {
      const webProxy = proxies.webProxies[Math.floor(Math.random() * proxies.webProxies.length)];
      this.log(sessionId, 'FALLBACK_WEB_PROXY', `Fallback ke web proxy: ${webProxy.name}`);
      return {
        type: 'web',
        url: webProxy.url,
        name: webProxy.name,
        quality: 'WEB_PROXY'
      };
    }
    
    return null;
  }

  // 🆕 UPDATE METHOD: Enhanced Navigation dengan Web Proxy Support
  async navigateWithRetry(page, url, sessionId, maxRetries = 3) {
    const currentProxy = this.getEnhancedProxy(sessionId);
    
    if (!currentProxy) {
      throw new Error('Tidak ada proxy yang tersedia untuk navigasi');
    }
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.log(sessionId, 'NAVIGATION_ATTEMPT', `Navigasi attempt ${attempt}/${maxRetries} dengan ${currentProxy.type} proxy`);
        
        if (currentProxy.type === 'web') {
          // Gunakan web proxy navigation
          const success = await this.navigateWithWebProxy(page, url, sessionId, currentProxy.url);
          if (success) {
            this.log(sessionId, 'WEB_PROXY_NAV_SUCCESS', 'Navigasi dengan web proxy berhasil');
            
            // Extended wait untuk ads loading
            await this.waitForTimeout(8000);
            await this.triggerLazyLoadAds(page, sessionId);
            await this.waitForTimeout(7000);
            
            await this.checkResourceStatus(page, sessionId);
            return true;
          } else {
            throw new Error('Web proxy navigation failed');
          }
        } else {
          // Gunakan IP proxy navigation (existing method)
          await page.goto(url, { 
            waitUntil: ['domcontentloaded', 'networkidle2'],
            timeout: 60000
          });
          
          // Extended wait untuk ads loading
          await this.waitForTimeout(8000);
          await this.triggerLazyLoadAds(page, sessionId);
          await this.waitForTimeout(7000);
          
          await this.checkResourceStatus(page, sessionId);
          this.log(sessionId, 'NAVIGATION_SUCCESS', 'Berhasil navigasi dengan extended ad loading');
          return true;
        }
        
      } catch (error) {
        this.log(sessionId, 'NAVIGATION_RETRY', 
          `Attempt ${attempt}/${maxRetries} gagal: ${error.message}`);
        
        // Mark proxy sebagai failed
        if (currentProxy.url) {
          this.markProxyFailed(currentProxy.url, sessionId);
          this.proxyHandler.removeFailedProxy(currentProxy.url);
        }
        
        if (attempt < maxRetries) {
          const retryDelay = 10000 + (Math.random() * 5000);
          this.log(sessionId, 'NAVIGATION_RETRY_DELAY', `⏳ Tunggu ${Math.round(retryDelay/1000)}s sebelum retry...`);
          await this.waitForTimeout(retryDelay);
        } else {
          this.log(sessionId, 'NAVIGATION_FINAL_FAIL', `Navigasi gagal setelah ${maxRetries} attempts`);
          return false;
        }
      }
    }
  }

  // 🆕 NEW METHOD: Setup NO INTERCEPTION - Allow All Resources
  async setupNoInterception(page, sessionId) {
    this.log(sessionId, 'NO_INTERCEPTION_MODE', '🔓 SEMUA resource diizinkan - Tidak ada blocking');
    
    // ✅ TIDAK ADA request interception - biarkan semua load
    await page.setRequestInterception(false);
    
    // ✅ Hanya monitor responses untuk tracking
    page.on('response', (response) => {
      const url = response.url();
      const resourceType = response.request().resourceType();
      const status = response.status();
      
      // Log untuk ad-related requests
      if (this.isAdDomain(url)) {
        this.log(sessionId, 'AD_RESOURCE_LOADED', 
          `📡 ${resourceType.toUpperCase()} loaded: ${status} - ${url.substring(0, 80)}...`);
      }
    });

    this.log(sessionId, 'INTERCEPTION_DISABLED', '✅ Semua resource (stylesheet, images, scripts) diizinkan loading');
    return Promise.resolve();
  }

  // 🎯 ENHANCED SESSION EXECUTION - No Blocking
  async executeSession(sessionId, config) {
    let browser;
    let currentProxy = null;
    let page = null;
    
    try {
      currentProxy = this.getEnhancedProxy(sessionId);
      if (!currentProxy) {
        throw new Error('Tidak ada proxy berkualitas yang tersedia');
      }

      this.log(sessionId, 'PROXY_SELECTED', `Menggunakan ${currentProxy.type} proxy: ${currentProxy.url}`);

      this.log(sessionId, 'STEP_1', 'Meluncurkan browser dengan NO RESOURCE BLOCKING...');
      browser = await this.launchBrowser(config, currentProxy);
      
      page = await browser.newPage();
      
      // ✅ INCREASED TIMEOUTS
      page.setDefaultTimeout(120000);
      page.setDefaultNavigationTimeout(150000);

      // Set user agent
      const userAgent = this.getRandomUserAgent(config.deviceType);
      await page.setUserAgent(userAgent);
      
      // ✅ SET HEADERS UNTUK BETTER AD LOADING
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Cache-Control': 'no-cache'
      });
      
      const browserInfo = this.extractBrowserInfo(userAgent);
      this.log(sessionId, 'USER_AGENT_SET', `Menggunakan ${browserInfo}`);
      
      await page.setViewport({ 
        width: config.deviceType === 'mobile' ? 375 : 1280, 
        height: config.deviceType === 'mobile' ? 667 : 720 
      });

      // ✅ GUNAKAN NO INTERCEPTION - Allow semua resources
      await this.setupNoInterception(page, sessionId);

      this.log(sessionId, 'STEP_1_COMPLETE', 'Browser berhasil diluncurkan - SEMUA resource diizinkan');

      this.log(sessionId, 'STEP_2', `Navigasi ke: ${config.targetUrl}`);
      
      try {
        const navSuccess = await this.navigateWithRetry(page, config.targetUrl, sessionId);
        
        if (!navSuccess) {
          this.log(sessionId, 'NAVIGATION_PARTIAL', '⚠️ Navigasi memiliki issues, tetapi melanjutkan...');
        }

        this.log(sessionId, 'STEP_2_COMPLETE', 'Navigasi completed dengan extended ad loading');

        // ✅ EXTENDED WAIT FOR COMPLETE AD RENDERING
        this.log(sessionId, 'FINAL_AD_WAIT', '⏳ Menunggu FINAL untuk ad rendering complete...');
        await this.waitForTimeout(10000);

        // ✅ FINAL RESOURCE CHECK
        await this.checkResourceStatus(page, sessionId);

        await this.executeAllSteps(page, sessionId, config);

        this.markProxySuccess(currentProxy.url, sessionId);
        this.proxyHandler.markProxySuccess(currentProxy.url);

        this.log(sessionId, 'SESSION_COMPLETED', 'Semua langkah berhasil - NO RESOURCE BLOCKING');

      } catch (navError) {
        this.log(sessionId, 'NAVIGATION_ERROR', `Navigasi gagal: ${navError.message}`);
        await this.executeAllSteps(page, sessionId, config);
      }

    } catch (error) {
      this.log(sessionId, 'EXECUTION_ERROR', `Error selama eksekusi: ${error.message}`);
      if (currentProxy) {
        this.markProxyFailed(currentProxy.url, sessionId);
        this.proxyHandler.removeFailedProxy(currentProxy.url);
      }
      throw error;
    } finally {
      if (browser) {
        try {
          await browser.close();
          this.log(sessionId, 'BROWSER_CLOSED', 'Browser ditutup');
        } catch (closeError) {
          this.log(sessionId, 'BROWSER_CLOSE_ERROR', `Error menutup browser: ${closeError.message}`);
        }
      }
    }
  }

  // 🎯 PROXY QUALITY TESTING FUNCTION
  async testProxyQuality(proxyUrl, sessionId) {
    let testBrowser = null;
    try {
        this.log(sessionId, 'PROXY_QUALITY_TEST', `Testing proxy quality: ${proxyUrl}`);
        
        const testArgs = [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            `--proxy-server=${this.formatProxyForBrowser(proxyUrl)}`,
            '--disable-dev-shm-usage'
        ];

        testBrowser = await puppeteer.launch({
            headless: "new",
            args: testArgs,
            timeout: 45000,
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null
        });

        const page = await testBrowser.newPage();
        page.setDefaultTimeout(30000);
        
        const startTime = Date.now();
        
        await page.goto('https://httpbin.org/ip', { 
            waitUntil: 'domcontentloaded',
            timeout: 25000 
        });
        
        const loadTime = Date.now() - startTime;
        
        let quality = 'UNKNOWN';
        if (loadTime < 8000) quality = 'EXCELLENT';
        else if (loadTime < 15000) quality = 'GOOD';
        else if (loadTime < 25000) quality = 'FAIR';
        else quality = 'POOR';

        this.log(sessionId, 'PROXY_QUALITY_RESULT', 
            `Proxy ${proxyUrl} - Quality: ${quality} (Load time: ${loadTime}ms)`);

        this.proxyQuality.set(proxyUrl, {
            quality: quality,
            loadTime: loadTime,
            lastTested: Date.now(),
            successCount: (this.proxyQuality.get(proxyUrl)?.successCount || 0) + 1
        });

        return quality;

    } catch (error) {
        this.log(sessionId, 'PROXY_QUALITY_FAILED', `Proxy test failed: ${error.message}`);
        
        this.proxyQuality.set(proxyUrl, {
            quality: 'FAILED',
            loadTime: 0,
            lastTested: Date.now(),
            failCount: (this.proxyQuality.get(proxyUrl)?.failCount || 0) + 1
        });

        return 'FAILED';
    } finally {
        if (testBrowser) {
            try {
                await testBrowser.close();
            } catch (closeError) {}
        }
    }
  }

  // 🎯 NEW: MARK PROXY SUCCESS
  markProxySuccess(proxyUrl, sessionId) {
    const qualityData = this.proxyQuality.get(proxyUrl) || {};
    qualityData.successCount = (qualityData.successCount || 0) + 1;
    qualityData.lastSuccess = Date.now();
    this.proxyQuality.set(proxyUrl, qualityData);
    
    this.log(sessionId, 'PROXY_SUCCESS', `Proxy ${proxyUrl} marked as successful`);
  }

  // 🎯 NEW: MARK PROXY FAILED
  markProxyFailed(proxyUrl, sessionId) {
    const qualityData = this.proxyQuality.get(proxyUrl) || {};
    qualityData.failCount = (qualityData.failCount || 0) + 1;
    qualityData.lastFail = Date.now();
    this.proxyQuality.set(proxyUrl, qualityData);
    
    this.log(sessionId, 'PROXY_FAILED', `Proxy ${proxyUrl} marked as failed`);
  }

  // 🎯 FIXED WAIT FUNCTION
  async waitForTimeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 🎯 UTILITY METHODS
  getRandomUserAgent(deviceType) {
    const agents = this.userAgents[deviceType] || this.userAgents.desktop;
    return agents[Math.floor(Math.random() * agents.length)];
  }

  extractBrowserInfo(userAgent) {
    if (userAgent.includes('Chrome/')) {
      return userAgent.includes('Mobile') ? 'Chrome Mobile' : 'Chrome Desktop';
    } else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome/')) {
      return userAgent.includes('Mobile') ? 'Safari Mobile' : 'Safari Desktop';
    } else if (userAgent.includes('Firefox/')) {
      return userAgent.includes('Mobile') ? 'Firefox Mobile' : 'Firefox Desktop';
    }
    return 'Unknown Browser';
  }

  isAdDomain(url) {
    return this.adDomains.some(domain => url.toLowerCase().includes(domain.toLowerCase()));
  }

  formatProxyForBrowser(proxyUrl) {
    if (proxyUrl.includes('://')) {
      const urlParts = proxyUrl.split('://');
      return urlParts[1];
    }
    return proxyUrl;
  }

  log(sessionId, step, message) {
    const timestamp = new Date().toLocaleString('id-ID');
    const logEntry = { timestamp, step, message };
    
    if (this.sessionLogs.has(sessionId)) {
      this.sessionLogs.get(sessionId).push(logEntry);
    }
    
    const logMessage = `[${sessionId}] ${step}: ${message}`;
    if (step.includes('ERROR') || step.includes('FAILED')) {
      console.error('❌', logMessage);
    } else if (step.includes('WARNING')) {
      console.warn('⚠️', logMessage);
    } else if (step.includes('WEB_PROXY')) {
      console.log('🌐', logMessage);
    } else {
      console.log('✅', logMessage);
    }
  }

  getSessionLogs(sessionId) {
    return this.sessionLogs.get(sessionId) || [];
  }

  getAllSessions() {
    const sessions = [];
    for (const [sessionId, session] of this.activeSessions) {
      sessions.push({
        id: sessionId,
        status: session.status,
        startTime: session.startTime,
        config: session.config,
        proxyCount: session.proxyList ? session.proxyList.length : 0
      });
    }
    return sessions;
  }

  stopSession(sessionId) {
    if (this.activeSessions.has(sessionId)) {
      this.activeSessions.get(sessionId).status = 'stopped';
      this.log(sessionId, 'SESSION_STOPPED', 'Session dihentikan');
    }
  }

  stopAllSessions() {
    for (const [sessionId] of this.activeSessions) {
      this.stopSession(sessionId);
    }
    this.log('SYSTEM', 'ALL_SESSIONS_STOPPED', 'Semua sessions dihentikan');
  }

  clearAllSessions() {
    this.activeSessions.clear();
    this.sessionLogs.clear();
    this.log('SYSTEM', 'ALL_SESSIONS_CLEARED', 'Semua sessions dan logs dihapus');
  }

  getProxyStatus() {
    const stats = this.proxyHandler.getStats();
    return {
      totalActive: stats.total,
      qualityProxies: Array.from(this.proxyQuality.entries()).filter(([_, data]) => 
        ['EXCELLENT', 'GOOD', 'FAIR'].includes(data.quality)
      ).length,
      ipProxies: stats.ipProxies,
      webProxies: stats.webProxies,
      message: `🔧 Proxy system: ${stats.ipProxies} IP + ${stats.webProxies} Web proxies`
    };
  }

  // 🎯 SESSION MANAGEMENT
  async startNewSession(config) {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.log(sessionId, 'SESSION_INIT', 'Menginisialisasi session baru dengan NO RESOURCE BLOCKING...');
    
    let proxyList = [];
    
    if (config.proxySource === 'auto') {
      this.log(sessionId, 'PROXY_AUTO', 'Mengambil proxy gratis otomatis (IP + Web)...');
      
      try {
        const proxyCount = config.proxyCount || 5;
        proxyList = await this.proxyScraper.getAllProxiesMixed(proxyCount);
        
        if (proxyList.length > 0) {
          this.proxyHandler.addMultipleProxies(proxyList);
          
          // ✅ TEST PROXY QUALITY untuk IP proxies
          for (const proxy of proxyList) {
            if (proxy.type === 'ip') {
              await this.testProxyQuality(proxy.url, sessionId);
            }
          }
          
          this.log(sessionId, 'PROXY_AUTO_SUCCESS', `Berhasil mendapatkan ${proxyList.length} proxy (IP + Web)`);
        } else {
          throw new Error('Tidak ada proxy yang berhasil diambil');
        }
      } catch (error) {
        this.log(sessionId, 'PROXY_AUTO_ERROR', `Gagal: ${error.message}`);
        // Fallback ke backup proxies
        proxyList = [
          ...this.proxyScraper.getBackupProxies().map(proxy => ({ url: `http://${proxy}`, type: 'ip' })),
          ...this.proxyScraper.getBackupWebProxies()
        ];
        this.proxyHandler.addMultipleProxies(proxyList);
        this.log(sessionId, 'PROXY_BACKUP_USED', `Menggunakan ${proxyList.length} backup proxy (IP + Web)`);
      }
    }
    else if (config.proxySource === 'web') {
      this.log(sessionId, 'PROXY_WEB', 'Mengambil web proxy gratis...');
      
      try {
        const webProxies = await this.proxyScraper.getWebProxies(10);
        if (webProxies.length > 0) {
          proxyList = webProxies;
          this.proxyHandler.addMultipleProxies(proxyList);
          this.log(sessionId, 'PROXY_WEB_SUCCESS', `Berhasil mendapatkan ${webProxies.length} web proxy`);
        } else {
          throw new Error('Tidak ada web proxy yang berhasil diambil');
        }
      } catch (error) {
        this.log(sessionId, 'PROXY_WEB_ERROR', `Gagal: ${error.message}`);
        // Fallback ke backup web proxies
        proxyList = this.proxyScraper.getBackupWebProxies();
        this.proxyHandler.addMultipleProxies(proxyList);
        this.log(sessionId, 'PROXY_WEB_BACKUP', `Menggunakan ${proxyList.length} backup web proxy`);
      }
    }
    else if (config.proxySource === 'manual' && config.proxyList && config.proxyList.length > 0) {
      this.log(sessionId, 'PROXY_MANUAL', `Memproses ${config.proxyList.length} proxy manual...`);
      
      const validProxies = config.proxyList.filter(proxy => proxy && proxy.trim() !== '');
      
      if (validProxies.length > 0) {
        const manualProxies = validProxies.map(proxy => ({ url: proxy, type: 'ip' }));
        this.proxyHandler.addMultipleProxies(manualProxies);
        proxyList = manualProxies;
        this.log(sessionId, 'PROXY_MANUAL_SUCCESS', `${validProxies.length} proxy manual ditambahkan`);
      } else {
        throw new Error('Tidak ada proxy manual yang valid');
      }
    }
    else {
      throw new Error('Proxy wajib digunakan');
    }

    if (proxyList.length === 0) {
      throw new Error('Tidak ada proxy yang tersedia');
    }

    this.sessionLogs.set(sessionId, []);
    this.activeSessions.set(sessionId, {
      id: sessionId,
      config: config,
      status: 'running',
      startTime: new Date(),
      proxyList: proxyList
    });

    this.log(sessionId, 'SESSION_STARTED', 
      `Session dimulai dengan ${proxyList.length} proxy menargetkan: ${config.targetUrl}`);
    
    this.executeSessionWithRetry(sessionId, config).catch(error => {
      this.log(sessionId, 'SESSION_ERROR', `Session gagal: ${error.message}`);
      this.stopSession(sessionId);
    });

    return sessionId;
  }

  async executeSessionWithRetry(sessionId, config, retryCount = 0) {
    const maxRetries = 2;
    
    try {
      await this.executeSession(sessionId, config);
    } catch (error) {
      if (retryCount < maxRetries) {
        this.log(sessionId, 'SESSION_RETRY', `Mencoba lagi... (${retryCount + 1}/${maxRetries})`);
        await this.waitForTimeout(8000);
        await this.executeSessionWithRetry(sessionId, config, retryCount + 1);
      } else {
        this.log(sessionId, 'SESSION_FAILED', `Session gagal setelah ${retryCount + 1} percobaan`);
        this.stopSession(sessionId);
      }
    }
  }

  // 🎯 ENHANCED MAIN EXECUTION
  async executeAllSteps(page, sessionId, config) {
    const pattern = this.getSessionPattern(sessionId);
    this.log(sessionId, 'SESSION_PATTERN', `Pattern: ${pattern.description}`);

    const iterationCount = Math.floor(Math.random() * 
      (this.iterationConfig.maxIterations - this.iterationConfig.minIterations + 1)) + 
      this.iterationConfig.minIterations;
    
    this.log(sessionId, 'ITERATION_SETUP', `Akan melakukan ${iterationCount} iterasi`);

    for (let iteration = 1; iteration <= iterationCount; iteration++) {
      this.log(sessionId, `ITERATION_${iteration}_START`, `🎯 Memulai iterasi ${iteration}/${iterationCount}`);
      
      // Simulasi reading behavior
      await this.waitForTimeout(10000 + Math.random() * 15000);
      
      // Scroll behavior
      await this.humanScroll(page, sessionId);
      
      this.log(sessionId, `ITERATION_${iteration}_COMPLETE`, `✅ Iterasi ${iteration} selesai`);
    }

    this.log(sessionId, 'ALL_ITERATIONS_COMPLETED', `🎉 Semua ${iterationCount} iterasi selesai!`);
  }

  // 🎯 HUMAN SCROLL
  async humanScroll(page, sessionId) {
    const scrollSteps = [300, 600, 900, 1200];
    let currentPosition = 0;
    
    for (const targetPosition of scrollSteps) {
      const scrollDistance = targetPosition - currentPosition;
      if (scrollDistance <= 0) continue;
      
      const scrollDuration = Math.max(2000, scrollDistance * 2);
      const steps = Math.ceil(scrollDuration / 100);
      
      for (let i = 0; i <= steps; i++) {
        const progress = i / steps;
        const currentScroll = currentPosition + (scrollDistance * progress);
        
        await page.evaluate((pos) => {
          window.scrollTo(0, pos);
        }, currentScroll);
        
        await this.waitForTimeout(100);
      }
      
      currentPosition = targetPosition;
      await this.waitForTimeout(2000 + (Math.random() * 3000));
    }
  }

  // 🎯 TRIGGER LAZY LOAD ADS
  async triggerLazyLoadAds(page, sessionId) {
    try {
      const scrollPositions = [200, 500, 800, 1200];
      
      for (const position of scrollPositions) {
        await page.evaluate((pos) => {
          window.scrollTo({
            top: pos,
            behavior: 'smooth'
          });
        }, position);
        
        await this.waitForTimeout(1500 + (Math.random() * 1000));
      }
      
      await page.evaluate(() => {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      });
      
    } catch (error) {
      this.log(sessionId, 'LAZY_LOAD_ERROR', `Error trigger lazy load: ${error.message}`);
    }
  }

  // 🎯 CHECK RESOURCE STATUS
  async checkResourceStatus(page, sessionId) {
    try {
      const resources = await page.evaluate(() => {
        const resources = performance.getEntriesByType('resource');
        const adResources = resources.filter(resource => 
          resource.name.includes('googleads') || 
          resource.name.includes('doubleclick')
        );
        
        return {
          totalResources: resources.length,
          adResources: adResources.length
        };
      });
      
      this.log(sessionId, 'RESOURCE_STATUS', 
        `📊 Resources: ${resources.totalResources} total, ${resources.adResources} ad resources`);
      
      return resources;
    } catch (error) {
      return null;
    }
  }

  getSessionPattern(sessionId) {
    const patterns = Object.keys(this.sessionPatterns);
    const patternKey = patterns[Math.floor(Math.random() * patterns.length)];
    return this.sessionPatterns[patternKey];
  }
}

module.exports = TrafficGenerator;

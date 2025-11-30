const axios = require('axios');

class ProxyScraper {
    constructor() {
        this.sources = [
            'https://api.proxyscrape.com/v2/?request=getproxies&protocol=http&timeout=10000&country=all',
            'https://www.proxy-list.download/api/v1/get?type=http',
            'https://raw.githubusercontent.com/TheSpeedX/SOCKS-List/master/http.txt'
        ];
        
        // 🆕 WEB PROXY GRATIS
        this.webProxies = [
            'https://www.croxyproxy.com/',
            'https://www.croxyproxy.rocks/',
            'https://www.hide-my-ip.com/',
            'https://www.proxysite.com/',
            'https://www.proxysite.today/',
            'https://www.proxy4free.com/',
            'https://www.freeproxy.io/',
            'https://www.geoproxy.com/',
            'https://www.proxyboost.com/',
            'https://www.ultraproxy.com/',
            'https://www.hidemyass.com/',
            'https://www.kproxy.com/',
            'https://www.vpnbook.com/webproxy',
            'https://www.anonymouse.org/',
            'https://www.proxfree.com/'
        ];
    }

    async getProxiesWithoutTest(maxProxies = 10) {
        console.log('🎯 Getting proxies WITHOUT pre-test...');
        
        const allProxies = [];
        
        for (const source of this.sources) {
            try {
                const response = await axios.get(source, { 
                    timeout: 10000,
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
                });
                
                const proxies = this.parseProxies(response.data);
                allProxies.push(...proxies);
                
                console.log(`✅ ${this.getSourceName(source)}: ${proxies.length} proxies`);
                
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (error) {
                console.log(`❌ ${this.getSourceName(source)}: ${error.message}`);
            }
        }
        
        const uniqueProxies = [...new Set(allProxies)];
        console.log(`✅ Total unique proxies: ${uniqueProxies.length}`);
        
        return uniqueProxies.slice(0, maxProxies);
    }

    // 🆕 METHOD BARU: Dapatkan Web Proxy Gratis
    async getWebProxies(maxProxies = 10) {
        console.log('🌐 Getting FREE Web Proxies...');
        
        const availableWebProxies = [];
        
        for (const webProxy of this.webProxies.slice(0, maxProxies)) {
            try {
                // Test jika web proxy accessible
                const response = await axios.get(webProxy, {
                    timeout: 15000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
                    }
                });
                
                if (response.status === 200) {
                    availableWebProxies.push({
                        url: webProxy,
                        type: 'web',
                        name: this.getWebProxyName(webProxy),
                        tested: true,
                        status: 'active'
                    });
                    console.log(`✅ Web Proxy Available: ${webProxy}`);
                }
            } catch (error) {
                console.log(`❌ Web Proxy Failed: ${webProxy} - ${error.message}`);
            }
            
            // Delay antara test
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        console.log(`✅ Total available web proxies: ${availableWebProxies.length}`);
        return availableWebProxies;
    }

    // 🆕 METHOD BARU: Dapatkan semua jenis proxy (IP + Web)
    async getAllProxiesMixed(maxProxies = 15) {
        console.log('🔀 Getting MIXED proxies (IP + Web)...');
        
        let ipProxies = [];
        let webProxies = [];
        
        try {
            ipProxies = await this.getProxiesWithoutTest(Math.floor(maxProxies * 0.7));
        } catch (error) {
            console.log('❌ Failed to get IP proxies, using backup');
            ipProxies = this.getBackupProxies();
        }
        
        try {
            webProxies = await this.getWebProxies(Math.floor(maxProxies * 0.3));
        } catch (error) {
            console.log('❌ Failed to get web proxies, using backup');
            webProxies = this.getBackupWebProxies();
        }
        
        const mixedProxies = [
            ...ipProxies.map(proxy => ({ 
                url: `http://${proxy}`, 
                type: 'ip', 
                tested: false,
                name: 'ip-proxy'
            })),
            ...webProxies
        ];
        
        console.log(`✅ Mixed proxies: ${mixedProxies.length} total (${ipProxies.length} IP + ${webProxies.length} Web)`);
        return mixedProxies;
    }

    getWebProxyName(url) {
        const domain = url.split('/')[2];
        return domain ? domain.replace('www.', '').split('.')[0] : 'Unknown';
    }

    parseProxies(data) {
        const proxies = new Set();
        const lines = data.split('\n');
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            
            const ipPortMatch = trimmed.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):(\d{1,5})$/);
            if (ipPortMatch) {
                proxies.add(`${ipPortMatch[1]}:${ipPortMatch[2]}`);
            }
        }
        
        return Array.from(proxies);
    }

    getSourceName(url) {
        const domain = url.split('/')[2];
        return domain || 'Unknown';
    }

    getBackupProxies() {
        return [
            '103.147.247.1:3000',
            '181.176.161.39:8080', 
            '201.229.250.21:80',
            '45.230.8.20:999',
            '186.103.130.91:8080',
            '190.107.237.18:999',
            '45.175.239.25:999',
            '200.105.215.22:33630',
            '201.91.82.155:3128',
            '185.17.134.149:8080'
        ];
    }

    // 🆕 METHOD BARU: Backup Web Proxies
    getBackupWebProxies() {
        return [
            { 
                url: 'https://www.croxyproxy.com/', 
                type: 'web', 
                name: 'croxyproxy',
                tested: true,
                status: 'active'
            },
            { 
                url: 'https://www.hide-my-ip.com/', 
                type: 'web', 
                name: 'hide-my-ip',
                tested: true,
                status: 'active'
            },
            { 
                url: 'https://www.proxysite.com/', 
                type: 'web', 
                name: 'proxysite',
                tested: true,
                status: 'active'
            },
            { 
                url: 'https://www.geoproxy.com/', 
                type: 'web', 
                name: 'geoproxy',
                tested: true,
                status: 'active'
            }
        ];
    }

    // 🆕 METHOD BARU: Test single web proxy
    async testWebProxy(webProxyUrl) {
        try {
            const response = await axios.get(webProxyUrl, {
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            
            return {
                url: webProxyUrl,
                status: 'active',
                responseTime: response.headers['response-time'] || 'unknown',
                name: this.getWebProxyName(webProxyUrl)
            };
        } catch (error) {
            return {
                url: webProxyUrl,
                status: 'inactive',
                error: error.message,
                name: this.getWebProxyName(webProxyUrl)
            };
        }
    }
}

module.exports = ProxyScraper;

class ProxyHandler {
    constructor() {
        this.proxyList = [];
        this.webProxyList = [];
        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            lastUpdate: new Date()
        };
    }

    // Method untuk parsing proxy dengan format IP:PORT:USER:PASS
    parseProxyWithAuth(proxyString) {
        if (!proxyString || !proxyString.includes(':')) {
            return null;
        }
        
        const parts = proxyString.split(':');
        
        // Format: IP:PORT:USER:PASS
        if (parts.length === 4) {
            const ip = parts[0];
            const port = parts[1];
            const username = parts[2];
            const password = parts[3];
            
            // Validasi IP dan port
            const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
            if (!ipRegex.test(ip)) return null;
            
            const portNum = parseInt(port);
            if (isNaN(portNum) || portNum < 1 || portNum > 65535) return null;
            
            return `http://${username}:${password}@${ip}:${port}`;
        }
        
        return null;
    }

    addManualProxy(proxyString) {
        // Coba parse sebagai proxy dengan auth
        const authProxy = this.parseProxyWithAuth(proxyString);
        if (authProxy) {
            this.proxyList.push(authProxy);
            console.log(`✅ Proxy dengan auth ditambahkan: ${authProxy}`);
            return true;
        }
        
        // Fallback ke format biasa
        if (proxyString && proxyString.includes(':')) {
            const trimmedProxy = proxyString.trim();
            this.proxyList.push(trimmedProxy);
            console.log(`✅ Proxy manual ditambahkan: ${trimmedProxy}`);
            return true;
        }
        
        console.error('❌ Format proxy salah. Gunakan format: ip:port atau ip:port:user:pass');
        return false;
    }

    // 🆕 METHOD BARU: Tambahkan Web Proxy
    addWebProxy(webProxyObj) {
        if (webProxyObj && webProxyObj.url && webProxyObj.type === 'web') {
            // Cek duplikat
            const exists = this.webProxyList.find(wp => wp.url === webProxyObj.url);
            if (!exists) {
                this.webProxyList.push({
                    ...webProxyObj,
                    addedAt: new Date(),
                    usageCount: 0
                });
                console.log(`✅ Web Proxy ditambahkan: ${webProxyObj.url} (${webProxyObj.name})`);
                return true;
            }
        }
        return false;
    }

    addMultipleProxies(proxyArray) {
        if (Array.isArray(proxyArray)) {
            let addedCount = 0;
            proxyArray.forEach(proxy => {
                if (typeof proxy === 'string' && proxy.includes(':')) {
                    // Coba parse dengan auth, jika tidak berhasil gunakan format biasa
                    const authProxy = this.parseProxyWithAuth(proxy);
                    if (authProxy) {
                        this.proxyList.push(authProxy);
                        addedCount++;
                    } else {
                        this.proxyList.push(proxy.trim());
                        addedCount++;
                    }
                } else if (typeof proxy === 'object' && proxy.type === 'web') {
                    // Tambahkan web proxy
                    if (this.addWebProxy(proxy)) {
                        addedCount++;
                    }
                }
            });
            console.log(`✅ ${addedCount} proxy ditambahkan (${this.proxyList.length} IP + ${this.webProxyList.length} Web)`);
        }
    }

    // 🆕 METHOD BARU: Dapatkan random proxy (IP atau Web)
    getRandomProxy() {
        const totalProxies = this.proxyList.length + this.webProxyList.length;
        if (totalProxies === 0) {
            return null;
        }
        
        // Pilih antara IP proxy atau Web proxy (60% IP, 40% Web)
        const useWebProxy = Math.random() < 0.4 && this.webProxyList.length > 0;
        
        if (useWebProxy && this.webProxyList.length > 0) {
            const randomWebProxy = this.webProxyList[Math.floor(Math.random() * this.webProxyList.length)];
            // Update usage count
            randomWebProxy.usageCount = (randomWebProxy.usageCount || 0) + 1;
            this.stats.totalRequests++;
            
            return {
                type: 'web',
                url: randomWebProxy.url,
                name: randomWebProxy.name,
                hasAuth: false,
                usageCount: randomWebProxy.usageCount
            };
        } else if (this.proxyList.length > 0) {
            const randomProxy = this.proxyList[Math.floor(Math.random() * this.proxyList.length)];
            this.stats.totalRequests++;
            
            // Return dalam format yang sesuai untuk berbagai use case
            if (randomProxy.includes('@')) {
                // Format dengan auth: http://user:pass@ip:port
                const matches = randomProxy.match(/http:\/\/([^:]+):([^@]+)@([^:]+):(\d+)/);
                if (matches) {
                    return {
                        type: 'ip',
                        ip: matches[3],
                        port: matches[4],
                        username: matches[1],
                        password: matches[2],
                        url: randomProxy,
                        hasAuth: true
                    };
                }
            }
            
            // Format biasa IP:PORT
            const parts = randomProxy.split(':');
            return {
                type: 'ip',
                ip: parts[0],
                port: parts[1],
                url: `http://${randomProxy}`,
                hasAuth: false
            };
        }
        
        return null;
    }

    // 🆕 METHOD BARU: Dapatkan khusus Web Proxy
    getRandomWebProxy() {
        if (this.webProxyList.length === 0) {
            return null;
        }
        const randomProxy = this.webProxyList[Math.floor(Math.random() * this.webProxyList.length)];
        randomProxy.usageCount = (randomProxy.usageCount || 0) + 1;
        this.stats.totalRequests++;
        
        return {
            type: 'web',
            url: randomProxy.url,
            name: randomProxy.name,
            hasAuth: false,
            usageCount: randomProxy.usageCount
        };
    }

    // 🆕 METHOD BARU: Dapatkan khusus IP Proxy
    getRandomIPProxy() {
        if (this.proxyList.length === 0) {
            return null;
        }
        const randomProxy = this.proxyList[Math.floor(Math.random() * this.proxyList.length)];
        this.stats.totalRequests++;
        
        if (randomProxy.includes('@')) {
            const matches = randomProxy.match(/http:\/\/([^:]+):([^@]+)@([^:]+):(\d+)/);
            if (matches) {
                return {
                    type: 'ip',
                    ip: matches[3],
                    port: matches[4],
                    username: matches[1],
                    password: matches[2],
                    url: randomProxy,
                    hasAuth: true
                };
            }
        }
        
        const parts = randomProxy.split(':');
        return {
            type: 'ip',
            ip: parts[0],
            port: parts[1],
            url: `http://${randomProxy}`,
            hasAuth: false
        };
    }

    getAllProxies() {
        return [
            ...this.proxyList,
            ...this.webProxyList.map(wp => wp.url)
        ];
    }

    // 🆕 METHOD BARU: Dapatkan semua dengan detail
    getAllProxiesDetailed() {
        return {
            ipProxies: this.proxyList.map(url => ({ url, type: 'ip' })),
            webProxies: this.webProxyList,
            total: this.proxyList.length + this.webProxyList.length,
            stats: this.getStats()
        };
    }

    clearProxies() {
        this.proxyList = [];
        this.webProxyList = [];
        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            lastUpdate: new Date()
        };
        console.log('🧹 Semua proxy (IP + Web) telah dihapus');
    }

    validateProxyFormat(proxyString) {
        // Coba parse sebagai proxy dengan auth
        const authProxy = this.parseProxyWithAuth(proxyString);
        if (authProxy) {
            return true;
        }
        
        // Validasi format biasa
        if (!proxyString || !proxyString.includes(':')) {
            return false;
        }
        const parts = proxyString.split(':');
        if (parts.length !== 2) return false;
        
        const ip = parts[0];
        const port = parseInt(parts[1]);
        
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
        if (!ipRegex.test(ip)) return false;
        
        if (isNaN(port) || port < 1 || port > 65535) return false;
        
        return true;
    }

    // Method untuk mendapatkan proxy dalam format yang berbeda
    getFormattedProxy(proxyString) {
        const authProxy = this.parseProxyWithAuth(proxyString);
        if (authProxy) {
            return authProxy;
        }
        return `http://${proxyString}`;
    }

    // 🆕 Method untuk menghapus proxy yang gagal
    removeFailedProxy(proxyUrl) {
        let removed = false;
        
        // Cari di IP proxies
        const ipIndex = this.proxyList.indexOf(proxyUrl);
        if (ipIndex > -1) {
            this.proxyList.splice(ipIndex, 1);
            console.log(`🗑️ IP Proxy gagal dihapus: ${proxyUrl}`);
            this.stats.failedRequests++;
            removed = true;
        }
        
        // Cari di Web proxies
        const webIndex = this.webProxyList.findIndex(wp => wp.url === proxyUrl);
        if (webIndex > -1) {
            this.webProxyList.splice(webIndex, 1);
            console.log(`🗑️ Web Proxy gagal dihapus: ${proxyUrl}`);
            this.stats.failedRequests++;
            removed = true;
        }
        
        this.stats.lastUpdate = new Date();
        return removed;
    }

    // 🆕 Method untuk menandai proxy berhasil
    markProxySuccess(proxyUrl) {
        this.stats.successfulRequests++;
        this.stats.lastUpdate = new Date();
        
        // Update web proxy stats jika applicable
        const webProxy = this.webProxyList.find(wp => wp.url === proxyUrl);
        if (webProxy) {
            webProxy.lastSuccess = new Date();
            webProxy.successCount = (webProxy.successCount || 0) + 1;
        }
    }

    // 🆕 Method untuk mendapatkan jumlah proxy tersisa
    getRemainingCount() {
        return this.proxyList.length + this.webProxyList.length;
    }

    // 🆕 Method untuk mendapatkan statistik
    getStats() {
        return {
            ipProxies: this.proxyList.length,
            webProxies: this.webProxyList.length,
            total: this.proxyList.length + this.webProxyList.length,
            requests: this.stats,
            webProxyDetails: this.webProxyList.map(wp => ({
                name: wp.name,
                url: wp.url,
                usageCount: wp.usageCount || 0,
                successCount: wp.successCount || 0,
                addedAt: wp.addedAt
            }))
        };
    }

    // 🆕 Method untuk mendapatkan web proxy by name
    getWebProxyByName(name) {
        return this.webProxyList.find(wp => wp.name === name);
    }

    // 🆕 Method untuk menambah multiple web proxies
    addMultipleWebProxies(webProxiesArray) {
        if (Array.isArray(webProxiesArray)) {
            let addedCount = 0;
            webProxiesArray.forEach(proxy => {
                if (this.addWebProxy(proxy)) {
                    addedCount++;
                }
            });
            console.log(`✅ ${addedCount} web proxies ditambahkan`);
            return addedCount;
        }
        return 0;
    }
}

module.exports = ProxyHandler;

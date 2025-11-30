[file name]: script.js
[file content begin]
// 🆕 NEW FUNCTION: Test Web Proxies
async function testWebProxies() {
    try {
        const resultsDiv = document.getElementById('webProxyResults');
        resultsDiv.innerHTML = '<div style="color: #f39c12;">🔄 Testing web proxies availability...</div>';
        
        const response = await fetch('/api/web-proxies');
        const result = await response.json();
        
        if (result.success) {
            let statusHTML = `
                <div style="background: #d5f4e6; padding: 15px; border-radius: 8px; border-left: 4px solid #27ae60; margin-bottom: 10px;">
                    <strong>✅ ${result.count} Web Proxies Tersedia</strong>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 10px;">
            `;
            
            result.webProxies.forEach(webProxy => {
                statusHTML += `
                    <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; border: 1px solid #e9ecef;">
                        <strong>${webProxy.name}</strong><br>
                        <small style="color: #6c757d;">${webProxy.url}</small><br>
                        <span style="color: #27ae60; font-weight: bold;">✅ Active</span>
                    </div>
                `;
            });
            
            statusHTML += `</div>`;
            resultsDiv.innerHTML = statusHTML;
        }
    } catch (error) {
        document.getElementById('webProxyResults').innerHTML = `
            <div style="color: #e74c3c; background: #fadbd8; padding: 15px; border-radius: 8px;">
                ❌ Error testing web proxies: ${error.message}
            </div>
        `;
    }
}

// 🆕 NEW FUNCTION: Check Proxy Statistics
async function checkProxyStats() {
    try {
        const response = await fetch('/api/proxy-stats');
        const result = await response.json();
        
        if (result.success) {
            const stats = result.stats;
            let statsHTML = `
                <div style="background: #e8f4fd; padding: 15px; border-radius: 8px; border-left: 4px solid #3498db;">
                    <strong>📊 Proxy Statistics</strong><br><br>
                    
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 15px;">
                        <div style="text-align: center; padding: 10px; background: #3498db; color: white; border-radius: 5px;">
                            <strong>IP Proxies</strong><br>
                            <span style="font-size: 1.5em;">${stats.ipProxies}</span>
                        </div>
                        <div style="text-align: center; padding: 10px; background: #9b59b6; color: white; border-radius: 5px;">
                            <strong>Web Proxies</strong><br>
                            <span style="font-size: 1.5em;">${stats.webProxies}</span>
                        </div>
                    </div>
                    
                    <div style="background: white; padding: 10px; border-radius: 5px; margin-bottom: 10px;">
                        <strong>Request Statistics:</strong><br>
                        📈 Total: ${stats.requests.totalRequests}<br>
                        ✅ Success: ${stats.requests.successfulRequests}<br>
                        ❌ Failed: ${stats.requests.failedRequests}
                    </div>
            `;
            
            if (stats.webProxies && stats.webProxies.length > 0) {
                statsHTML += `<div style="background: white; padding: 10px; border-radius: 5px; margin-top: 10px;">
                    <strong>Web Proxy Details:</strong><br>`;
                
                stats.webProxies.forEach(proxy => {
                    statsHTML += `
                        <small>${proxy.name}: ${proxy.usageCount || 0} uses, ${proxy.successCount || 0} success</small><br>
                    `;
                });
                
                statsHTML += `</div>`;
            }
            
            statsHTML += `</div>`;
            document.getElementById('webProxyResults').innerHTML = statsHTML;
        }
    } catch (error) {
        document.getElementById('webProxyResults').innerHTML = `
            <div style="color: #e74c3c; background: #fadbd8; padding: 15px; border-radius: 8px;">
                ❌ Error getting proxy stats: ${error.message}
            </div>
        `;
    }
}

// 🆕 NEW FUNCTION: Refresh Proxies
async function refreshProxies() {
    try {
        const resultsDiv = document.getElementById('webProxyResults');
        resultsDiv.innerHTML = '<div style="color: #f39c12;">🔄 Refreshing proxies...</div>';
        
        // Clear existing sessions to force refresh
        const response = await fetch('/api/clear-sessions', { method: 'POST' });
        const result = await response.json();
        
        if (result.success) {
            resultsDiv.innerHTML = `
                <div style="color: #27ae60; background: #d5f4e6; padding: 15px; border-radius: 8px;">
                    ✅ Proxies refreshed! Start new session to use fresh proxies.
                </div>
            `;
        }
    } catch (error) {
        document.getElementById('webProxyResults').innerHTML = `
            <div style="color: #e74c3c; background: #fadbd8; padding: 15px; border-radius: 8px;">
                ❌ Error refreshing proxies: ${error.message}
            </div>
        `;
    }
}

// Updated startSessions function dengan web proxy support
async function startSessions() {
    const startBtn = document.getElementById('startBtn');
    const originalText = startBtn.textContent;
    
    try {
        startBtn.disabled = true;
        startBtn.textContent = 'Starting...';
        
        const proxySource = document.querySelector('input[name="proxySource"]:checked').value;
        const proxies = document.getElementById('proxies').value.split('\n').filter(p => p.trim());
        
        const formData = {
            targetUrl: document.getElementById('targetUrl').value,
            profiles: document.getElementById('profiles').value,
            deviceType: document.getElementById('deviceType').value,
            proxySource: proxySource,
            proxies: proxies,
            proxyCount: parseInt(document.getElementById('proxyCount').value) || 5,
            autoLoop: document.getElementById('autoLoop').checked
        };
        
        if (proxySource === 'manual' && formData.proxies.length === 0) {
            alert('❌ Untuk proxy manual, wajib memasukkan minimal 1 proxy!');
            return;
        }
        
        if (!formData.targetUrl) {
            alert('❌ Target URL wajib diisi!');
            return;
        }

        const response = await fetch('/api/start-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();
        
        if (result.success) {
            let message = '✅ Session started! ';
            if (proxySource === 'web') {
                message += 'Menggunakan WEB PROXY GRATIS';
            } else if (proxySource === 'auto') {
                message += 'Menggunakan MIXED PROXY (IP + Web)';
            } else {
                message += 'Menggunakan MANUAL IP PROXY';
            }
            
            alert(message + '\n\nRedirecting to monitoring...');
            setTimeout(() => {
                window.location.href = '/monitoring';
            }, 2000);
        } else {
            alert('❌ Error: ' + result.error);
        }
    } catch (error) {
        alert('❌ Network error: ' + error.message);
    } finally {
        startBtn.disabled = false;
        startBtn.textContent = originalText;
    }
}

// Updated system status dengan web proxy info
async function loadSystemStatus() {
    try {
        const response = await fetch('/api/system-info');
        const result = await response.json();
        
        const statusDiv = document.getElementById('systemStatus');
        
        if (result.success) {
            const status = result.currentStatus;
            
            statusDiv.innerHTML = `
                <div style="color: #27ae60; background: #d5f4e6; padding: 15px; border-radius: 8px; border-left: 4px solid #27ae60;">
                    ✅ <strong>System Ready - WEB PROXY SUPPORT</strong><br>
                    📊 Active Sessions: <strong>${status.activeSessions}/${status.totalSessions}</strong><br>
                    🔌 IP Proxies: ${status.ipProxies} | 🌐 Web Proxies: ${status.webProxies}<br>
                    🎯 Quality Proxies: ${status.qualityProxies}<br>
                    ⚡ Mode: ${result.system.mode}<br>
                    <small>System menggunakan mixed proxy selection (60% IP + 40% Web)</small>
                </div>
            `;
        } else {
            statusDiv.innerHTML = `
                <div style="color: #e74c3c; background: #fadbd8; padding: 15px; border-radius: 8px;">
                    ❌ <strong>System Error</strong><br>
                    Error: ${result.error}
                </div>
            `;
        }
    } catch (error) {
        document.getElementById('systemStatus').innerHTML = `
            <div style="color: #e74c3c; background: #fadbd8; padding: 15px; border-radius: 8px;">
                ❌ <strong>Connection Error</strong><br>
                Cannot connect to server
            </div>
        `;
    }
}

// Auto-loop functions (tetap sama dengan enhancements)
async function startAutoLoop() {
    try {
        const proxySource = document.querySelector('input[name="proxySource"]:checked').value;
        const proxies = document.getElementById('proxies').value.split('\n').filter(p => p.trim());
        const targetUrl = document.getElementById('targetUrl').value;
        
        if (!targetUrl) {
            alert('❌ Target URL wajib diisi untuk auto-loop!');
            return;
        }

        if (proxySource === 'manual' && proxies.length === 0) {
            alert('❌ Untuk auto-loop dengan proxy manual, wajib memasukkan minimal 1 proxy!');
            return;
        }

        const config = {
            interval: parseInt(document.getElementById('loopInterval').value) * 60 * 1000,
            maxSessions: parseInt(document.getElementById('maxSessions').value),
            targetUrl: targetUrl,
            proxySource: proxySource,
            proxies: proxies,
            proxyCount: parseInt(document.getElementById('proxyCount').value) || 5
        };

        if (config.interval < 300000) {
            alert('❌ Interval minimum 5 menit');
            return;
        }

        const response = await fetch('/api/auto-loop/start', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(config)
        });

        const result = await response.json();
        
        if (result.success) {
            let proxyType = '';
            if (config.proxySource === 'web') proxyType = '🌐 WEB PROXY ONLY';
            else if (config.proxySource === 'auto') proxyType = '🔀 MIXED PROXY';
            else proxyType = '🔌 MANUAL PROXY';
            
            document.getElementById('autoLoopStatus').innerHTML = 
                `<div style="color: #27ae60; background: #d5f4e6; padding: 15px; border-radius: 8px; border-left: 4px solid #27ae60;">
                    <strong>✅ ${result.message}</strong><br>
                    ⏰ Interval: ${config.interval/60000} menit<br>
                    📊 Max Sessions: ${config.maxSessions}<br>
                    🌐 Target: ${config.targetUrl}<br>
                    ${proxyType}<br>
                    <small>Auto-loop berjalan dengan web proxy support</small>
                </div>`;
                
            setTimeout(checkAutoLoopStatus, 10000);
        } else {
            alert('❌ ' + result.error);
        }
    } catch (error) {
        alert('❌ Network error: ' + error.message);
    }
}

async function stopAutoLoop() {
    if (!confirm('Yakin ingin menghentikan AUTO-LOOP? Semua session akan berhenti.')) {
        return;
    }
    
    try {
        const response = await fetch('/api/auto-loop/stop', {
            method: 'POST'
        });

        const result = await response.json();
        
        if (result.success) {
            document.getElementById('autoLoopStatus').innerHTML = 
                `<div style="color: #e74c3c; background: #fadbd8; padding: 15px; border-radius: 8px; border-left: 4px solid #e74c3c;">
                    ⏹️ <strong>${result.message}</strong>
                </div>`;
        } else {
            alert('❌ ' + result.error);
        }
    } catch (error) {
        alert('❌ Network error: ' + error.message);
    }
}

async function checkAutoLoopStatus() {
    try {
        const response = await fetch('/api/auto-loop/status');
        const result = await response.json();

        const statusDiv = document.getElementById('autoLoopStatus');
        if (result.success) {
            const statusColor = result.config.enabled ? '#27ae60' : '#e74c3c';
            const statusText = result.config.enabled ? '🟢 RUNNING' : '🔴 STOPPED';
            const statusBg = result.config.enabled ? '#d5f4e6' : '#fadbd8';
            
            let proxyType = '';
            if (result.config.proxySource === 'web') proxyType = '🌐 WEB PROXY ONLY';
            else if (result.config.proxySource === 'auto') proxyType = '🔀 MIXED PROXY';
            else proxyType = '🔌 MANUAL PROXY';
            
            statusDiv.innerHTML = `
                <div style="background: ${statusBg}; padding: 15px; border-radius: 8px; border-left: 4px solid ${statusColor};">
                    <strong>Auto-Loop Status: ${statusText}</strong><br>
                    ⏰ Interval: ${result.config.interval/60000} menit<br>
                    📊 Max Sessions: ${result.config.maxSessions}<br>
                    🎯 Active Sessions: <strong>${result.activeSessions}/${result.config.maxSessions}</strong><br>
                    🌐 Target: ${result.config.targetUrl}<br>
                    ${proxyType}<br>
                    <small>Terakhir diperiksa: ${new Date().toLocaleTimeString()}</small>
                </div>
            `;
            
            if (result.config.enabled) {
                setTimeout(checkAutoLoopStatus, 10000);
            }
        }
    } catch (error) {
        document.getElementById('autoLoopStatus').innerHTML = 
            `<div style="color: #e74c3c;">
                ❌ Tidak dapat terhubung ke server
            </div>`;
    }
}

async function testPuppeteer() {
    try {
        const response = await fetch('/health');
        const result = await response.json();
        
        if (result.status === 'OK') {
            alert('✅ System test passed!\n\n' +
                  `🌐 Web Proxies: ${result.proxies.webProxies}\n` +
                  `🔌 IP Proxies: ${result.proxies.ipProxies}\n` +
                  `🎯 Quality: ${result.proxies.quality}\n` +
                  `⚡ Version: ${result.version}`);
        } else {
            alert('❌ System test failed: ' + result.error);
        }
    } catch (error) {
        alert('❌ Test error: ' + error.message);
    }
}

function goToMonitoring() {
    window.location.href = '/monitoring';
}

// Event listener untuk form submission
document.getElementById('botConfig').addEventListener('submit', async function(e) {
    e.preventDefault();
    await startSessions();
});

// Auto-refresh status
setInterval(() => {
    checkAutoLoopStatus();
    loadSystemStatus();
}, 30000);
[file content end]
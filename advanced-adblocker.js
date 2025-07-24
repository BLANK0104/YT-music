/**
 * Advanced Ad Blocking using uBlock Origin Filter Lists
 * This approach downloads and parses the same filter lists that uBlock Origin uses
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

class AdvancedAdBlocker {
    constructor() {
        this.networkFilters = [];
        this.cosmeticFilters = [];
        this.initialized = false;
    }

    async initialize() {
        console.log('🛡️ Initializing advanced ad blocker with uBlock Origin filters...');
        
        // Download popular filter lists (same ones uBlock uses)
        const filterLists = [
            'https://easylist.to/easylist/easylist.txt',
            'https://easylist.to/easylist/easyprivacy.txt',
            'https://www.malwaredomainlist.com/hostslist/hosts.txt',
            'https://someonewhocares.org/hosts/zero/hosts'
        ];

        for (const listUrl of filterLists) {
            try {
                await this.downloadAndParseFilters(listUrl);
            } catch (error) {
                console.log(`⚠️ Failed to load filter list: ${listUrl}`);
            }
        }

        this.initialized = true;
        console.log(`🛡️ Loaded ${this.networkFilters.length} network filters and ${this.cosmeticFilters.length} cosmetic filters`);
    }

    async downloadAndParseFilters(url) {
        return new Promise((resolve, reject) => {
            https.get(url, (response) => {
                let data = '';
                response.on('data', chunk => data += chunk);
                response.on('end', () => {
                    this.parseFilterList(data);
                    resolve();
                });
            }).on('error', reject);
        });
    }

    parseFilterList(content) {
        const lines = content.split('\n');
        
        for (const line of lines) {
            const trimmed = line.trim();
            
            // Skip comments and empty lines
            if (!trimmed || trimmed.startsWith('!') || trimmed.startsWith('[')) {
                continue;
            }

            // Network filters (block requests)
            if (trimmed.startsWith('||') || trimmed.includes('$')) {
                this.networkFilters.push(this.parseNetworkFilter(trimmed));
            }
            // Cosmetic filters (hide elements)
            else if (trimmed.includes('##') || trimmed.includes('#@#')) {
                this.cosmeticFilters.push(this.parseCosmeticFilter(trimmed));
            }
            // Host-based filters
            else if (trimmed.includes(' ')) {
                const parts = trimmed.split(/\s+/);
                if (parts[0] === '0.0.0.0' || parts[0] === '127.0.0.1') {
                    this.networkFilters.push({ domain: parts[1], type: 'host' });
                }
            }
        }
    }

    parseNetworkFilter(filter) {
        // Simplified parsing - real implementation would be more complex
        if (filter.startsWith('||')) {
            const domain = filter.substring(2).split('/')[0].split('^')[0];
            return { domain, type: 'domain', original: filter };
        }
        return { pattern: filter, type: 'pattern', original: filter };
    }

    parseCosmeticFilter(filter) {
        const parts = filter.split('##');
        if (parts.length === 2) {
            return { 
                domain: parts[0] || '*', 
                selector: parts[1], 
                type: 'hide',
                original: filter 
            };
        }
        return { selector: filter, type: 'hide', original: filter };
    }

    shouldBlockRequest(url) {
        if (!this.initialized) return false;

        const urlLower = url.toLowerCase();
        
        for (const filter of this.networkFilters) {
            if (filter.type === 'domain' && urlLower.includes(filter.domain)) {
                return true;
            }
            if (filter.type === 'host' && urlLower.includes(filter.domain)) {
                return true;
            }
            if (filter.type === 'pattern') {
                // Simplified pattern matching - real implementation would use regex
                if (urlLower.includes(filter.pattern.toLowerCase())) {
                    return true;
                }
            }
        }
        
        return false;
    }

    getCosmeticFilters(hostname = '') {
        if (!this.initialized) return [];

        return this.cosmeticFilters
            .filter(filter => filter.domain === '*' || hostname.includes(filter.domain))
            .map(filter => filter.selector);
    }
}

module.exports = AdvancedAdBlocker;

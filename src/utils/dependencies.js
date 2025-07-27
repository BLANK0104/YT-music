/**
 * Dependency Manager for Optional Features
 */

class DependencyManager {
    constructor() {
        this.dependencies = {
            DiscordRPC: null,
            fetch: null,
            crypto: null
        };
        
        this.loadDependencies();
    }

    loadDependencies() {
        // Try to load Discord RPC
        try {
            this.dependencies.DiscordRPC = require('discord-rpc');
            console.log('✅ Discord RPC loaded successfully');
        } catch (e) {
            console.log('❌ Discord RPC not available');
        }

        // Try to load node-fetch
        try {
            this.dependencies.fetch = require('node-fetch');
            console.log('✅ node-fetch loaded successfully');
        } catch (e) {
            console.log('❌ node-fetch not available');
        }

        // Try to load crypto
        try {
            this.dependencies.crypto = require('crypto');
            console.log('✅ crypto loaded successfully');
        } catch (e) {
            console.log('❌ crypto not available');
        }
    }

    getDiscordRPC() {
        return this.dependencies.DiscordRPC;
    }

    getFetch() {
        return this.dependencies.fetch;
    }

    getCrypto() {
        return this.dependencies.crypto;
    }

    isDiscordRPCAvailable() {
        return this.dependencies.DiscordRPC !== null;
    }

    isFetchAvailable() {
        return this.dependencies.fetch !== null;
    }

    isCryptoAvailable() {
        return this.dependencies.crypto !== null;
    }

    isLastfmAvailable() {
        return this.isFetchAvailable() && this.isCryptoAvailable();
    }

    getDependencyStatus() {
        return {
            discordRPC: this.isDiscordRPCAvailable(),
            fetch: this.isFetchAvailable(),
            crypto: this.isCryptoAvailable(),
            lastfm: this.isLastfmAvailable()
        };
    }
}

// Export singleton instance
module.exports = new DependencyManager();

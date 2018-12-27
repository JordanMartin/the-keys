"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var crypto = require("crypto");
var http = require("http");
var winston_1 = require("winston");
var log = winston_1.createLogger({
    level: 'debug',
    format: winston_1.format.combine(winston_1.format.colorize(), winston_1.format.splat(), winston_1.format.simple()),
    transports: [
        new winston_1.transports.Console()
    ]
});
/**
 * Control the smart lock The Keys
 */
var TheKeys = /** @class */ (function () {
    /**
     * Build a new TheKeys
     *
     * @param lockId Id of the Lock
     * @param gatewaySecret Secret code of the gateway
     * @param gatewayHost Host or ip of the gateway
     * @param gatewayPort The target port for the gateway (default is 80)
     */
    function TheKeys(lockId, gatewaySecret, gatewayHost, gatewayPort) {
        if (gatewayPort === void 0) { gatewayPort = 80; }
        this.lockId = lockId;
        this.gatewaySecret = gatewaySecret;
        this.gatewayHost = gatewayHost;
        this.gatewayPort = gatewayPort;
        this.requireNotEmpty(lockId, 'The lockId must be defined');
        this.requireNotEmpty(gatewaySecret, 'The gatewaySecret must be defined');
        this.requireNotEmpty(gatewayHost, 'The gatewayHost must be defined');
        this.requireNotEmpty(gatewayPort, 'The gatewayPort must be defined');
    }
    /**
     * Open the lock
     *
     * @returns A promise with the response from the gateway
     */
    TheKeys.prototype.unlock = function () {
        log.info('Unlocking...');
        return this.apiPost('/open');
    };
    /**
     * Close the lock
     *
     * @returns A promise wiht the response from the gateway
     */
    TheKeys.prototype.lock = function () {
        log.info('Locking...');
        return this.apiPost('/close');
    };
    /**
     * Get status of the lock
     *
     * @returns A promise with the json response from the gateway
     */
    TheKeys.prototype.status = function () {
        log.info('Get status...');
        return this.apiPost('/locker_status');
    };
    /**
     * Generate the authentification string
     *
     * @returns the authentification string with the
     * template : identifier=<locker_id>&ts=<ts>&hash=<hash>
     */
    TheKeys.prototype.generateAuth = function () {
        var timestamp = Math.floor(new Date().getTime() / 1000).toString();
        var hash = this.hmacSha256(timestamp, this.gatewaySecret);
        return "identifier=" + this.lockId + "&ts=" + timestamp + "&hash=" + hash;
    };
    /**
     * Compute the HMAC-SHA256 in base64
     *
     * @param data The data to hash
     * @param key The secret
     * @returns The HMAC-SHA256 encoded in base64
     */
    TheKeys.prototype.hmacSha256 = function (data, key) {
        var hmac = crypto.createHmac('sha256', key);
        hmac.update(data);
        return hmac.digest('base64');
    };
    /**
     * Call The Keys api. This call includes the authentification
     *
     * @param path Path of the service
     * @returns The json response from the gateway
     */
    TheKeys.prototype.apiPost = function (path) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            log.debug('> POST ' + _this.gatewayHost + path);
            // Get the auth data
            var authData = _this.generateAuth();
            var options = {
                method: 'POST',
                hostname: _this.gatewayHost,
                path: path,
                port: _this.gatewayPort,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': Buffer.byteLength(authData)
                },
            };
            var req = http.request(options, function (res) {
                log.debug("< " + res.statusCode + " " + res.statusMessage);
                var chunks = [];
                res.on('data', function (chunk) { return chunks.push(chunk); });
                res.on('end', function () {
                    var response = Buffer.concat(chunks).toString();
                    resolve(JSON.parse(response));
                });
            });
            req.on('error', function (err) {
                log.error('Request failed', err);
                reject(err);
            });
            req.write(authData);
            req.end();
        });
    };
    /**
     * Throw an error if data is empty
     *
     * @param data The variable to test
     * @param message The throw message
     */
    TheKeys.prototype.requireNotEmpty = function (data, message) {
        if (!data) {
            throw new Error(message);
        }
    };
    return TheKeys;
}());
exports.TheKeys = TheKeys;

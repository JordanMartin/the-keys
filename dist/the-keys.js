"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var crypto = require("crypto");
var http = require("http");
var debug_1 = require("debug");
var debug = debug_1.default('tk-api');
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
        this.BATTERY_MIN_LEVEL_MV = 6200;
        this.BATTERY_MAX_LEVEL_MV = 8000;
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
        debug('Unlocking...');
        return this.apiPost('/open');
    };
    /**
     * Close the lock
     *
     * @returns A promise wiht the response from the gateway
     */
    TheKeys.prototype.lock = function () {
        debug('Locking...');
        return this.apiPost('/close');
    };
    /**
     * @returns A promise with the info from the gateway
     */
    TheKeys.prototype.info = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                debug('Get infos...');
                return [2 /*return*/, this.apiPost('/lockers')
                        .then(function (res) {
                        if (!res || res.status !== 'ok') {
                            throw res;
                        }
                        // filter for the lock
                        var device = res.devices
                            .filter(function (device) { return device.identifier === _this.lockId; })[0];
                        _this.feedBatteryLevel(device);
                        return device;
                    })];
            });
        });
    };
    /**
     * Get status of the lock
     *
     * @returns A promise with the json response from the gateway
     */
    TheKeys.prototype.status = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                debug('Get status...');
                return [2 /*return*/, this.apiPost('/locker_status')
                        .then(function (device) {
                        _this.feedBatteryLevel(device);
                        return device;
                    })];
            });
        });
    };
    /**
     * Add the battery level feed to the object
     *
     * @param device Object containing a battery field
     */
    TheKeys.prototype.feedBatteryLevel = function (device) {
        if (device && device.battery) {
            device.batteryLevel = this.getBatteryLevel(device.battery);
        }
    };
    /**
     * Get the battery percentage
     *
     * @param batteryMv The power of the battery in mV
     * @returns The battery percentage
     */
    TheKeys.prototype.getBatteryLevel = function (batteryMv) {
        var level = (batteryMv - this.BATTERY_MIN_LEVEL_MV)
            / (this.BATTERY_MAX_LEVEL_MV - this.BATTERY_MIN_LEVEL_MV);
        return Math.floor(level * 10000) / 100;
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
            debug('> POST ' + _this.gatewayHost + path);
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
                debug('< %s %s', res.statusCode, res.statusMessage);
                var chunks = [];
                res.on('data', function (chunk) { return chunks.push(chunk); });
                res.on('end', function () {
                    var response = Buffer.concat(chunks).toString();
                    debug(response);
                    resolve(JSON.parse(response));
                });
            });
            req.on('error', function (err) {
                debug('Request failed', err);
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

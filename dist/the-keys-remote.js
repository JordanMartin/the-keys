"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TheKeysRemote = void 0;
var debug_1 = require("debug");
var https = require("https");
var debug = (0, debug_1.default)('the-keys');
/**
 * TheKeys remote api
 */
var TheKeysRemote = /** @class */ (function () {
    function TheKeysRemote() {
    }
    TheKeysRemote.prototype.getAuthToken = function (user, pwd) {
        user = encodeURIComponent(user);
        pwd = encodeURIComponent(pwd);
        var authString = "_username=".concat(user, "&_password=").concat(pwd);
        return this.request({
            method: 'POST',
            host: 'api.the-keys.fr',
            path: '/api/login_check',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }, authString)
            .then(function (data) { return data.access_token; });
    };
    TheKeysRemote.prototype.request = function (params, body) {
        if (body === void 0) { body = null; }
        return new Promise(function (resolve, reject) {
            var req = https.request(params, function (res) {
                debug('< %s %s', res.statusCode, res.statusMessage);
                var chunks = [];
                res.on('data', function (chunk) { return chunks.push(chunk); });
                res.on('end', function () {
                    var response = Buffer.concat(chunks).toString();
                    debug(response);
                    try {
                        resolve(JSON.parse(response));
                    }
                    catch (e) {
                        reject(new Error('Bad response'));
                    }
                });
            });
            if (body) {
                req.write(body);
            }
            req.end();
        });
    };
    return TheKeysRemote;
}());
exports.TheKeysRemote = TheKeysRemote;

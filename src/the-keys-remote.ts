import Debug from 'debug';
import { RequestOptions } from 'https';
import * as https from 'https';

const debug = Debug('the-keys');

/**
 * TheKeys remote api
 */
export class TheKeysRemote {
    
    getAuthToken(user: string, pwd: string): Promise<String> {
        user = encodeURIComponent(user);
        pwd = encodeURIComponent(pwd);
        let authString = `_username=${user}&_password=${pwd}`;

        return this.request({
            method: 'POST',
            host: 'api.the-keys.fr',
            path: '/api/login_check',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }, authString)
        .then(data => data.access_token);
    }

    request(params: RequestOptions, body: any = null): Promise<any> {
        return new Promise((resolve, reject) => {
            const req = https.request(params, res => {
                debug('< %s %s', res.statusCode, res.statusMessage);

                const chunks: any[] = [];
                res.on('data', chunk => chunks.push(chunk));
                res.on('end', () => {
                    const response = Buffer.concat(chunks).toString();
                    debug(response);
                    try {
                        resolve(JSON.parse(response));
                    } catch (e) {
                        reject(new Error('Bad response'));
                    }
                });
            });
            if (body) {
                req.write(body);
            }
            req.end();
        });
    }

}
import * as crypto from 'crypto';
import * as http from 'http';
import { createLogger, transports, format } from 'winston';

const log = createLogger({
	level: 'debug',
	format: format.combine(
		format.colorize(),
		format.splat(),
		format.simple()
	),
	transports: [
		new transports.Console()
	]
});

/**
 * Control the smart lock The Keys
 */
export class TheKeys {

	/**
	 * Build a new TheKeys
	 * 
	 * @param lockId Id of the Lock
	 * @param gatewaySecret Secret code of the gateway
	 * @param gatewayHost Host or ip of the gateway
	 * @param gatewayPort The target port for the gateway (default is 80)
	 */
	constructor(
		private lockId: string,
		private gatewaySecret: string,
		private gatewayHost: string,
		private gatewayPort: number = 80
	) { }

	/**
	 * Open the lock
	 * 
	 * @returns A promise with the response from the gateway
	 */
	public unlock(): Promise<any> {
		log.info('Unlocking...');
		return this.apiPost('/open');
	}

	/**
	 * Close the lock
	 * 
	 * @returns A promise wiht the response from the gateway
	 */
	public lock(): Promise<any> {
		log.info('Locking...');
		return this.apiPost('/close');
	}

	/**
	 * Get status of the lock
	 * 
	 * @returns A promise with the json response from the gateway
	 */
	public status(): Promise<any> {
		log.info('Get status...');
		return this.apiPost('/locker_status');
	}

	/**
	 * Generate the authentification string
	 * 
	 * @returns the authentification string with the
	 * template : identifier=<locker_id>&ts=<ts>&hash=<hash>
	 */
	private generateAuth(): string {
		const timestamp = Math.floor(new Date().getTime() / 1000).toString();
		const hash = this.hmacSha256(timestamp, this.gatewaySecret);
		return `identifier=${this.lockId}&ts=${timestamp}&hash=${hash}`;
	}

	/**
	 * Compute the HMAC-SHA256 in base64
	 * 
	 * @param data The data to hash
	 * @param key The secret
	 * @returns The HMAC-SHA256 encoded in base64
	 */
	private hmacSha256(data: string, key: string) {
		const hmac = crypto.createHmac('sha256', key);
		hmac.update(data);
		return hmac.digest('base64');
	}

	/**
	 * Call The Keys api. This call includes the authentification
	 * 
	 * @param path Path of the service
	 * @returns The json response from the gateway
	 */
	private apiPost(path: string) {
		return new Promise((resolve, reject) => {

			log.debug('> POST ' + this.gatewayHost + path)

			// Get the auth data
			const authData = this.generateAuth();

			const options = {
				method: 'POST',
				hostname: this.gatewayHost,
				path: path,
				port: this.gatewayPort,
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					'Content-Length': Buffer.byteLength(authData)
				},
			};

			const req = http.request(options, (res) => {
				log.debug(`< ${res.statusCode} ${res.statusMessage}`);

				const chunks: any[] = [];
				res.on('data', chunk => chunks.push(chunk));
				res.on('end', () => resolve(Buffer.concat(chunks).toString()));
			});

			req.on('error', (err) => {
				log.error('Request failed', err);
				reject(err);
			});

			req.write(authData);
			req.end();
		});
	}
}
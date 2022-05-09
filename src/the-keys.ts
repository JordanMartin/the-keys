import * as crypto from 'crypto';
import * as http from 'http';
import Debug from 'debug';

const debug = Debug('the-keys');

/**
 * Control the smart lock The Keys
 */
export class TheKeys {

	private readonly BATTERY_MIN_LEVEL_MV = 6200;
	private readonly BATTERY_MAX_LEVEL_MV = 8000;
	private readonly GATEWAY_REQUEST_TIMEOUT = 15000;

	/**
	 * Build a new TheKeys
	 * 
	 * @param lockId Id of the Lock
	 * @param gatewaySecret Secret code of the gateway
	 * @param gatewayHost Host or ip of the gateway
	 * @param gatewayPort The target port for the gateway (default is 80)
	 */
	constructor(
		private lockId: number,
		private gatewaySecret: string,
		private gatewayHost: string,
		private gatewayPort: number = 80
	) {
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
	public unlock(): Promise<any> {
		debug('Unlocking...');
		return this.apiPost('/open');
	}

	/**
	 * Close the lock
	 * 
	 * @returns A promise wiht the response from the gateway
	 */
	public lock(): Promise<any> {
		debug('Locking...');
		return this.apiPost('/close');
	}

	/**
	 * @returns A promise with the info from the gateway
	 */
	public async info(): Promise<any> {
		debug('Get infos...');
		return this.apiPost('/lockers')
			.then((res: any) => {
				if (!res || res.status !== 'ok') {
					throw res;
				}
				// filter for the lock
				const device = res.devices
					.filter((device: any) => device.identifier === this.lockId)[0];

				if (!device) {
					throw new Error('Lock not found');
				}

				this.feedBatteryLevel(device);
				return device;
			});
	}

	/**
	 * Get status of the lock
	 * 
	 * @returns A promise with the json response from the gateway
	 */
	public async lockerStatus() {
		debug('Get status...');
		return this.apiPost('/locker_status')
			.then((device: any) => {
				this.feedBatteryLevel(device);
				return device;
			});
	}

	/**
	 * Get status of the gateway
	 * 
	 * @returns A promise with the json response from the gateway
	 */
	 public async status() {
		debug('Get status...');
		return this.apiPost('/status')
			.then((device: any) => {
				return device;
			});
	}

	/**
	 * Add the battery level feed to the object
	 * 
	 * @param device Object containing a battery field
	 */
	private feedBatteryLevel(device: any): void {
		if (device && device.battery) {
			device.batteryLevel = this.getBatteryLevel(device.battery);
		}
	}

	/**
	 * Get the battery percentage
	 * 
	 * @param batteryMv The power of the battery in mV
	 * @returns The battery percentage
	 */
	private getBatteryLevel(batteryMv: number): Number {
		const level = (batteryMv - this.BATTERY_MIN_LEVEL_MV)
			/ (this.BATTERY_MAX_LEVEL_MV - this.BATTERY_MIN_LEVEL_MV);
		return Math.floor(level * 10000) / 100;
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

			debug('> POST ' + this.gatewayHost + path)

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
				timeout: this.GATEWAY_REQUEST_TIMEOUT
			};

			const req = http.request(options, (res) => {
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

			req.on('error', (err) => {
				debug('Request failed', err);
				reject(err);
			});

			req.on('timeout', () => {
				debug('request timeout (' + this.GATEWAY_REQUEST_TIMEOUT + 'ms)');
				req.abort();
				reject(new Error('timeout'));
			});

			req.write(authData);
			req.end();
		});
	}

	/**
	 * Throw an error if data is empty
	 *
	 * @param data The variable to test
	 * @param message The throw message
	 */
	private requireNotEmpty(data: any, message: string): void {
		if (!data) {
			throw new Error(message);
		}
	}
}

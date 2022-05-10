import { RequestOptions } from 'https';
/**
 * TheKeys remote api
 */
export declare class TheKeysRemote {
    getAuthToken(user: string, pwd: string): Promise<String>;
    request(params: RequestOptions, body?: any): Promise<any>;
}

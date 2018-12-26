/**
 * Control the smart lock The Keys
 */
export declare class TheKeys {
    private lockId;
    private gatewaySecret;
    private gatewayHost;
    private gatewayPort;
    /**
     * Build a new TheKeys
     *
     * @param lockId Id of the Lock
     * @param gatewaySecret Secret code of the gateway
     * @param gatewayHost Host or ip of the gateway
     * @param gatewayPort The target port for the gateway (default is 80)
     */
    constructor(lockId: string, gatewaySecret: string, gatewayHost: string, gatewayPort?: number);
    /**
     * Open the lock
     *
     * @returns A promise with the response from the gateway
     */
    unlock(): Promise<any>;
    /**
     * Close the lock
     *
     * @returns A promise wiht the response from the gateway
     */
    lock(): Promise<any>;
    /**
     * Get status of the lock
     *
     * @returns A promise with the json response from the gateway
     */
    status(): Promise<any>;
    /**
     * Generate the authentification string
     *
     * @returns the authentification string with the
     * template : identifier=<locker_id>&ts=<ts>&hash=<hash>
     */
    private generateAuth;
    /**
     * Compute the HMAC-SHA256 in base64
     *
     * @param data The data to hash
     * @param key The secret
     * @returns The HMAC-SHA256 encoded in base64
     */
    private hmacSha256;
    /**
     * Call The Keys api. This call includes the authentification
     *
     * @param path Path of the service
     * @returns The json response from the gateway
     */
    private apiPost;
}

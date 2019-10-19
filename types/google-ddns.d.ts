declare module 'google-ddns' {
    export interface DynamicDNSOptions {
        hostname: string;
        username: string;
        password: string;
        publicIpUrl?: string;
        updateIpUrl?: string;
        userAgent?: string;
        failOnUnresolvedHostName?: boolean;
        maxUnresolvedHostNameFail?: number;
        useHostIPAddressCache?: boolean;
        hostIPAddressCacheExpires?: number;
        debug?: boolean;
    }

    export type SuccessResponse = {
        status: 'success';
        response: 'good' | 'nochg';
        message: string;
        ip: string;
    };

    export type ErrorResponse = {
        status: 'error';
        response:
            | 'nohost'
            | 'badauth'
            | 'notfqdn'
            | 'badagent'
            | 'abuse'
            | '911'
            // Error status is possible for these in certain edge cases
            | 'good'
            | 'nochg';
        message: string;
        ip?: undefined;
    };

    export class DynamicDNS {
        constructor(options: DynamicDNSOptions);
        public namespace: 'DEDA.Google.Domains.DynamicDNS';

        public sync(force?: boolean): Promise<true | SuccessResponse>;
        public getPublicIP(): Promise<string>;
        public getCurrentIP(): Promise<string>;
    }

    export interface ServiceOptions extends DynamicDNSOptions {
        checkInterval?: number;
        maxConsecutiveErrors?: number;
        exitOnMaxErrors?: boolean;
        logPath?: string;
        logToConsole?: boolean;
    }

    export class Service {
        constructor(options: ServiceOptions);
        public start(): void;
        public namespace: 'DEDA.Google.Domains.DynamicDNS.Service';
    }
}

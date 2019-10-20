import {Node, Red, NodeProperties} from 'node-red';
import {DynamicDNS, SuccessResponse, ErrorResponse} from 'google-ddns';

type SyncResult =
    | SuccessResponse
    | ErrorResponse
    | {
          status: 'success';
          response: 'nosync';
          message: string;
          ip?: undefined;
      };

interface GoogleDDNSNode extends Node {
    dynamicDns: DynamicDNS;
    credentials: {
        hostname: string;
        username: string;
        password: string;
    };
    sync(force: boolean): Promise<SyncResult>;
}

interface GoogleDDNSNodeProps extends NodeProperties {
    force: boolean;
    userAgent: string;
}

module.exports = (RED: Red) => {
    function GoogleDDNSNode(this: GoogleDDNSNode, props: GoogleDDNSNodeProps) {
        RED.nodes.createNode(this, props);

        this.dynamicDns = new DynamicDNS({
            hostname: this.credentials.hostname,
            username: this.credentials.username,
            password: this.credentials.password,
            userAgent: props.userAgent,
        });

        this.on(
            'input',
            async (
                msg: any,
                send: Node['send'],
                done?: (error?: any) => void,
            ) => {
                // For backwards compatibility, check that `send` exists.
                // If this node is installed in Node-RED 0.x, it will need to
                // fall back to using `this.send`
                send = send || this.send;

                let syncResult: SyncResult;
                try {
                    syncResult = await this.sync(props.force);
                } catch (error) {
                    // Handle unexpected errors
                    if (done) {
                        // Node-RED 1.x error handling
                        done(error);
                    } else {
                        // Node-RED 0.x error handling
                        this.error(error, msg);
                    }
                    return;
                }

                // Update the message payload with the sync result
                Object.assign(msg, {
                    payload: {
                        status: syncResult.status,
                        response: syncResult.response,
                        payload: syncResult.message,
                        ip: syncResult.ip,
                    },
                });

                // Send message to first or second output depending on status
                send(syncResult.status === 'success' ? [msg] : [, msg]);

                if (done) {
                    // Node-RED 1.x done notification
                    done();
                }
            },
        );
    }

    GoogleDDNSNode.prototype.sync = async function sync(
        this: GoogleDDNSNode,
        force: boolean,
    ): Promise<SyncResult> {
        let result: true | SuccessResponse | ErrorResponse;
        try {
            result = await this.dynamicDns.sync(force);
        } catch (error) {
            if (error.status === 'error') {
                result = error as ErrorResponse;
            } else {
                // Throw unexpected errors
                throw error;
            }
        }

        if (result === true) {
            const message =
                'No sync attempted because the IP address has not changed.';

            this.status({
                fill: 'green',
                shape: 'ring',
                text: message,
            });

            return {
                status: 'success',
                response: 'nosync',
                message,
            };
        } else {
            this.status({
                fill: result.status === 'success' ? 'green' : 'red',
                shape: 'dot',
                text: result.message,
            });

            return result;
        }
    };

    RED.nodes.registerType('google-ddns', GoogleDDNSNode, {
        credentials: {
            hostname: {type: 'text'},
            username: {type: 'text'},
            password: {type: 'password'},
        },
    });
};

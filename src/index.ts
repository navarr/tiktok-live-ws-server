import {WebSocketServer, WebSocket} from 'ws';
import {env} from "./env";
import {IncomingMessage} from "node:http";
import * as url from "node:url";
import {ControlEvent, TikTokLiveConnection} from "tiktok-live-connector";

const wss = new WebSocketServer({
    port: env.WS_SERVER_PORT,
});

/**
 * Taken from Euler directly - https://www.eulerstream.com/docs/api/websockets
 */
export enum ClientCloseCode {

    /**
     * Responding to a client's close request normally
     */
    NORMAL = 1000,

    /**
     * Error updating presence on connect, or upstream error on connect in the proxy.
     */
    INTERNAL_SERVER_ERROR = 1011,

    /**
     * Error fetching the /webcast/fetch endpoint for the socket
     */
    WEBCAST_FETCH_ERROR = 4556,

    /**
     * Error fetching the /webcast/room_info endpoint for the socket
     */
    ROOM_INFO_FETCH_ERROR = 4557,

    /**
     * TikTok closed the connected unexpectedly.
     */
    TIKTOK_CLOSED_CONNECTION = 4500,

    /**
     * The account has too many connections OR is connecting too quickly.
     */
    TOO_MANY_CONNECTIONS = 4429,

    /**
     * The client provided invalid context, such as an invalid uniqueId or JWT key.
     */
    INVALID_OPTIONS = 4400,

    /**
     * The requested streamer is not live.
     */
    NOT_LIVE = 4404,

    /**
     * The TikTok stream ended.
     */
    STREAM_END = 4005,

    /**
     * There were no messages in the timeout period, the WebSocket was assumed dead and closed.
     */
    NO_MESSAGES_TIMEOUT = 4006,

    /**
     * Invalid Auth
     */
    INVALID_AUTH = 4401,

    /**
     * Accessing a creator the JWT has no access to
     */
    NO_PERMISSION = 4403,

    /**
     * WebSocket exceeded 8 hour lifetime
     */
    MAX_LIFETIME_EXCEEDED = 4555,

}

function sendMessage(ws: WebSocket, message: Object): void {
    ws.send(JSON.stringify({messages: [message]}));
}

const start = (): void => {
    wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
        ws.on('close', () => {
            console.log('Client Disconnected');
        });

        if (req.url === undefined) {
            ws.close(ClientCloseCode.INTERNAL_SERVER_ERROR);
            return;
        }

        const params = url.parse(req.url, true);
        const uniqueId = params.query.uniqueId;
        if (typeof uniqueId !== 'string') {
            ws.close(ClientCloseCode.INVALID_OPTIONS);
            return;
        }

        const config: any = {};
        if (env.EULER_API_KEY !== undefined) {
            config.signApiKey = env.EULER_API_KEY;
        }

        if (env.SESSION_ID !== undefined) {
            config.session = {cookie: {type: 'cookie', value: {sessionId: env.SESSION_ID}}};
            if (env.TT_IDC !== undefined) {
                config.session.cookie.value.ttTargetIdc = env.TT_IDC;
            }
        }

        if (env.WHITELIST_AUTHENTICATED_SESSION_ID_HOST !== undefined) {
            config.useMobile = true;
            config.authenticateWs = true;
        }

        const tiktokConnection = new TikTokLiveConnection(uniqueId, config);

        tiktokConnection.connect().then(state => {
            console.info(`Connected to roomId ${state.roomId}`);
            sendMessage(ws, {type: 'tiktok.connect'});
        }).catch(err => {
            console.error('Failed to connect', err);
        })

        tiktokConnection.on(ControlEvent.DISCONNECTED, (code, reason) => {
            sendMessage(ws, {type: 'tiktok.disconnect', code, reason});
        })

        tiktokConnection.on(ControlEvent.DECODED_DATA, (event: string, decodedData: any) => {
            sendMessage(ws, decodedData);
        })

        ws.on('close', () => {
            console.log('Client Disconnected (second listener)');
            tiktokConnection.disconnect();
        })
    });
}

void start();
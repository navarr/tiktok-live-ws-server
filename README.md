# TikTok LIVE WebSocket Server

This is intended as a fallback for Eulerstream's WebSocket server service.

This is NOT hardened for production and likely isn't great for security. Use at your own risk.

## Important Notes

At the time of this writing (July 23), Euler was using v2 of the Prototype for the WebSocket server.
Utilizing this library instead will upgrade you to v3 of the Prototype.  This is a breaking change, and previous event listeners may not work.

For best results in your listening project, use `tiktok-live-proto/v3` for your message imports.

## Installation

* Checkout Repository
* `npm i`
* `node --import=tsx src/index.ts`
import { DurableObject } from 'cloudflare:workers';
import { TpaSession } from './tpaSession';
import { AutoRouter } from 'itty-router';
import {
	isSessionWebhookRequest,
	isStopWebhookRequest,
	SessionWebhookRequest,
	StopWebhookRequest,
	WebhookRequest
} from './augmentos';

export class Handler extends DurableObject {
	activeSessions = new Map<string, TpaSession>();

	router = AutoRouter()
	async fetch(request: Request): Promise<Response> {
		return this.router.fetch(request)
	}

	constructor(state: DurableObjectState, env: Env) {
		super(state, env);

		this.router
			.get('/health', async (_) => {
				return Response.json({
					status: 'healthy',
					app: env.PACKAGE_NAME,
					activeSessions: this.activeSessions.size,
				}, {status: 200});
			})
			.post('/webhook', async (request) => {
				try {
					const webhookRequest: WebhookRequest = await request.json()
					// Handle session request
					if (isSessionWebhookRequest(webhookRequest)) {
						return await this.handleSessionRequest(webhookRequest, env);
					}
					// Handle stop request
					else if (isStopWebhookRequest(webhookRequest)) {
						return await this.handleStopRequest(webhookRequest, env);
					}
					// Unknown webhook type
					else {
						console.error('❌ Unknown webhook request type');
						return new Response('Unknown webhook request type', {status: 400})
					}
				}
				catch (error) {
					console.error('❌ Error handling webhook:', error);
					return new Response('Internal server error', {status: 500})
				}
			});
	}

	async onSession(session: TpaSession, sessionId: string, userId: string): Promise<void> {
		session.events.onHeadPosition((data) => {
			console.log('onHeadPosition', data);
			session.layouts.showTextWall("Head position changed " + Math.round(Math.random() * 100), {
				durationMs: 3000
			});
			session.layouts
		})

		session.events.onButtonPress((data) => {
			console.log('onButtonPress', data);
			session.layouts.showTextWall("Button pressed " + Math.round(Math.random() * 100), {
				durationMs: 3000
			});
		})

		session.events.onGlassesBattery((data) => {
			console.log('onGlassesBattery', data)
			session.layouts.showTextWall("Glasses battery: " + data.level, {
				durationMs: 3000
			});
		});

		session.events.onTranscription((data) => {
			console.log('onTranscription', data)
			if (!data.isFinal) return
			session.layouts.showTextWall(data.text, {
				durationMs: 3000
			});
		})

		session.events.onVoiceActivity((data) => {
			console.log('onVoiceActivity', data)
		})

		session.events.onPhoneNotifications((data) => {
			session.layouts.showTextWall("Phone notifications " + Math.round(Math.random() * 100), {
				durationMs: 3000
			});
		})

		session.events.onError((error) => {
			console.error('Error:', error);
		});
	}

	async handleSessionRequest(request: SessionWebhookRequest, env: Env): Promise<Response> {
		const { sessionId, userId } = request;
		console.log(`\n\n🗣️ Received session request for user ${userId}, session ${sessionId}\n\n`);
		// Create new TPA session
		const session = new TpaSession({
			packageName: env.PACKAGE_NAME,
			apiKey: env.API_KEY,
			augmentOSWebsocketUrl: request.augmentOSWebsocketUrl ?? "wss://staging.augmentos.org/tpa-ws",
		});
		// Setup session event handlers
		const cleanupDisconnect = session.events.onDisconnected(async () => {
			console.log(`👋 Session ${sessionId} disconnected`);
			this.activeSessions.delete(sessionId);
		});
		const cleanupError = session.events.onError((error) => {
			console.error(`❌ [Session ${sessionId}] Error:`, error);
		});
		// Start the session
		try {
			await session.connect(sessionId);
			this.activeSessions.set(sessionId, session);
			await this.onSession(session, sessionId, userId);
			return Response.json({ status: 'success'})
		}
		catch (error) {
			console.error('❌ Failed to connect:', error);
			cleanupDisconnect();
			cleanupError();
			return Response.json({
				status: 'error',
				message: 'Failed to connect'
			}, {status: 500})
		}
	}

	async handleStopRequest(request: StopWebhookRequest, env: Env): Promise<Response> {
		const { sessionId, userId, reason } = request;
		console.log(`\n\n🛑 Received stop request for user ${userId}, session ${sessionId}, reason: ${reason}\n\n`);
		try {
			await this.onStop(env, sessionId, userId, reason);
			return Response.json({ status: 'success' })
		}
		catch (error) {
			console.error('❌ Error handling stop request:', error);
			return Response.json({
				status: 'error',
				message: 'Failed to process stop request'
			}, {status: 500})
		}
	}

	async onStop(env: Env, sessionId: string, userId: string, reason: string) {
		console.log(`Session ${sessionId} stopped for user ${userId}. Reason: ${reason}`);
		// Default implementation: close the session if it exists
		const session = this.activeSessions.get(sessionId);
		if (session) {
			session.disconnect();
			this.activeSessions.delete(sessionId);
		}
	}
}

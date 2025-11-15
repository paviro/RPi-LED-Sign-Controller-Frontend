import { exitPreviewMode, pingPreviewMode } from '../../../lib/api';

type InitResult = { success: boolean; error?: string };

const PreviewState = {
	isActive: false,
	sessionId: null as string | null,
	isInitializing: false,
	initPromise: null as Promise<InitResult> | null,
	pingInterval: null as NodeJS.Timeout | null,
	tabWasHidden: false,

	startPinging() {
		this.stopPinging();
		this.pingInterval = setInterval(() => {
			if (this.sessionId) {
				pingPreviewMode(this.sessionId).catch((err) => {
					console.warn('Ping failed:', err);
				});
			}
		}, 4000);
	},

	stopPinging() {
		if (this.pingInterval) {
			clearInterval(this.pingInterval);
			this.pingInterval = null;
		}
	},

	cleanup() {
		this.stopPinging();
		if (this.isActive && this.sessionId) {
			exitPreviewMode(this.sessionId).catch((err) => console.warn('Error exiting preview mode:', err));
			this.sessionId = null;
			this.isActive = false;
		}
	}
};

export default PreviewState;



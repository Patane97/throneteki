class TimeLimit {
    constructor(game, timeLimitInMinutes) {
        this.game = game;
        this.enabled = false;
        this.paused = false;
        this.running = false;
        this.timeLeft = timeLimitInMinutes * 60 * 1000;
        this.startedAt = null;
        this.timer = null;

        this.game.on('onSetupFinished', () => this.setEnabled(true));
        this.game.on('onGameOver', () => this.setEnabled(false));
    }

    get isTimeLimitReached() {
        return this.calculateTimeLeft() <= 0;
    }

    get active() {
        return this.running;
    }

    setEnabled(enabled) {
        this.enabled = enabled;
        this.updateRunning();
    }

    togglePause() {
        if (!this.enabled) {
            return;
        }
        this.paused = !this.paused;
        this.updateRunning();
    }

    updateRunning() {
        const shouldRun = this.enabled && !this.paused;
        if (shouldRun && !this.running) {
            this.running = true;
            this.startedAt = performance.now();
            this.timer = setInterval(() => this.tick(), 1000);
        } else if (!shouldRun && this.running) {
            this.timeLeft = this.calculateTimeLeft();
            this.running = false;
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    tick() {
        this.checkForTimeLimitReached();
        if (this.running) {
            this.game.requestClockSync();
        }
    }

    checkForTimeLimitReached() {
        if (!this.running || this.calculateTimeLeft() > 0) {
            return;
        }
        this.timeLeft = 0;
        this.running = false;
        clearInterval(this.timer);
        this.timer = null;
        this.game.timeLimitExpired();
        this.enabled = false;
        // Game state needs to explicitly be sent, as this method was triggered by a server-side timer
        this.game.sendGameState();
    }

    calculateTimeLeft() {
        if (!this.running) {
            return this.timeLeft;
        }
        return Math.max(0, this.timeLeft - (performance.now() - this.startedAt));
    }

    // Sent as the milliseconds remaining at this moment rather than as a server timestamp,
    // so browsers never need to compare their own clock against the server's.
    getState() {
        this.checkForTimeLimitReached();
        return {
            active: this.active,
            paused: this.paused,
            running: this.running,
            timeLeft: Math.round(this.calculateTimeLeft())
        };
    }
}

export default TimeLimit;

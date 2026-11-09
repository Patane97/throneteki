class ChessClock {
    constructor(player, timeLimitInMinutes, delay) {
        this.player = player;
        this.game = player.game;
        this.enabled = false; // Clocks are disabled until start event hit
        this.active = false; // Clock is active when that player has the current window
        this.paused = false;
        this.running = false; // Only ticking while enabled, active and not paused
        this.delay = delay * 1000;
        this.timeLeft = timeLimitInMinutes * 60 * 1000;
        this.delayLeft = this.delay;
        this.startedAt = null;
        this.timer = null;

        this.game.on('onSetupFinished', () => this.setEnabled(true));
        this.game.on('onPlayerEliminated', ({ player, reason }) => {
            if (player === this.player && reason !== 'time') {
                this.setEnabled(false);
            }
        });
        this.game.on('onGameOver', () => this.setEnabled(false));
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

    start() {
        if (!this.enabled || this.active) {
            return;
        }
        this.active = true;
        this.delayLeft = this.delay;
        this.updateRunning();
    }

    stop() {
        if (!this.enabled || !this.active) {
            return;
        }
        this.active = false;
        this.updateRunning();
    }

    modify(seconds) {
        this.settle();
        this.timeLeft = Math.max(0, this.timeLeft + seconds * 1000);
    }

    updateRunning() {
        const shouldRun = this.enabled && this.active && !this.paused;
        if (shouldRun && !this.running) {
            this.running = true;
            this.startedAt = performance.now();
            this.timer = setInterval(() => this.tick(), 1000);
        } else if (!shouldRun && this.running) {
            this.settle();
            this.running = false;
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    // Moves the time elapsed since the last settle out of the delay first, then out of the main time.
    settle() {
        if (!this.running) {
            return;
        }
        const now = performance.now();
        const { timeLeft, delayLeft } = this.calculateTimeLeft(now);
        this.timeLeft = timeLeft;
        this.delayLeft = delayLeft;
        this.startedAt = now;
    }

    tick() {
        this.checkForTimeRanOut();
        if (this.running) {
            this.game.requestClockSync();
        }
    }

    checkForTimeRanOut() {
        if (!this.running || this.calculateTimeLeft().timeLeft > 0) {
            return;
        }
        this.settle();
        this.active = false;
        this.updateRunning();
        this.game.chessClockExpired(this.player);
        this.enabled = false;
        // Game state needs to explicitly be sent, as this method was triggered by a server-side timer
        this.game.sendGameState();
    }

    calculateTimeLeft(now = performance.now()) {
        if (!this.running) {
            return { timeLeft: this.timeLeft, delayLeft: this.delayLeft };
        }
        const elapsed = Math.max(0, now - this.startedAt);
        const delayUsed = Math.min(this.delayLeft, elapsed);
        return {
            timeLeft: Math.max(0, this.timeLeft - (elapsed - delayUsed)),
            delayLeft: this.delayLeft - delayUsed
        };
    }

    // Times are sent as the milliseconds remaining at this moment rather than as a server timestamp,
    // so browsers never need to compare their own clock against the server's.
    getState() {
        this.checkForTimeRanOut();
        const { timeLeft, delayLeft } = this.calculateTimeLeft();
        return {
            active: this.active,
            paused: this.paused,
            running: this.running,
            timeLeft: Math.round(timeLeft),
            delayLeft: Math.round(delayLeft)
        };
    }
}

export default ChessClock;

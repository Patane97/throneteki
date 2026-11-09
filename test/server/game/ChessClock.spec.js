import { EventEmitter } from 'events';
import ChessClock from '../../../server/game/ChessClock.js';
import Game from '../../../server/game/game.js';
import TimeLimit from '../../../server/game/timeLimit.js';

describe('ChessClock', function () {
    beforeEach(function () {
        vi.useFakeTimers();
        this.game = new EventEmitter();
        this.game.chessClockExpired = vi.fn();
        this.game.requestClockSync = vi.fn();
        this.game.sendGameState = vi.fn();
        this.player = { game: this.game };
        this.clock = new ChessClock(this.player, 1, 5);
        this.game.emit('onSetupFinished');
    });

    afterEach(function () {
        vi.useRealTimers();
    });

    describe('getState()', function () {
        it('reports the time remaining in milliseconds', function () {
            expect(this.clock.getState()).toEqual({
                active: false,
                paused: false,
                running: false,
                timeLeft: 60000,
                delayLeft: 5000
            });
        });

        it('spends the delay before the main time', function () {
            this.clock.start();
            vi.advanceTimersByTime(3000);

            expect(this.clock.getState()).toMatchObject({ timeLeft: 60000, delayLeft: 2000 });

            vi.advanceTimersByTime(12000);

            expect(this.clock.getState()).toMatchObject({ timeLeft: 50000, delayLeft: 0 });
        });

        it('does not depend on the wall clock', function () {
            this.clock.start();
            vi.advanceTimersByTime(10000);
            vi.setSystemTime(Date.now() + 60 * 60 * 1000);

            expect(this.clock.getState()).toMatchObject({ timeLeft: 55000, delayLeft: 0 });
        });
    });

    describe('stop()', function () {
        it('keeps the time used and refreshes the delay on the next start', function () {
            this.clock.start();
            vi.advanceTimersByTime(10000);
            this.clock.stop();
            vi.advanceTimersByTime(30000);

            expect(this.clock.getState()).toMatchObject({ running: false, timeLeft: 55000 });

            this.clock.start();

            expect(this.clock.getState()).toMatchObject({ running: true, delayLeft: 5000 });
        });
    });

    describe('pausing', function () {
        it('stops counting down while paused', function () {
            this.clock.start();
            vi.advanceTimersByTime(10000);
            this.clock.togglePause();
            vi.advanceTimersByTime(30000);

            expect(this.clock.getState()).toMatchObject({
                paused: true,
                running: false,
                timeLeft: 55000
            });
        });

        it('resumes counting down when unpaused', function () {
            this.clock.start();
            this.clock.togglePause();
            vi.advanceTimersByTime(30000);
            this.clock.togglePause();
            vi.advanceTimersByTime(8000);

            expect(this.clock.getState()).toMatchObject({ running: true, timeLeft: 57000 });
        });

        it('applies a prompt change made while paused once unpaused', function () {
            this.clock.start();
            this.clock.togglePause();
            this.clock.stop();
            this.clock.togglePause();

            expect(this.clock.getState()).toMatchObject({ active: false, running: false });
        });

        it('starts a clock that became active while paused once unpaused', function () {
            this.clock.togglePause();
            this.clock.start();

            expect(this.clock.getState()).toMatchObject({ active: true, running: false });

            this.clock.togglePause();

            expect(this.clock.getState()).toMatchObject({ active: true, running: true });
        });
    });

    describe('modify()', function () {
        it('adds time to the clock', function () {
            this.clock.modify(30);

            expect(this.clock.getState().timeLeft).toBe(90000);
        });

        it('keeps time already used while running', function () {
            this.clock.start();
            vi.advanceTimersByTime(10000);
            this.clock.modify(30);

            expect(this.clock.getState().timeLeft).toBe(85000);
        });
    });

    describe('when the time runs out', function () {
        beforeEach(function () {
            this.clock.start();
            vi.advanceTimersByTime(65000);
        });

        it('expires the clock for the player and sends the game state', function () {
            expect(this.game.chessClockExpired).toHaveBeenCalledWith(this.player);
            expect(this.game.sendGameState).toHaveBeenCalled();
        });

        it('stops running', function () {
            expect(this.clock.getState()).toMatchObject({
                active: false,
                running: false,
                timeLeft: 0
            });
        });
    });

    describe('syncing browsers', function () {
        it('requests a clock sync while running', function () {
            this.clock.start();
            vi.advanceTimersByTime(3000);

            expect(this.game.requestClockSync).toHaveBeenCalledTimes(3);
        });

        it('does not request a clock sync while stopped or paused', function () {
            this.clock.start();
            this.clock.togglePause();
            vi.advanceTimersByTime(3000);

            expect(this.game.requestClockSync).not.toHaveBeenCalled();
        });
    });

    describe('when the game ends', function () {
        it('stops the clock', function () {
            this.clock.start();
            vi.advanceTimersByTime(10000);
            this.game.emit('onGameOver');
            vi.advanceTimersByTime(30000);

            expect(this.clock.getState()).toMatchObject({ running: false, timeLeft: 55000 });
            expect(vi.getTimerCount()).toBe(0);
        });
    });

    describe('when the player is eliminated', function () {
        it('stops the clock', function () {
            this.clock.start();
            this.game.emit('onPlayerEliminated', { player: this.player, reason: 'concede' });

            expect(this.clock.getState().running).toBe(false);
        });

        it('keeps a clock that ran out of time active for the expiry', function () {
            this.clock.start();
            this.game.emit('onPlayerEliminated', { player: this.player, reason: 'time' });

            expect(this.clock.getState().running).toBe(true);
        });
    });
});

describe('TimeLimit', function () {
    beforeEach(function () {
        vi.useFakeTimers();
        this.game = new EventEmitter();
        this.game.timeLimitExpired = vi.fn();
        this.game.requestClockSync = vi.fn();
        this.game.sendGameState = vi.fn();
        this.timeLimit = new TimeLimit(this.game, 1);
        this.game.emit('onSetupFinished');
    });

    afterEach(function () {
        vi.useRealTimers();
    });

    it('reports the time remaining in milliseconds', function () {
        vi.advanceTimersByTime(10000);

        expect(this.timeLimit.getState()).toEqual({
            active: true,
            paused: false,
            running: true,
            timeLeft: 50000
        });
    });

    it('does not depend on the wall clock', function () {
        vi.advanceTimersByTime(10000);
        vi.setSystemTime(Date.now() - 60 * 60 * 1000);

        expect(this.timeLimit.getState().timeLeft).toBe(50000);
    });

    it('stops counting down while paused', function () {
        vi.advanceTimersByTime(10000);
        this.timeLimit.togglePause();
        vi.advanceTimersByTime(30000);

        expect(this.timeLimit.getState()).toMatchObject({
            active: false,
            paused: true,
            running: false,
            timeLeft: 50000
        });

        this.timeLimit.togglePause();
        vi.advanceTimersByTime(5000);

        expect(this.timeLimit.getState().timeLeft).toBe(45000);
    });

    it('expires the game when the time runs out', function () {
        vi.advanceTimersByTime(61000);

        expect(this.game.timeLimitExpired).toHaveBeenCalledTimes(1);
        expect(this.game.sendGameState).toHaveBeenCalled();
        expect(this.timeLimit.getState()).toMatchObject({ running: false, timeLeft: 0 });
    });

    it('requests a clock sync while running', function () {
        vi.advanceTimersByTime(2000);

        expect(this.game.requestClockSync).toHaveBeenCalledTimes(2);
    });

    it('stops when the game ends', function () {
        this.game.emit('onGameOver');

        expect(this.timeLimit.getState().running).toBe(false);
        expect(vi.getTimerCount()).toBe(0);
    });
});

describe('Game.requestClockSync()', function () {
    beforeEach(function () {
        vi.useFakeTimers();
        this.game = { sendGameState: vi.fn() };
        this.requestClockSync = () => Game.prototype.requestClockSync.call(this.game);
    });

    afterEach(function () {
        vi.useRealTimers();
    });

    it('sends the game state the first time', function () {
        this.requestClockSync();

        expect(this.game.sendGameState).toHaveBeenCalledTimes(1);
    });

    it('sends the game state once per interval however many clocks ask', function () {
        this.requestClockSync();
        this.requestClockSync();
        vi.advanceTimersByTime(14000);
        this.requestClockSync();

        expect(this.game.sendGameState).toHaveBeenCalledTimes(1);
    });

    it('sends the game state again after the interval', function () {
        this.requestClockSync();
        vi.advanceTimersByTime(15000);
        this.requestClockSync();

        expect(this.game.sendGameState).toHaveBeenCalledTimes(2);
    });
});

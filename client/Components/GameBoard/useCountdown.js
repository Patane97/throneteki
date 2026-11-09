import { useEffect, useMemo, useReducer } from 'react';

export const formatSeconds = (milliseconds) => {
    const totalSeconds = Math.ceil(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (value) => String(value).padStart(2, '0');

    return hours > 0
        ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
        : `${pad(minutes)}:${pad(seconds)}`;
};

// The server sends the time remaining at the moment it built the game state. This counts down from the
// moment that state arrived using the browser's monotonic timer, so it never depends on the browser's
// wall clock agreeing with the server's.
export const useCountdown = ({ timeLeft, delayLeft = 0, running }) => {
    const { receivedAt } = useMemo(
        () => ({ receivedAt: performance.now(), timeLeft, delayLeft, running }),
        [timeLeft, delayLeft, running]
    );
    const [, tick] = useReducer((count) => count + 1, 0);

    useEffect(() => {
        if (!running) {
            return;
        }
        const timerId = setInterval(tick, 250);
        return () => clearInterval(timerId);
    }, [running]);

    const elapsed = running ? Math.max(0, performance.now() - receivedAt) : 0;
    const delayUsed = Math.min(delayLeft, elapsed);

    return {
        timeLeft: Math.max(0, timeLeft - (elapsed - delayUsed)),
        delayLeft: delayLeft - delayUsed
    };
};

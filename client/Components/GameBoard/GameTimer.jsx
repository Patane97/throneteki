import React from 'react';
import TimeLimitClock from './TimeLimitClock';
import ChessClock from './ChessClock';
import { useSelector } from 'react-redux';
import classNames from 'classnames';

const GameTimer = ({ className, player, isMe, side }) => {
    const currentGame = useSelector((state) => state.lobby.currentGame);
    if (!isMe && !player?.chessClock) {
        return null;
    }
    const wrapperClassName = classNames(
        'flex h-full justify-between gap-1',
        {
            'flex-col-reverse': side === 'top',
            'flex-col': side === 'bottom'
        },
        className
    );
    const chessClock = currentGame.useChessClocks && player.chessClock && (
        <ChessClock
            username={player.user.username}
            side={side}
            paused={player.chessClock.paused}
            running={player.chessClock.running}
            timeLeft={player.chessClock.timeLeft}
            delayLeft={player.chessClock.delayLeft}
        />
    );
    const gameClock = currentGame.useGameTimeLimit && isMe && (
        <TimeLimitClock
            paused={currentGame.timeLimit.paused}
            running={currentGame.timeLimit.running}
            timeLeft={currentGame.timeLimit.timeLeft}
        />
    );
    return (
        (chessClock || gameClock) && (
            <div className={wrapperClassName}>
                {chessClock}
                {gameClock}
            </div>
        )
    );
};

export default GameTimer;

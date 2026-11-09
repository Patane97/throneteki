import React from 'react';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClockRotateLeft, faPauseCircle } from '@fortawesome/free-solid-svg-icons';
import { Avatar } from '@heroui/react';
import { formatSeconds, useCountdown } from './useCountdown';

const ChessClock = ({
    username,
    className,
    side,
    paused,
    running,
    timeLeft: timeLeftProp,
    delayLeft: delayLeftProp
}) => {
    const { timeLeft, delayLeft } = useCountdown({
        timeLeft: timeLeftProp,
        delayLeft: delayLeftProp,
        running
    });

    const icon = paused ? <FontAwesomeIcon icon={faPauseCircle} /> : null;

    const wrapperClassName = classNames(
        'flex w-fit px-2 py-1 rounded-md text-xl bg-black/40',
        {
            'flex-col-reverse': side === 'top',
            'flex-col': side === 'bottom'
        },
        className
    );
    const delay = running && delayLeft > 0 ? `+${Math.ceil(delayLeft / 1000)}s` : null;
    return (
        <div className={wrapperClassName}>
            <div className='flex items-center gap-2'>
                <Avatar
                    src={`/img/avatar/${username}.png`}
                    showFallback
                    className='w-7 h-7 text-tiny'
                />
                <span className='text-2xl'>{formatSeconds(timeLeft)}</span>
                {icon && <div className='w-5'>{icon}</div>}
            </div>
            {delay && (
                <span className='flex gap-1 justify-end text-right p-1'>
                    {delay}
                    <FontAwesomeIcon icon={faClockRotateLeft} />
                </span>
            )}
        </div>
    );
};

export default ChessClock;

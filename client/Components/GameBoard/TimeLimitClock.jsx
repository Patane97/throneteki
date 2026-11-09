import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faPauseCircle } from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames';
import { formatSeconds, useCountdown } from './useCountdown';

const TimeLimitClock = ({ className, paused, running, timeLeft: timeLeftProp }) => {
    const { timeLeft } = useCountdown({ timeLeft: timeLeftProp, running });

    const icon = paused ? <FontAwesomeIcon icon={faPauseCircle} /> : null;

    const wrapperClassName = classNames(
        'flex items-center gap-2 w-fit bg-black/40 rounded-md px-2 py-1 text-2xl',
        className
    );
    return (
        <div className={wrapperClassName}>
            <FontAwesomeIcon icon={faClock} />
            <div className='text-3xl'>{formatSeconds(timeLeft)}</div>
            {icon && <div className='w-5'>{icon}</div>}
        </div>
    );
};

export default TimeLimitClock;

import React, { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import AlertPanel from '../Site/AlertPanel';
import Panel from '../Site/Panel';
import {
    cancelPasswordJoin,
    sendJoinGameMessage,
    sendWatchGameMessage
} from '../../redux/reducers/lobby';
import { Button, Input } from '@heroui/react';

const PasswordGame = () => {
    const [password, setPassword] = useState('');
    const dispatch = useDispatch();
    const { passwordJoinType, passwordGame, passwordError } = useSelector((state) => state.lobby);

    const onJoinClick = useCallback(() => {
        if (!passwordGame?.id) {
            return;
        }
        if (passwordJoinType === 'Join') {
            dispatch(sendJoinGameMessage(passwordGame.id, password));
        } else if (passwordJoinType === 'Watch') {
            dispatch(sendWatchGameMessage(passwordGame.id, password));
        }
    }, [passwordJoinType, dispatch, passwordGame?.id, password]);

    const onCancelClick = useCallback(() => {
        dispatch(cancelPasswordJoin());
    }, [dispatch]);

    const onPasswordChange = useCallback((event) => {
        setPassword(event.target.value);
    }, []);

    if (!passwordGame) {
        return null;
    }

    return (
        <div>
            <Panel title={passwordGame.name}>
                <div className='flex gap-2 flex-col'>
                    {passwordError ? (
                        <div>
                            <AlertPanel variant='danger' message={passwordError} />
                        </div>
                    ) : null}
                    <div className='game-password'>
                        <Input
                            autoComplete='off'
                            type='password'
                            onChange={onPasswordChange}
                            value={password}
                            label='Game password'
                            placeholder='Enter the password'
                        />
                    </div>

                    <div className='flex gap-2'>
                        <Button color='primary' onPress={onJoinClick}>
                            {passwordJoinType}
                        </Button>
                        <Button color='primary' onPress={onCancelClick}>
                            Cancel
                        </Button>
                    </div>
                </div>
            </Panel>
        </div>
    );
};

export default PasswordGame;

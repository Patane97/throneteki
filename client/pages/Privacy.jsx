import React from 'react';

import Panel from '../Components/Site/Panel';
import Page from './Page';

const Privacy = () => {
    return (
        <Page>
            <Panel title='Privacy Policy'>
                <h3 className='text-large font-bold mt-2'>Background</h3>

                <p className='mt-1'>
                    Even though this is only a site to play a card game online, we still take your
                    privacy and the security of your data seriously. This policy outlines what data
                    we store about you, why we store it and what we do with it.
                </p>

                <h3 className='text-large font-bold mt-2'>What data we store</h3>
                <p className='mt-1'>
                    When you sign up for the site (which is required to play or spectate on games),
                    we collect a username, your email address, a password and the IP address of the
                    computer you&apos;re using when you sign up.
                </p>
                <p className='mt-1'>
                    When you play games on the site, we collect information about the games you
                    play(what faction/agenda you&apos;re using, the deck you are using to play with
                    - but not its contents, who you are playing against and the outcome of the
                    game).
                </p>
                <p className='mt-1'>If you chat in the lobby, your messages are stored.</p>

                <h3 className='text-large font-bold mt-2'>Why we collect it</h3>
                <p className='mt-1'>
                    We collect a username to identify you on the site and so that people know who
                    they are playing against.
                </p>
                <p className='mt-1'>Your email address is used:</p>
                <ul className='list-disc list-inside ml-2'>
                    <li>
                        in order to verify that you are a real person and not an automated
                        program(or &lsquo;bot&rsquo;).
                    </li>
                    <li>
                        to enchance the security and general environment of the site by allowing us
                        to restrict people to one account per email address, or to prevent a user
                        using the site.
                    </li>
                    <li>
                        to provide your avatar picture via a service called Gravatar. Your email
                        address is cryptographically hashed and sent to Gravatar&apos;s servers for
                        them to provide your profile image or a default placeholder.
                    </li>
                    <li>to allow you to reset your password if you forget it</li>
                    <li>
                        to send you critical updates about the site from time to time (We have to
                        date never sent one of these)
                    </li>
                </ul>
                <p className='mt-2'>
                    The IP address of the computer you use is collected in order to protect the
                    security and integrity of the site and allow us to prevent abuse of the site.
                </p>
                <p className='mt-1'>
                    Your lobby messages are stored so that we can display them to other users of the
                    site and to detect patterns of abusive behaviour. Your messages may also be
                    moderated to remove offensive content, or deleted altogether at our discretion.
                </p>
            </Panel>
        </Page>
    );
};

export default Privacy;

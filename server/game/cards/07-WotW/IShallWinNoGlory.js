import DrawCard from '../../drawcard.js';

class IShallWinNoGlory extends DrawCard {
    setupCardAbilities(ability) {
        this.reaction({
            when: {
                onChallengeInitiated: (event) =>
                    event.challenge.initiatedAgainstPlayer === this.controller
            },
            cost: ability.costs.choose({
                'Kneel Builders': ability.costs.kneelMultiple(
                    3,
                    (card) => card.hasTrait('Builder') && card.getType() === 'character'
                ),
                'Kneel Rangers': ability.costs.kneelMultiple(
                    3,
                    (card) => card.hasTrait('Ranger') && card.getType() === 'character'
                ),
                'Kneel Stewards': ability.costs.kneelMultiple(
                    3,
                    (card) => card.hasTrait('Steward') && card.getType() === 'character'
                )
            }),
            handler: (context) => {
                this.game.addMessage(
                    '{0} plays {1} and kneels {2} to end the challenge immediately with no winner or loser',
                    this.controller,
                    this,
                    context.costs.kneel
                );

                this.game.currentChallenge.cancelChallenge();
            }
        });
    }
}

IShallWinNoGlory.code = '07024';

export default IShallWinNoGlory;

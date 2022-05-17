const DrawCard = require('../../drawcard.js');
const GameActions = require('../../GameActions/index.js');

class WhiteHarbor extends DrawCard {
    setupCardAbilities() {
        this.reaction({
            when: {
                afterChallenge: event => event.challenge.winner === this.controller
            },
            message: '{player} uses {source} to reveal the top 2 cards of their deck',
            gameAction: GameActions.revealTopCards(context => ({
                player: context.player,
                amount: 2,
                whileRevealed: GameActions.genericHandler(context => {
                    this.game.promptForSelect(context.event.challenge.loser, {
                        activePromptTitle: `Select a card to add to ${context.player.name}'s hand`,
                        cardCondition: card => context.revealed.includes(card),
                        onSelect: (player, card) => {
                            context.target = card;
                            return true;
                        },
                        onCancel: (player) => {
                            this.game.addAlert('danger', '{0} does not select a card for {1}', player, this);
                            return true;
                        }
                    });
                })
            })).then(preThenContext => ({
                condition: () => !!preThenContext.target,
                message: {
                    format: '{loser} chooses to add {card} to {player}\'s hand',
                    args: {
                        loser: () => preThenContext.event.challenge.loser,
                        card: () => preThenContext.target
                    }
                },
                gameAction: GameActions.simultaneously([
                    GameActions.addToHand({
                        card: preThenContext.target,
                        player: preThenContext.player
                    }),
                    GameActions.placeCard({
                        card: preThenContext.revealed.find(card => card !== preThenContext.target),
                        player: preThenContext.player,
                        location: 'draw deck',
                        bottom: true
                    })
                ])
            }))
        });
    }
}

WhiteHarbor.code = '11042';

module.exports = WhiteHarbor;

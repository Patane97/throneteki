import DrawCard from '../../drawcard.js';
import GameActions from '../../GameActions/index.js';

class SchemingSepton extends DrawCard {
    setupCardAbilities(ability) {
        this.action({
            title: 'Draw 1 card and gain 2 gold',
            phase: 'challenge',
            limit: ability.limit.perPhase(1),
            message: '{player} uses {source} to draw 1 card and gain 2 gold',
            gameAction: GameActions.simultaneously([
                GameActions.drawCards((context) => ({ player: context.player, amount: 1 })),
                GameActions.gainGold((context) => ({ player: context.player, amount: 2 }))
            ]).then(() => ({
                message: 'Then, {player} places {source} on top of their deck',
                gameAction: GameActions.returnCardToDeck({ card: this })
            }))
        });
    }
}

SchemingSepton.code = '11004';

export default SchemingSepton;

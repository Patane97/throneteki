import DrawCard from '../../drawcard.js';

class Ygritte extends DrawCard {
    setupCardAbilities(ability) {
        this.persistentEffect({
            match: this,
            effect: ability.effects.cannotBeKneeled(
                (context) => context.resolutionStage === 'effect'
            )
        });
        this.persistentEffect({
            condition: () => this.controlsAnotherWildling(),
            match: this,
            effect: ability.effects.addKeyword('stealth')
        });
    }

    controlsAnotherWildling() {
        return this.controller.anyCardsInPlay(
            (card) => card !== this && card.getType() === 'character' && card.hasTrait('Wildling')
        );
    }
}

Ygritte.code = '06017';

export default Ygritte;

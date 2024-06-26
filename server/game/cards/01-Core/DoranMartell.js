import DrawCard from '../../drawcard.js';

class DoranMartell extends DrawCard {
    setupCardAbilities(ability) {
        this.persistentEffect({
            match: (card) =>
                card.isFaction('martell') &&
                card !== this &&
                (card.hasTrait('Lord') || card.hasTrait('Lady')),
            effect: ability.effects.dynamicStrength(() => this.controller.getNumberOfUsedPlots())
        });
    }
}

DoranMartell.code = '01105';

export default DoranMartell;

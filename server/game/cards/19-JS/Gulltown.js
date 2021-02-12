const DrawCard = require('../../drawcard.js');

class Gulltown extends DrawCard {
    setupCardAbilities(ability) {
        this.persistentEffect({
            targetController: 'any',
            effect: ability.effects.dynamicUsedPlotsWithTrait(() => 1, 'City')
        });
        this.plotModifiers({
            gold: 1
        });
    }
}

Gulltown.code = '19019';

module.exports = Gulltown;

import DrawCard from '../../drawcard.js';

class Knighted extends DrawCard {
    setupCardAbilities(ability) {
        this.whileAttached({
            effect: [ability.effects.modifyStrength(1), ability.effects.addTrait('Knight')]
        });
    }
}

Knighted.code = '02058';

export default Knighted;

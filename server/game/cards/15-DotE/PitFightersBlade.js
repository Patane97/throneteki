import DrawCard from '../../drawcard.js';

class PitFightersBlade extends DrawCard {
    setupCardAbilities(ability) {
        this.whileAttached({
            condition: () => this.game.isDuringChallenge({ challengeType: 'military' }),
            effect: ability.effects.addKeyword('Renown')
        });
    }
}

PitFightersBlade.code = '15021';

export default PitFightersBlade;

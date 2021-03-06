const DrawCard = require('../../drawcard.js');
const {Tokens} = require('../../Constants');
const GameActions = require('../../GameActions');

class BraveCompanions extends DrawCard {
    setupCardAbilities(ability) {
        this.persistentEffect({
            match: card => card === this,
            effect: ability.effects.dynamicStrength(() => this.calculateStrength())
        });
                      
        this.reaction({
            when: {
                onCardEntersPlay: event => event.card === this && event.playingType === 'marshal'
            },
            gameAction: GameActions.search({
                title: 'Select cards',
                topCards: 10,
                numToSelect: 3,
                match: {
                    type: 'character',
                    condition: (card, context) => this.remainingTraits(context.selectedCards).some(trait => card.hasTrait(trait))
                },
                message: '{player} uses {source} to search their deck and add {searchTarget} to their hand',
                cancelMessage: '{player} uses {source} to search their deck but does not find a card',
                gameAction: GameActions.simultaneously(context => (
                    context.searchTarget.map(card => GameActions.addToHand({ card }))
                ))
            })
        });
    }
    
    calculateStrength() {
        let cards = this.controller.filterCardsInPlay(card => {
            return card.getType() === 'character' && card.hasToken(Tokens.gold);
        });

        return cards.length;
    }

    remainingTraits(selectedCards) {
        const traits = ['Army', 'Commander', 'Mercenary'];
        let tempCards = selectedCards.slice();
        for(let i = tempCards.length ; i < traits.length ; i++) {
            tempCards.push(null);
        }
        var remaining = [];
        this.permutate([], [], tempCards).every(p => {
            if(p.every((c, i) => !c || c.hasTrait(traits[i]))) {
                remaining = remaining.concat(traits.filter((t, i) => !remaining.some(r => r === t) && !p[i]));
            }
            return remaining.length !== traits.length;
        });
        return remaining;
    }

    permutate(generated, current, remaining) {
        if(remaining.length > 0) {
            remaining.forEach((r, index) => {
                var next = current.slice();
                next.push(r);
                var newRemaining = remaining.slice();
                newRemaining.splice(index, 1);
                this.permutate(generated, next, newRemaining);
            });
        } else {
            generated.push(current);
        }
        return generated;
    }

    selectCards(player, cards) {
        for(let card of cards) {
            player.moveCard(card, 'hand');
        }
        this.game.addMessage('{0} uses {1} to search their deck and adds {2} to their hand', player, this, cards);
        return true;
    }

    cancelSearch(player) {
        this.game.addMessage('{0} uses {1} to search their deck, but does not add any cards to their hand', player, this);
        return true;
    }
}

BraveCompanions.code = '20042';

module.exports = BraveCompanions;

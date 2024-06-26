import BaseCardSelector from './BaseCardSelector.js';

class ExactlyXCardSelector extends BaseCardSelector {
    constructor(numCards, properties) {
        super(properties);

        this.numCards = numCards;
    }

    defaultActivePromptTitle() {
        return this.numCards === 1 ? 'Select a character' : `Select ${this.numCards} characters`;
    }

    hasEnoughSelected(selectedCards) {
        return (
            (selectedCards.length === 0 && this.optional) || selectedCards.length === this.numCards
        );
    }

    hasEnoughTargets(context) {
        let numMatchingCards = context.game.allCards.reduce((total, card) => {
            if (this.canTarget(card, context)) {
                return total + 1;
            }
            return total;
        }, 0);

        return this.optional || numMatchingCards >= this.numCards;
    }

    hasReachedLimit(selectedCards) {
        return selectedCards.length >= this.numCards;
    }
}

export default ExactlyXCardSelector;

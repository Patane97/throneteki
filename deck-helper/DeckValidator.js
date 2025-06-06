import AgendaRules from './AgendaRules.js';
import DeckWrapper from './DeckWrapper.js';
import Formats from './Formats/index.js';
import RestrictedList from './RestrictedList.js';

class DeckValidator {
    constructor(packs, formats, restrictedLists, customRules = {}) {
        const now = Date.now();
        this.releasedPackCodes = new Set(
            packs
                .filter((pack) => pack.releaseDate && Date.parse(pack.releaseDate) <= now)
                .map((pack) => pack.code)
        );
        this.formats = formats;
        this.restrictedLists = restrictedLists.map((rl) => new RestrictedList(rl));
        this.customRules = customRules;
    }

    validateDeck(rawDeck) {
        const deck = new DeckWrapper(rawDeck);
        const status = {};
        for (const restrictedList of this.restrictedLists) {
            for (const format of this.formats) {
                const errors = [];
                const rules = this.getRules(deck, format);

                if (deck.plotCount < rules.requiredPlots) {
                    errors.push('Too few plot cards');
                } else if (deck.plotCount > rules.requiredPlots) {
                    errors.push('Too many plot cards');
                }

                if (deck.drawCount < rules.requiredDraw) {
                    errors.push('Too few draw cards');
                }

                for (const rule of rules.rules) {
                    if (!rule.condition(deck, errors)) {
                        errors.push(rule.message);
                    }
                }

                const cannotIncludeCards = [];
                for (const card of deck.getCardsIncludedInDeck()) {
                    if (!rules.mayInclude(card) || rules.cannotInclude(card)) {
                        cannotIncludeCards.push(card.label);
                    }
                }
                if (cannotIncludeCards.length > 0) {
                    errors.push(
                        'Cards not allowed by faction or agenda: ' + cannotIncludeCards.join(', ')
                    );
                }

                const unreleasedCards = [];
                if (format !== 'draft') {
                    for (const card of deck.getUniqueCards()) {
                        if (!this.releasedPackCodes.has(card.packCode)) {
                            unreleasedCards.push(card.label);
                        }
                    }
                }
                if (unreleasedCards.length > 0) {
                    errors.push('Cards are not yet released: ' + unreleasedCards.join(', '));
                }

                const cardCountByName = deck.getCardCountsByName();
                const doubledPlots = Object.values(cardCountByName).filter(
                    (card) => card.type === 'plot' && card.count === 2
                );
                if (doubledPlots.length > rules.maxDoubledPlots) {
                    errors.push(
                        'Maximum allowed number of doubled plots: ' + rules.maxDoubledPlots
                    );
                }

                for (const card of Object.values(cardCountByName)) {
                    if (card.count > card.limit) {
                        errors.push(card.name + ' has limit ' + card.limit);
                    }
                }

                const restrictedListResult = restrictedList.validate(deck, format) || {
                    valid: true,
                    version: ''
                };
                const restrictedListErrors = restrictedListResult.errors;

                status[restrictedList.rules._id] = status[restrictedList.rules._id] || {};
                status[restrictedList.rules._id][format] = {
                    basicRules: errors.length === 0,
                    valid: restrictedListResult.valid,
                    faqVersion: restrictedListResult.version,
                    restrictedList: restrictedListResult,
                    noUnreleasedCards: unreleasedCards.length === 0,
                    extendedStatus: errors.concat(restrictedListErrors)
                };
            }
        }
        return status;
    }

    getRules(deck, gameFormat) {
        const formatRules =
            Formats.find((format) => format.name === gameFormat) ||
            Formats.find((format) => format.name === 'joust');
        const customizedFormatRules = Object.assign({}, formatRules, this.customRules);
        let factionRules = this.getFactionRules(deck.faction.value.toLowerCase());
        let agendaRules = this.getAgendaRules(deck);

        return this.combineValidationRules(
            [customizedFormatRules, factionRules].concat(agendaRules)
        );
    }

    getFactionRules(faction) {
        return {
            mayInclude: (card) => card.faction === faction || card.faction === 'neutral'
        };
    }

    getAgendaRules(deck) {
        return deck.agendas.map((agenda) => AgendaRules[agenda.code]).filter((a) => !!a);
    }

    combineValidationRules(validators) {
        let mayIncludeFuncs = validators
            .map((validator) => validator.mayInclude)
            .filter((v) => !!v);
        let cannotIncludeFuncs = validators
            .map((validator) => validator.cannotInclude)
            .filter((v) => !!v);
        let combinedRules = validators.reduce(
            (rules, validator) => rules.concat(validator.rules || []),
            []
        );
        let combined = {
            mayInclude: (card) => mayIncludeFuncs.some((func) => func(card)),
            cannotInclude: (card) => cannotIncludeFuncs.some((func) => func(card)),
            rules: combinedRules
        };

        return Object.assign({}, ...validators, combined);
    }

    isDraftCard(card) {
        return card && card.packCode === 'VDS';
    }
}

export default DeckValidator;

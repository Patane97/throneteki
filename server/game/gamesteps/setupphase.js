import sample from 'lodash.sample';
import Phase from './phase.js';
import SimpleStep from './simplestep.js';
import KeepOrMulliganPrompt from './setup/keepormulliganprompt.js';
import SetupCardsPrompt from './setup/setupcardsprompt.js';
import CheckAttachmentsPrompt from './setup/checkattachmentsprompt.js';
import TextHelper from '../TextHelper.js';
import { StartingHandSize } from '../Constants/index.js';

class SetupPhase extends Phase {
    constructor(game) {
        super(game, 'setup');
        this.initialise([
            new SimpleStep(game, () => this.announceFactionAndAgenda()),
            new SimpleStep(game, () => this.prepareDecks()),
            new SimpleStep(game, () => this.randomFirstPlayer()),
            new SimpleStep(game, () => this.turnOnEffects()),
            new SimpleStep(game, () => this.drawSetupHand()),
            new KeepOrMulliganPrompt(game),
            new SimpleStep(game, () => this.startGame()),
            new SetupCardsPrompt(game),
            new SimpleStep(game, () => this.announceSetupCards()),
            new SimpleStep(game, () => this.setupDone()),
            new CheckAttachmentsPrompt(game),
            new SimpleStep(game, () => game.activatePersistentEffects())
        ]);
        this.sampleFunc = sample;
    }

    announceFactionAndAgenda() {
        for (const player of this.game.getPlayers()) {
            player.createFactionAndAgendas();
            this.game.addMessage(
                '{0} announces they are playing as {1} with {2}',
                player,
                player.faction,
                player.agendas || 'no agenda'
            );
        }
    }

    prepareDecks() {
        for (const player of this.game.getPlayers()) {
            player.prepareDecks();
        }
        this.game.gatherAllCards();
        this.game.raiseEvent('onDecksPrepared');
    }

    randomFirstPlayer() {
        const firstPlayer = this.sampleFunc(this.game.getPlayers());
        this.game.addMessage('{0} has been randomly selected to be first player', firstPlayer);
        this.game.setFirstPlayer(firstPlayer);
    }

    turnOnEffects() {
        for (const card of this.game.allCards) {
            card.applyAnyLocationPersistentEffects();

            if (card.getType() === 'agenda') {
                card.applyPersistentEffects();
            }
        }
    }

    drawSetupHand() {
        for (const player of this.game.getPlayers()) {
            player.drawCardsToHand(StartingHandSize);
        }
    }

    startGame() {
        for (const player of this.game.getPlayers()) {
            player.readyToStart = true;
            this.game.addGold(player, player.setupGold);
        }
    }

    announceSetupCards() {
        for (const player of this.game.getPlayers()) {
            let cardsInShadow = player.shadows.length;
            let cards = [...player.cardsInPlay];
            player.flipSetupCardsFaceUp();

            if (cardsInShadow > 0) {
                cards.push(`${TextHelper.count(cardsInShadow, 'card')} into shadows`);
            }

            if (cards.length === 0) {
                this.game.addMessage('{0} does not set up any cards', player);
            } else {
                this.game.addMessage('{0} sets up {1}', player, cards);
            }
        }
    }

    setupDone() {
        for (const player of this.game.getPlayers()) {
            // Draw back up to starting hand size
            if (player.hand.length < StartingHandSize) {
                player.drawCardsToHand(StartingHandSize - player.hand.length);
            }

            this.game.returnGoldToTreasury({ player: player, amount: player.gold });
            player.revealSetupCards();
        }
        this.game.raiseEvent('onSetupFinished');
    }
}

export default SetupPhase;

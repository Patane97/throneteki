import CardReaction from '../../../server/game/cardreaction.js';
import Event from '../../../server/game/event.js';

describe('CardReaction', function () {
    beforeEach(function () {
        this.gameSpy = jasmine.createSpyObj('game', [
            'on',
            'popAbilityContext',
            'pushAbilityContext',
            'queueStep',
            'removeListener',
            'registerAbility',
            'resolveGameAction'
        ]);
        this.cardSpy = jasmine.createSpyObj('card', [
            'getPrintedType',
            'getPrintedType',
            'isAnyBlank',
            'createSnapshot'
        ]);
        this.cardSpy.location = 'play area';
        this.cardSpy.createSnapshot.and.returnValue(this.cardSpy);
        this.limitSpy = jasmine.createSpyObj('limit', [
            'increment',
            'isAtMax',
            'registerEvents',
            'unregisterEvents'
        ]);

        this.properties = {
            when: {
                onSomething: jasmine.createSpy('when condition')
            },
            handler: jasmine.createSpy('handler')
        };

        this.properties.when.onSomething.and.returnValue(true);

        this.createReaction = () => {
            return new CardReaction(this.gameSpy, this.cardSpy, this.properties);
        };
    });

    describe('constructor', function () {
        describe('location', function () {
            it('should default to play area', function () {
                this.action = new CardReaction(this.gameSpy, this.cardSpy, this.properties);
                expect(this.action.location).toContain('play area');
            });

            it('should default to agenda for cards with type agenda', function () {
                this.cardSpy.getPrintedType.and.returnValue('agenda');
                this.action = new CardReaction(this.gameSpy, this.cardSpy, this.properties);
                expect(this.action.location).toContain('agenda');
            });

            it('should default to active plot for cards with type plot', function () {
                this.cardSpy.getPrintedType.and.returnValue('plot');
                this.action = new CardReaction(this.gameSpy, this.cardSpy, this.properties);
                expect(this.action.location).toContain('active plot');
            });

            it('should default to hand for cards with type event', function () {
                this.cardSpy.getPrintedType.and.returnValue('event');
                this.action = new CardReaction(this.gameSpy, this.cardSpy, this.properties);
                expect(this.action.location).toContain('hand');
            });

            it('should use the location sent via properties', function () {
                this.properties.location = 'foo';
                this.action = new CardReaction(this.gameSpy, this.cardSpy, this.properties);
                expect(this.action.location).toContain('foo');
            });
        });

        describe('player', function () {
            beforeEach(function () {
                this.controller = { controller: true };
                this.cardSpy.controller = this.controller;
            });

            it("should default to a function returning the source card's controller", function () {
                this.reaction = new CardReaction(this.gameSpy, this.cardSpy, this.properties);
                expect(this.reaction.playerFunc()).toBe(this.controller);
            });

            it('should allow a custom function to be specified', function () {
                let foo = { foo: true };
                this.properties.player = () => foo;
                this.reaction = new CardReaction(this.gameSpy, this.cardSpy, this.properties);
                expect(this.reaction.playerFunc()).toBe(foo);
            });
        });
    });

    describe('eventHandler()', function () {
        beforeEach(function () {
            this.executeEventHandler = (args = {}) => {
                this.event = new Event('onSomething', args);
                this.reaction = new CardReaction(this.gameSpy, this.cardSpy, this.properties);
                this.reaction.abilityTriggers[0].eventHandler(this.event);
            };
            this.executeAggregateEventHandler = () => {
                this.event = new Event('onSimultaneous');
                this.childEvent1 = new Event('onSomething', { arg1: 'val1', arg2: 'val2' });
                this.childEvent2 = new Event('onSomething', { arg1: 'val1', arg2: 'val3' });
                this.childEvent3 = new Event('onSomething', { arg1: 'val1', arg2: 'val3' });
                this.event.addChildEvent(this.childEvent1);
                this.event.addChildEvent(this.childEvent2);
                this.event.addChildEvent(this.childEvent3);
                this.reaction = new CardReaction(this.gameSpy, this.cardSpy, this.properties);

                this.reaction.abilityTriggers[0].eventHandler(this.event);
            };
        });

        it('should call the when handler with the appropriate arguments', function () {
            this.executeEventHandler();
            expect(this.properties.when.onSomething).toHaveBeenCalledWith(
                this.event,
                jasmine.anything()
            );
        });

        describe('when the singular condition returns false', function () {
            beforeEach(function () {
                this.properties.when.onSomething.and.returnValue(false);
                this.executeEventHandler();
            });

            it('should not register the ability', function () {
                expect(this.gameSpy.registerAbility).not.toHaveBeenCalled();
            });
        });

        describe('when the aggregate condition returns false', function () {
            beforeEach(function () {
                this.properties.when.onSomething = {
                    aggregateBy: () => ({}),
                    condition: () => false
                };
                this.executeAggregateEventHandler();
            });

            it('should not register any abilities', function () {
                expect(this.gameSpy.registerAbility).not.toHaveBeenCalled();
            });
        });

        describe('when the singular condition returns true', function () {
            beforeEach(function () {
                this.properties.when.onSomething.and.returnValue(true);
                this.executeEventHandler();
            });

            it('should register the ability', function () {
                expect(this.gameSpy.registerAbility).toHaveBeenCalledWith(
                    this.reaction,
                    jasmine.objectContaining({
                        ability: this.reaction,
                        event: this.event,
                        game: this.gameSpy,
                        source: this.cardSpy
                    })
                );
            });
        });

        describe('when the aggregate condition returns one true', function () {
            beforeEach(function () {
                this.properties.when.onSomething = {
                    aggregateBy: (event) => ({
                        arg1: event.arg1,
                        arg2: event.arg2
                    }),
                    condition: (aggregate) => aggregate.arg2 === 'val2'
                };
                this.executeAggregateEventHandler();
            });

            it('should only register the one ability', function () {
                expect(this.gameSpy.registerAbility).toHaveBeenCalledWith(
                    this.reaction,
                    jasmine.objectContaining({
                        events: jasmine.arrayContaining([this.childEvent1])
                    })
                );
                expect(this.gameSpy.registerAbility.calls.count()).toBe(1);
            });
        });

        describe('when the aggregate condition returns multiple true', function () {
            beforeEach(function () {
                this.properties.when.onSomething = {
                    aggregateBy: (event) => ({
                        arg1: event.arg1,
                        arg2: event.arg2
                    }),
                    condition: (aggregate) => aggregate.arg1 === 'val1'
                };
                this.executeAggregateEventHandler();
            });

            it('should register each ability grouped by aggregate', function () {
                expect(this.gameSpy.registerAbility).toHaveBeenCalledWith(
                    this.reaction,
                    jasmine.objectContaining({
                        aggregate: jasmine.objectContaining({ arg1: 'val1', arg2: 'val2' }),
                        events: jasmine.arrayContaining([this.childEvent1])
                    })
                );
                expect(this.gameSpy.registerAbility).toHaveBeenCalledWith(
                    this.reaction,
                    jasmine.objectContaining({
                        aggregate: jasmine.objectContaining({ arg1: 'val1', arg2: 'val3' }),
                        events: jasmine.arrayContaining([this.childEvent2, this.childEvent3])
                    })
                );
                expect(this.gameSpy.registerAbility.calls.count()).toBe(2);
            });
        });
    });

    describe('meetsRequirements()', function () {
        beforeEach(function () {
            this.event = new Event('onSomething', {});
            this.meetsRequirements = () => {
                this.reaction = new CardReaction(this.gameSpy, this.cardSpy, this.properties);
                this.context = this.reaction.createContext(this.event);
                return this.reaction.meetsRequirements(this.context);
            };
        });

        it('should call the when handler with the appropriate arguments', function () {
            this.meetsRequirements();
            expect(this.properties.when.onSomething).toHaveBeenCalledWith(
                this.event,
                jasmine.anything()
            );
        });

        describe('when in the setup phase', function () {
            beforeEach(function () {
                this.gameSpy.currentPhase = 'setup';
            });

            it('should return false', function () {
                expect(this.meetsRequirements()).toBe(false);
            });
        });

        describe('when the card has been blanked', function () {
            beforeEach(function () {
                this.cardSpy.isAnyBlank.and.returnValue(true);
            });

            it('should return false', function () {
                expect(this.meetsRequirements()).toBe(false);
            });
        });

        describe('when the singular condition returns false', function () {
            beforeEach(function () {
                this.properties.when.onSomething.and.returnValue(false);
            });

            it('should return false', function () {
                expect(this.meetsRequirements()).toBe(false);
            });
        });

        describe('when the aggregate condition returns false', function () {
            beforeEach(function () {
                this.properties.when.onSomething = {
                    aggregateBy: jasmine.createSpy().and.returnValue({}),
                    condition: jasmine.createSpy().and.returnValue(false)
                };
            });

            it('should return false', function () {
                expect(this.meetsRequirements()).toBe(false);
            });
        });

        describe('when the event has already been cancelled', function () {
            beforeEach(function () {
                this.event.cancel();
            });

            it('should return false', function () {
                expect(this.meetsRequirements()).toBe(false);
            });
        });

        describe('when the card is not in the proper location', function () {
            beforeEach(function () {
                this.cardSpy.location = 'foo';
            });

            it('should return false', function () {
                expect(this.meetsRequirements()).toBe(false);
            });
        });

        describe('when there is a limit', function () {
            beforeEach(function () {
                this.properties.limit = this.limitSpy;
            });

            describe('and the limit has been reached', function () {
                beforeEach(function () {
                    this.limitSpy.isAtMax.and.returnValue(true);
                });

                it('should return false', function () {
                    expect(this.meetsRequirements()).toBe(false);
                });
            });

            describe('and the limit has not been reached', function () {
                beforeEach(function () {
                    this.limitSpy.isAtMax.and.returnValue(false);
                });

                it('should return true', function () {
                    expect(this.meetsRequirements()).toBe(true);
                });
            });
        });

        describe('when the reaction has a cost', function () {
            beforeEach(function () {
                this.cost = jasmine.createSpyObj('cost', ['canPay']);
                this.properties.cost = this.cost;
            });

            describe('and the cost can be paid', function () {
                beforeEach(function () {
                    this.cost.canPay.and.returnValue(true);
                });

                it('should return true', function () {
                    expect(this.meetsRequirements()).toBe(true);
                });
            });

            describe('and the cost cannot be paid', function () {
                beforeEach(function () {
                    this.cost.canPay.and.returnValue(false);
                });

                it('should return false', function () {
                    expect(this.meetsRequirements()).toBe(false);
                });
            });
        });
    });

    describe('executeHandler()', function () {
        beforeEach(function () {
            this.context = { context: 1, game: this.gameSpy };
            this.properties = {
                when: {
                    onSomething: () => true
                },
                handler: jasmine.createSpy('handler')
            };
            this.reaction = this.createReaction();
            this.reaction.executeHandler(this.context);
        });

        it('resolves the game action', function () {
            expect(this.gameSpy.resolveGameAction).toHaveBeenCalledWith(
                jasmine.any(Object),
                this.context
            );
        });
    });

    describe('registerEvents()', function () {
        beforeEach(function () {
            this.properties = {
                when: {
                    onFoo: () => true,
                    onBar: () => true,
                    onAgg: {
                        aggregateBy: {},
                        condition: () => true
                    }
                },
                handler: () => true
            };
            this.reaction = this.createReaction();
            this.reaction.registerEvents();
        });

        it('should register all when event handlers with the proper event type suffix', function () {
            expect(this.gameSpy.on).toHaveBeenCalledWith('onFoo:reaction', jasmine.any(Function));
            expect(this.gameSpy.on).toHaveBeenCalledWith('onBar:reaction', jasmine.any(Function));
        });

        it('should register a singular event with no suffix for aggregates', function () {
            expect(this.gameSpy.on).toHaveBeenCalledWith('reaction', jasmine.any(Function));
        });

        it('should not reregister events already registered', function () {
            expect(this.gameSpy.on.calls.count()).toBe(3);
            this.reaction.registerEvents();
            expect(this.gameSpy.on.calls.count()).toBe(3);
        });
    });

    describe('unregisterEvents', function () {
        beforeEach(function () {
            this.properties = {
                when: {
                    onFoo: () => true,
                    onBar: () => true,
                    onAgg: {
                        aggregateBy: {},
                        condition: () => true
                    }
                },
                handler: () => true
            };
            this.reaction = this.createReaction();
        });

        it('should unregister all previously registered when event handlers', function () {
            this.reaction.registerEvents();
            this.reaction.unregisterEvents();
            expect(this.gameSpy.removeListener).toHaveBeenCalledWith(
                'onFoo:reaction',
                jasmine.any(Function)
            );
            expect(this.gameSpy.removeListener).toHaveBeenCalledWith(
                'onBar:reaction',
                jasmine.any(Function)
            );
            expect(this.gameSpy.removeListener).toHaveBeenCalledWith(
                'reaction',
                jasmine.any(Function)
            );
        });

        it('should not remove listeners when they have not been registered', function () {
            this.reaction.unregisterEvents();
            expect(this.gameSpy.removeListener).not.toHaveBeenCalled();
        });

        it('should not unregister events already unregistered', function () {
            this.reaction.registerEvents();
            this.reaction.unregisterEvents();
            expect(this.gameSpy.removeListener.calls.count()).toBe(3);
            this.reaction.unregisterEvents();
            expect(this.gameSpy.removeListener.calls.count()).toBe(3);
        });
    });
});

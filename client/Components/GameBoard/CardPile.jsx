import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import Card from './Card';
import CardTiledList from './CardTiledList';
import Droppable from './Droppable';
import MovablePanel from './MovablePanel';

class CardPile extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            showPopup: !!props.cards && props.cards.some((card) => card.selectable),
            showMenu: false
        };

        this.onCollectionClick = this.onCollectionClick.bind(this);
        this.onTopCardClick = this.onTopCardClick.bind(this);
        this.onCloseClick = this.onCloseClick.bind(this);
        this.onMenuItemClick = this.onMenuItemClick.bind(this);
    }

    componentWillReceiveProps(props) {
        let hasNewSelectableCard = props.cards && props.cards.some((card) => card.selectable);
        let didHaveSelectableCard =
            this.props.cards && this.props.cards.some((card) => card.selectable);

        if (!didHaveSelectableCard && hasNewSelectableCard) {
            this.updatePopupVisibility(true);
        } else if (didHaveSelectableCard && !hasNewSelectableCard) {
            this.updatePopupVisibility(false);
        }
    }

    togglePopup() {
        this.updatePopupVisibility(!this.state.showPopup);
    }

    updatePopupVisibility(value) {
        this.setState({ showPopup: value });

        if (this.props.onPopupChange) {
            this.props.onPopupChange({ source: this.props.source, visible: value });
        }
    }

    onCollectionClick(event) {
        event.preventDefault();

        if (this.props.menu) {
            this.setState({ showMenu: !this.state.showMenu });
            return;
        }

        if (!this.props.disablePopup) {
            this.togglePopup();
        }
    }

    onMenuItemClick(menuItem) {
        if (menuItem.showPopup) {
            this.togglePopup();
        }

        if (menuItem.handler) {
            menuItem.handler();
        }

        if (this.props.onMenuItemClick) {
            this.props.onMenuItemClick(this.props.topCard, menuItem);
            this.setState({ showMenu: !this.state.showMenu });
        }
    }

    onCloseClick(event) {
        event.preventDefault();
        event.stopPropagation();

        this.togglePopup();
    }

    onPopupMenuItemClick(menuItem) {
        if (menuItem.handler) {
            menuItem.handler();
        }

        if (menuItem.close) {
            this.togglePopup();
        }
    }

    onTopCardClick() {
        if (this.props.menu) {
            this.setState({ showMenu: !this.state.showMenu });
            return;
        }

        if (this.props.disablePopup || this.isTopCardSelectable) {
            if (this.props.onCardClick && this.props.topCard) {
                this.props.onCardClick(this.props.topCard);
            }

            return;
        }

        this.togglePopup();
    }

    get isTopCardSelectable() {
        if (!this.props.topCard) {
            return false;
        }

        return (
            this.props.topCard.selectable &&
            (!this.props.cards || this.props.cards.every((card) => card.unselectable))
        );
    }

    onCardClick(card) {
        if (this.props.closeOnClick) {
            this.updatePopupVisibility(false);
        }

        if (this.props.onCardClick) {
            this.props.onCardClick(card);
        }
    }

    getPopup() {
        let popup = null;
        let cardList = [];

        let listProps = {
            disableMouseOver: this.props.disableMouseOver,
            onCardClick: this.onCardClick.bind(this),
            onCardMouseOut: this.props.onMouseOut,
            onCardMouseOver: this.props.onMouseOver,
            onTouchMove: this.props.onTouchMove,
            onMenuItemClick: this.props.onMenuItemClick,
            size: this.props.size,
            source: this.props.source
        };
        if (this.props.showCards) {
            for (const card of this.props.cards) {
                card.facedown = false;
            }
        }
        if (this.props.cards && this.props.cards.some((card) => card.group)) {
            const cardGroup = this.props.cards.reduce((grouping, card) => {
                (grouping[card.group] = grouping[card.group] || []).push(card);

                return grouping;
            }, {});
            const sortedKeys = Object.keys(cardGroup).sort();
            for (const key of sortedKeys) {
                cardList.push(
                    <CardTiledList cards={cardGroup[key]} key={key} title={key} {...listProps} />
                );
            }
        } else {
            cardList = <CardTiledList cards={this.props.cards} {...listProps} />;
        }

        if (this.props.disablePopup || !this.state.showPopup) {
            return null;
        }

        let popupClass = classNames('panel', {
            'our-side': this.props.popupLocation === 'bottom'
        });

        let innerClass = classNames('inner', this.props.size);
        let linkIndex = 0;

        let popupMenu = this.props.popupMenu && (
            <div className='card-pile-buttons'>
                {this.props.popupMenu.map((menuItem) => {
                    return (
                        <a
                            className='btn btn-default'
                            key={linkIndex++}
                            onClick={() => this.onPopupMenuItemClick(menuItem)}
                        >
                            {menuItem.icon && (
                                <span className={`glyphicon glyphicon-${menuItem.icon}`} />
                            )}{' '}
                            {menuItem.text}
                        </a>
                    );
                })}
            </div>
        );

        popup = (
            <MovablePanel
                title={this.props.title}
                name={this.props.source}
                onCloseClick={this.onCloseClick}
                side={this.props.popupLocation}
            >
                <Droppable onDragDrop={this.props.onDragDrop} source={this.props.source}>
                    <div className={popupClass} onClick={(event) => event.stopPropagation()}>
                        {popupMenu}
                        <div className={innerClass}>{cardList}</div>
                    </div>
                </Droppable>
            </MovablePanel>
        );

        return popup;
    }

    render() {
        let className = classNames('panel', 'card-pile', this.props.className, {
            [this.props.size]: this.props.size !== 'normal',
            horizontal:
                this.props.orientation === 'horizontal' || this.props.orientation === 'kneeled',
            vertical: this.props.orientation === 'vertical'
        });

        let cardCount = this.props.cardCount || (this.props.cards ? this.props.cards.length : '0');
        let headerText = this.props.title ? this.props.title + ' (' + cardCount + ')' : '';
        let topCard = this.props.topCard || (this.props.cards ? this.props.cards[0] : null);
        let cardOrientation =
            this.props.orientation === 'horizontal' && topCard && topCard.facedown
                ? 'kneeled'
                : this.props.orientation;

        if (this.props.hiddenTopCard && !this.props.topCard) {
            topCard = { facedown: true };
        }

        let menu;
        // Note "Open/Close Popup" item will never be available for CardPiles in locations that use select in non-triggerable ways (eg. click to force stand or kneel)
        // For example, if CardPile is ever used in play area, it will need to know when "clicking" on it is a valid option to do something
        if (!this.props.disablePopup && this.props.topCard && this.props.topCard.selectable) {
            menu = [{ showPopup: true, text: `${this.state.showPopup ? 'Close' : 'Open'} Popup` }];
        }

        return (
            <div className={className} onClick={this.onCollectionClick}>
                <div className='panel-header'>{headerText}</div>
                {topCard ? (
                    <Card
                        card={topCard}
                        source={this.props.source}
                        onMouseOver={this.props.onMouseOver}
                        onMouseOut={this.props.onMouseOut}
                        disableMouseOver={this.props.hiddenTopCard}
                        menu={menu}
                        onClick={this.onTopCardClick}
                        onMenuItemClick={this.props.onMenuItemClick}
                        orientation={cardOrientation}
                        size={this.props.size}
                    />
                ) : (
                    <div className='card-placeholder' />
                )}
                {this.getPopup()}
            </div>
        );
    }
}

CardPile.displayName = 'CardPile';
CardPile.propTypes = {
    cardCount: PropTypes.number,
    cards: PropTypes.array,
    className: PropTypes.string,
    closeOnClick: PropTypes.bool,
    disableMouseOver: PropTypes.bool,
    disablePopup: PropTypes.bool,
    hiddenTopCard: PropTypes.bool,
    onCardClick: PropTypes.func,
    onDragDrop: PropTypes.func,
    onMenuItemClick: PropTypes.func,
    onMouseOut: PropTypes.func,
    onMouseOver: PropTypes.func,
    onPopupChange: PropTypes.func,
    onTouchMove: PropTypes.func,
    orientation: PropTypes.string,
    popupLocation: PropTypes.string,
    popupMenu: PropTypes.array,
    showCards: PropTypes.bool,
    size: PropTypes.string,
    source: PropTypes.oneOf([
        'hand',
        'discard pile',
        'play area',
        'dead pile',
        'draw deck',
        'plot deck',
        'revealed plots',
        'selected plot',
        'attachment',
        'agenda',
        'faction',
        'additional',
        'agenda',
        'shadows'
    ]).isRequired,
    title: PropTypes.string,
    topCard: PropTypes.object
};
CardPile.defaultProps = {
    popupLocation: 'bottom',
    orientation: 'vertical'
};

export default CardPile;

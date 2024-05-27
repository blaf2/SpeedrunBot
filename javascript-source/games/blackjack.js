
var Card = function (suit, number){
    /** @returns {Number} The number of the card in the deck. (1-52) */
    this.getNumber = function (){
        return number;  
    };

    /** @returns {String} The HTML-encoded symbol of the suit. */
    this.getSymbol = function (){
        var suitName = '';
        switch (suit){
            case 1:
                suitName = "♥";
                break;
            case 2:
                suitName = "♣";
                break; 
            case 3:
                suitName = "♠";
                break; 
            case 4:
                suitName = "♦";
                break;                
        }
        return suitName;
    };
    /** @returns {Number} The value of the card for scoring. */
    this.getValue = function (){
        var value = number;
        if (number > 10){
            value = 10;
        }
        //if(number === 1) {
        //    value = 11;
        //}
        return value;
    };
    /** @returns {String} The full name of the card. "Ace of Spades" */
    this.getName = function (){
        var cardName = '';
        switch (number){
            case 1:
                cardName = "A";
                break;
            case 13:
                cardName = "K";
                break;
            case 12:
               cardName = "Q";
                break;
            case 11:
                cardName = "J";
                break;
            default:
                cardName = number;
                break;
        }
        return cardName+this.getSymbol();
    };
};

    var Deck = function (){
    var cards = [];
    /** Creates a new set of cards. */
    var newCards = function (){
        var i,
            suit,
            number;
        for (i=0;i<52;i++){
            suit = i%4+1;
            number = i%13+1;
            cards.push(new Card(suit,number));
        }
    };
    /* Create those new cards. */
    newCards();
    /** Shuffles the cards. Modifies the private instance of the cards array.
     * @returns {Array} An array of Cards representing the shuffled version of the deck.
     */
    this.shuffle = function (){
        for(var j, x, i = cards.length; i; j = parseInt(Math.random() * i), x = cards[--i], cards[i] = cards[j], cards[j] = x);
        return this.getCards();
    };
    /** @returns {Array} An array of cards representing the Deck. */
    this.getCards = function (){
        return cards;
    };
    /** @returns {Card} Deals the top card off the deck. Removes it from the Deck. */
    this.deal = function (){
        if (!cards.length){
            newCards();
            this.shuffle();
        }
        return cards.pop();
    };
};

/**
 * moduleExample.js
 *
 * This module will generate a random string of letters when we type the command in chat.
 */
(function() {
    // Global variables for this script if needed.
    var myRandomVariableToGetAndSetDbString = $.getSetIniDbString('my_db_table', 'my_db_key', 'my_db_string'),
        myRandomVariableToGetAndSetDbBoolean = $.getSetIniDbBoolean('my_db_table', 'my_db_key', false),
        minBet = $.getSetIniDbNumber('blackjack', 'minBet', 50),
        myRandomStaticVariable = 'something',
        state = 0,
        deck = null
        userInfo = {}
        waiting = null,
        dealerCards = [],
        timeExpired = false,
        startupTimer = null,
        gotAPlayer = false;

    function getCardValues(cards){
        var amount = 0;
        var hasAce = false;
        for (c in cards){
            amount += cards[c].getValue();
            if (cards[c].getValue() == 1)
                hasAce = true;
        }
        if (amount < 12 && hasAce)
            amount += 10;
        return amount;
    }

    function allPlayersFinished(){
        if (state != 2)
            return;
        for (p in userInfo){
            if (userInfo[p][0] != 2)
                return;
        }
        state = 3;
        givePayouts();          
        start();
    }

    function payPlayer(user, name, blackjack, dealerScore){
        var multiplier = 0;
        var score = getCardValues(user[1]);
        if (score == 21 && user[1].length == 2 && !blackjack)
            multiplier = 2.5;
        else if (score == 21 && user[1].length == 2 && blackjack)
            multiplier = 1;
        else if (blackjack)
            multiplier = 0;
        else if (score < 22 && dealerScore > 21)
            multiplier = 2;
        else if (score > 21)
            multiplier = 0;
        else if (score > dealerScore)
            multiplier = 2;
        else if (score == dealerScore)
            multiplier = 1;

        var pointsWon = Math.ceil(user[2]*multiplier);

        if (pointsWon > 0){
            $.say($.whisperPrefix(name) + 'You won ' + pointsWon + ' ' + $.inidb.get('pointSettings', 'pointNameMultiple') +'!');
            $.inidb.incr('points', name, pointsWon);
            return;
        }

        $.say($.whisperPrefix(name) + 'You\'re a loser!');
    }

    function giveMoneyBack(){
        for (p in userInfo){
            $.say($.whisperPrefix(p) + 'You got your ' + $.inidb.get('pointSettings', 'pointNameMultiple') + ' back.');
            $.inidb.incr('points', p, userInfo[p][2]);
        }
    }

    function start(sender) {
        if (state != 0)
            return;
        $.say('Blackjack will begin in 30 seconds! Use !b [bet] to join before it starts!');
        deck = new Deck();
        deck.shuffle();
        userInfo = {};
        dealerCards = [];
        timeExpired = false;
        gotAPlayer = false;
        state = 1;
        waiting = setTimeout(tryBeginGame, 30000);
    }

    function startup(){
        start('sender');
        clearTimeout(startupTimer);
    }

    function setMin(min, sender){
        $.inidb.set('blackjack', 'minBet', min);
        minBet = min;
        $.say($.whisperPrefix(sender) + 'Minimum bet has been set to ' + minBet);
    }

    function dealme(bet, sender){
        var user;
        if(state != 1){
            return;
        }
        if(!(sender in userInfo))
        {
            userInfo[sender] = {}; 
            userInfo[sender][0] = 0;
        }
        user = userInfo[sender];
        if(user[0] != 0)
        {
            //$.say($.whisperPrefix(sender) + 'not right now');
            return;
        }
        var cards = [];
        cards[0]= deck.deal(),
        cards[1] = deck.deal();
        $.say($.whisperPrefix(sender) + 'You were dealt ' + cards[0].getName() + ' ' + cards[1].getName());
        $.inidb.decr('points', sender, bet);
        if (getCardValues(cards) == 21){
            user[0] = 2;
            $.say(sender + ' got blackjack!');
        }else{
            user[0] = 1;
            
        }
        user[1] = cards;
        user[2] = bet;
        gotAPlayer = true;
        if (timeExpired)
            beginGame();      
    }

    function tryBeginGame(){
        timeExpired = true;
        if (gotAPlayer)
            beginGame();
    }

    function beginGame(){
        if (state != 1)
            return;
        dealerCards = [];
        dealerCards[0] = deck.deal();
        dealerCards[1] = deck.deal();
        $.say('Dealer\'s first card is ' + dealerCards[0].getName());
        state = 2;
        allPlayersFinished();
    }

    function hit(sender){
        if (state != 2 || !(sender in userInfo) || userInfo[sender][0] != 1)
            return;
        var user;
        user = userInfo[sender];
        var cards = user[1];
        var card = deck.deal()
        cards.push(card);
        $.say($.whisperPrefix(sender) + 'You were dealt  ' + card.getName());
        if (getCardValues(cards) == 21){
            user[0] = 2;
            $.say(sender + ' has 21!');
        }
        else if(getCardValues(cards) > 21){
            user[0] = 2;
            $.say(sender + ' bust!');
        }
        allPlayersFinished();
    }

    function stay(sender){
        if (state != 2 || !(sender in userInfo) || userInfo[sender][0] != 1)
            return;
        var user = userInfo[sender];
        user[0] = 2
        $.say(sender + ' has ' + getCardValues(user[1]) + '.');
        allPlayersFinished();
    }

    function givePayouts(){
        var toSay = '';
        $.say('Dealer has ' + dealerCards[0].getName() + ' ' + dealerCards[1].getName() + '\n');
        var blackjack = false;
        if (getCardValues(dealerCards) == 21)
        {
            $.say('Dealer has blackjack!');
            blackjack = true;
        }
        else
        {
            while (getCardValues(dealerCards) < 17){
                var card = deck.deal();
                dealerCards.push(card);
               //  $.say('Dealer drew ' + card.getName());
            }
            if (dealerCards.length > 2)
                toSay += ('Dealer drew ' + dealerCards.slice(2, dealerCards.length).map(function(x) { return x.getName() }).join(' ') + ' ');
        }

        var dealerScore = getCardValues(dealerCards);
        if (dealerScore > 21)
        {
            //$.say('Dealer bust!');
            toSay += '(bust)';
            $.say(toSay);
        }
        else if (!blackjack)
        {
            //$.say('Dealer has ' + dealerScore +'.');
            toSay += '(' + dealerScore + ')';
            $.say(toSay);
        }

        for (p in userInfo){
            payPlayer(userInfo[p], p, blackjack, dealerScore);
        }
        state = 0;
    }

    function endGame(sender){
        $.say('Blackjack has ended!');
        giveMoneyBack();
        userInfo = {};
        dealerCards = [];
        state = 0;
        clearTimeout(waiting);
    }

    // Command event for when someone types a command for this module.
    $.bind('command', function(event) {
        var command = event.getCommand(), // command name all lower case.
            sender = event.getSender(),   // user who sent the command lower case.
            args = event.getArgs(),       // each argument after the command in an array.
            action = args[0],
            arg1 = args[1];
        // Command name.
        if (command.equalsIgnoreCase('b')) {
            var actionBet = parseInt(action);
            // Check for arguments, if needed.
            if (action === undefined) {
                // Say something to the user.
                $.say($.whisperPrefix(sender) + 'Usage: !b [action] [arg]');
                // Stop here.
                return;
            }
            else if (action.equalsIgnoreCase('start')){
                start(sender);
            }
            else if (!isNaN(actionBet) && actionBet > 0){
                if (actionBet > $.getUserPoints(sender)){
                    $.say($.whisperPrefix(sender) + 'You don\'t have enough ' + $.inidb.get('pointSettings', 'pointNameMultiple'));
                    return;
                }
                if (actionBet < minBet){
                    $.say($.whisperPrefix(sender) + 'Minimum bet is ' + minBet);
                    return;
                }
                dealme(actionBet, sender);
            }
            else if (action.equalsIgnoreCase('all')){
                actionBet = $.getUserPoints(sender)
                if (actionBet < minBet){
                    $.say($.whisperPrefix(sender) + 'Minimum bet is ' + minBet);
                    return;
                }
                dealme(actionBet, sender);
            }
            else if (action.equalsIgnoreCase('bet')){
                var bet = parseInt(arg1);
                if (arg1.equalsIgnoreCase('all')){
                    bet = $.getUserPoints(sender);
                }
                if (isNaN(bet) || bet < 1)
                {
                    $.say($.whisperPrefix(sender) + 'Usage: !b bet [bet]');
                    return;
                }
                if (bet > $.getUserPoints(sender)){
                    $.say($.whisperPrefix(sender) + 'You don\'t have enough ' + $.inidb.get('pointSettings', 'pointNameMultiple'));
                    return;
                }
                if (bet < minBet){
                    $.say($.whisperPrefix(sender) + 'Minimum bet is ' + minBet);
                    return;
                }

                dealme(bet, sender);
            }
            else if (action.equalsIgnoreCase('hit')){
                hit(sender);
            }
            else if (action.equalsIgnoreCase('stay')){
                stay(sender);
            }
            else if (action.equalsIgnoreCase('stop')){
                endGame(sender);
            }
            else if(action.equalsIgnoreCase('min')){
                var minAmount = parseInt(arg1);
                if (isNaN(minAmount) || minAmount < 1)
                {
                    $.say($.whisperPrefix(sender) + 'Current minimum bet is ' + minBet);
                    return;
                }
                setMin(minAmount, sender);
            }
        }
    });

    function isPositiveInteger(n) {
        return n >>> 0 === parseFloat(n);
    }
    // Event that runs once at boot-up if the module is enabled.
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./games/blackjack.js')) {
            // Register the command with the: module path, command name, and command permission.
            var name = 'b';
            $.registerChatCommand('./games/blackjack.js', name, 7);
            $.registerChatSubcommand(name, 'start', 1);
            $.registerChatSubcommand(name, 'bet', 7);
            $.registerChatSubcommand(name, 'hit', 7);
            $.registerChatSubcommand(name, 'stay', 7);
            $.registerChatSubcommand(name, 'stop', 1);
            $.registerChatSubcommand(name, 'min', 1);
            startupTimer = setTimeout(startup, 20000);
        }
        //if ($.bot.isModuleEnabled('./games/blackjack.js') && !$.bot.isModuleEnabled('./games/blackjack.js')) {
        //$.log.error("Disabled. ./games/blackjack.js is not enabled.");
//}
    });
})();

// INFORMATION ABOUT SUBMITING A PULL-REQUEST FOR A NEW MODULE. PLEASE READ:

// If you're planning on making a module for the master build please take a look at the current scripts and follow their code style
// of we will not merge your pull-request into the master build. Also keep a mind we do take performance really seriously here,
// if your module is going to slow down the bot, or affect performance we will not merge it, if we think the module isn't fit to be 
// in the main build we will also reject it. Another thing, be sure to fully test your module, we will NOT test any pull-request before merging it, 
// if we see an issue we will let you know that there's an issue in the code and you will have to fix it if you want us to merge it. 
// If your module gets merge but causes an issue in the future it will be reverted without any notice.
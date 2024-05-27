/**
Data provided for free by IEX.
https://iextrading.com/api-exhibit-a
https://api.iextrading.com/1.0/stock/{stock}/quote
*/

/**
 * moduleExample.js
 *
 * This module will generate a random string of letters when we type the command in chat.
 */
(function() {
    // Global variables for this script if needed.
    // var testGet = $.getSetIniDbString('stocks', '0', '0'),       
    //     stockMultiplier = 100;

    function buy(sender, symbol, amount){
        var userPoints = $.getUserPoints(sender);
        var stockData = getStockInfo(symbol);
        if (stockData === undefined){
            $.say($.whisperPrefix(sender) + 'Stock symbol does not exist');
            return;
        }
        symbol = symbol.toUpperCase();
        var tPrice = getModifiedStockPrice(stockData.latestPrice) * amount;
        if (userPoints < tPrice){
            $.say($.whisperPrefix(sender) + 'You don\'t have enough ' + $.inidb.get('pointSettings', 'pointNameMultiple'));
            return;
        }
        $.inidb.decr('points', sender, tPrice);
        var userInfo = getStocks(sender);
        changeStockAmount(userInfo, symbol, amount);
        setStocks(sender, userInfo);
        $.say($.whisperPrefix(sender) + 'You purchased ' + amount + ' share(s) of ' + symbol + ' for ' + tPrice + ' ' + $.inidb.get('pointSettings', 'pointNameMultiple'));
    }

    function sell(sender, symbol, amount){
        var stockData = getStockInfo(symbol);
        if (stockData === undefined){
            $.say($.whisperPrefix(sender) + 'Stock symbol does not exist');
            return;
        }
        symbol = symbol.toUpperCase();
        var tPrice = getModifiedStockPrice(stockData.latestPrice) * amount;
        var userInfo = getStocks(sender);
        if (getStockAmount(userInfo, symbol) < amount){
            $.say($.whisperPrefix(sender) + 'You don\'t have enough stock to sell');
            return;
        }
        $.inidb.incr('points', sender, tPrice);
        changeStockAmount(userInfo, symbol, amount * (-1));
        setStocks(sender, userInfo);
        $.say($.whisperPrefix(sender) + 'You sold ' + amount + ' share(s) of ' + symbol + ' worth ' + tPrice + ' ' + $.inidb.get('pointSettings', 'pointNameMultiple'));
    }

    function getPortfolio(sender){
        var userInfo = getStocks(sender);
        var formattedStocks = [];
        var pValue = 0;
        var outputStr = '';
        if (userInfo.stocks.length > 0){
            for (var x in userInfo.stocks){
                var stockData = getStockInfo(userInfo.stocks[x].id);
                if (stockData === undefined || userInfo.stocks[x].amount < 1) { continue; }
                var totalValue = getModifiedStockPrice(stockData.latestPrice) * userInfo.stocks[x].amount;
                formattedStocks.push(userInfo.stocks[x].amount + " share(s) of " + userInfo.stocks[x].id + " worth " + totalValue + ' ' + $.inidb.get('pointSettings', 'pointNameMultiple'));
                pValue += totalValue;
            }
            outputStr += formattedStocks.join(', ') + ' ';
        }
        outputStr += 'Total Worth: ' + pValue;
        $.say($.whisperPrefix(sender) + outputStr);
    }

    function checkStock(sender, symbol, infoType){
        var stockData = getStockInfo(symbol);
        if (stockData === undefined) { 
            $.say($.whisperPrefix(sender) + 'Stock symbol does not exist');
            return;
        }
        var selector = 'latestPrice';
        var label = 'Latest';

            if(infoType.equalsIgnoreCase('open')){
                selector = 'open';
                label = 'Open';
            }
            else if(infoType.equalsIgnoreCase('close')){
                selector = 'close';
                label = 'Close';
            }
            else if(infoType.equalsIgnoreCase('low')){
                selector = 'low';
                label = 'Low';
            }
            else if(infoType.equalsIgnoreCase('high')){
                selector = 'high';
                label = 'High';
            }
            else if(infoType.equalsIgnoreCase('name')){
                selector = 'companyName';
                label = 'Company Name';
            }
            else if(infoType.equalsIgnoreCase('change')){
                selector = 'change';
                label = 'Change';
            }

        $.say($.whisperPrefix(sender) + symbol.toUpperCase() + ' ' + label + ': ' + getModifiedStockPrice(stockData[selector]));
    }

    function getStocks(sender){
        var data = $.getSetIniDbString('stocks', sender, '{"stocks": []}');
        return JSON.parse(data);
    }

    function setStocks(sender, data){
        var toSave = JSON.stringify(data);
        $.setIniDbString('stocks', sender, toSave);
    }

    function getStockAmount(data, symbol){
        var result = data.stocks.find(function(x){return x.id === symbol});
        if (result === undefined) {
            return 0;
        }
        return result.amount;
    }

    function changeStockAmount(data, symbol, amount){
        for (var i = 0; i < data.stocks.length; i++) {
            if (data.stocks[i].id === symbol) {
                data.stocks[i].amount += amount;
                return;
            }
        }
        data.stocks.push({'id': symbol, 'amount': amount});
    }

    function getStockInfo(symbol){
        var response = $.customAPI.get("https://api.iextrading.com/1.0/stock/" + symbol + "/quote").content;
        var obj;
        try {
            obj = JSON.parse(response);
        }
        catch(e){}
        return obj;
    }

    function getModifiedStockPrice(price){
        if (isNaN(price)) {
            return price;
        }
        return Math.ceil(price * 100);
    }

    // Command event for when someone types a command for this module.
    $.bind('command', function(event) {
        var command = event.getCommand(), // command name all lower case.
            sender = event.getSender(),   // user who sent the command lower case.
            args = event.getArgs(),       // each argument after the command in an array.
            action = args[0],
            arg1 = args[1];
            arg2 = args[2];
        // Command name.
        if (command.equalsIgnoreCase('s')) {
            // Check for arguments, if needed.
            if (action === undefined) {
                // Say something to the user.
                $.say($.whisperPrefix(sender) + 'Usage: !s [action] [arg1] [arg2]');
                // Stop here.
                return;
            }
            else if (action.equalsIgnoreCase('buy')){
                var amount = parseInt(arg2);
                if (arg1 === undefined){
                    $.say($.whisperPrefix(sender) + 'Usage: !s buy [symbol] [amount]');
                    return;
                }
                if (isNaN(amount) || amount < 1){
                    amount = 1;
                }
                buy(sender, String(arg1), amount);
            }
            else if (action.equalsIgnoreCase('sell')){
                var amount = parseInt(arg2);
                if (arg1 === undefined){
                    $.say($.whisperPrefix(sender) + 'Usage: !s sell [symbol] [amount]');
                    return;
                }
                if (isNaN(amount) || amount < 1){
                    amount = 1;
                }
                sell(sender, String(arg1), amount);
            }
            else if (action.equalsIgnoreCase('portfolio')){
                getPortfolio(sender);
            }
            else {
                if (arg1 === undefined){
                    arg1 = 'price';
                }
                checkStock(sender, action, arg1);
            }
        }
    });

    function consoleLn(message) {
        Packages.com.gmt2001.Console.out.println(java.util.Objects.toString(message));
    }

    function isPositiveInteger(n) {
        return n >>> 0 === parseFloat(n);
    }
    // Event that runs once at boot-up if the module is enabled.
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./games/stock.js')) {
            // Register the command with the: module path, command name, and command permission.
            var name = 's';
            $.registerChatCommand('./games/stock.js', name, 7);
            $.registerChatSubcommand(name, 'buy', 7);
            $.registerChatSubcommand(name, 'sell', 7);
            $.registerChatSubcommand(name, 'portfolio', 7);
        }
    });
})();

// INFORMATION ABOUT SUBMITING A PULL-REQUEST FOR A NEW MODULE. PLEASE READ:

// If you're planning on making a module for the master build please take a look at the current scripts and follow their code style
// of we will not merge your pull-request into the master build. Also keep a mind we do take performance really seriously here,
// if your module is going to slow down the bot, or affect performance we will not merge it, if we think the module isn't fit to be 
// in the main build we will also reject it. Another thing, be sure to fully test your module, we will NOT test any pull-request before merging it, 
// if we see an issue we will let you know that there's an issue in the code and you will have to fix it if you want us to merge it. 
// If your module gets merge but causes an issue in the future it will be reverted without any notice.
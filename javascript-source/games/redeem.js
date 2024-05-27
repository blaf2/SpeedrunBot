/**
 * moduleExample.js
 *
 * This module will generate a random string of letters when we type the command in chat.
 */
(function() {
    // Global variables for this script if needed.
    var myRandomVariableToGetAndSetDbString = $.getSetIniDbString('my_db_table', 'my_db_key', 'my_db_string'),
        myRandomVariableToGetAndSetDbBoolean = $.getSetIniDbBoolean('my_db_table', 'my_db_key', false),
        pendingAmountInit = $.getSetIniDbNumber('redeem', 'pending', 0),
        totalAmountInit = $.getSetIniDbNumber('redeem', 'total', 0);

    function reset(sender){
        $.setIniDbNumber('redeem', 'pending', 0);
        $.say('Pending amount has been reset!');
    }

    function pending(sender){
        var amount = $.getIniDbNumber('redeem', 'pending', 0);
        $.say('Current pending amount: ' + amount);
    }

    function total(sender){
        var amount = $.getIniDbNumber('redeem', 'total', 0);
        $.say('Total redeemed: ' + amount);
    }

    function redeem(sender, amount){
        var pendingAmount = $.getIniDbNumber('redeem', 'pending', 0);
        var totalAmount = $.getIniDbNumber('redeem', 'total', 0);
        $.setIniDbNumber('redeem', 'pending', pendingAmount + amount);
        $.setIniDbNumber('redeem', 'total', totalAmount + amount);
        $.inidb.decr('points', sender, amount*100);
        $.say(sender + ' has redeemed ' + amount*100 + ' ' + $.inidb.get('pointSettings', 'pointNameMultiple') + '!');
    }

    // Command event for when someone types a command for this module.
    $.bind('command', function(event) {
        var command = event.getCommand(), // command name all lower case.
            sender = event.getSender(),   // user who sent the command lower case.
            args = event.getArgs(),       // each argument after the command in an array.
            arg0 = args[0];
        // Command name.
        if (command.equalsIgnoreCase('redeem')) {
            // Check for arguments, if needed.
            if (arg0 === undefined) {
                // Say something to the user.
                $.say($.whisperPrefix(sender) + 'Usage: !redeem [amount] (1 = 100 ' + $.inidb.get('pointSettings', 'pointNameMultiple') + ')');
                // Stop here.
                return;
            }
            else if (arg0.equalsIgnoreCase('total')){
                total(sender);
            }
            else if (arg0.equalsIgnoreCase('pending')){
                pending(sender);
            }
            else if (arg0.equalsIgnoreCase('reset')){
                reset(sender);
            }
            else {
                var amount = parseInt(arg0);
                if(isNaN(amount) || amount < 1){
                    $.say($.whisperPrefix(sender) + 'Usage: !redeem [amount] (1 = 100 ' + $.inidb.get('pointSettings', 'pointNameMultiple') + ')');
                    return;
                }
                var actualAmount = amount*100;
                if (actualAmount > $.getUserPoints(sender)){
                    $.say($.whisperPrefix(sender) + 'You don\'t have enough ' + $.inidb.get('pointSettings', 'pointNameMultiple'));
                    return;
                }
                redeem(sender, amount);
            }
        }
    });

    function isPositiveInteger(n) {
        return n >>> 0 === parseFloat(n);
    }
    // Event that runs once at boot-up if the module is enabled.
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./games/redeem.js')) {
            // Register the command with the: module path, command name, and command permission.
            var name = 'redeem';
            $.registerChatCommand('./games/redeem.js', name, 7);
             $.registerChatSubcommand(name, 'total', 7);
             $.registerChatSubcommand(name, 'pending', 7);
             $.registerChatSubcommand(name, 'reset', 1);
         
        }
    });
})();
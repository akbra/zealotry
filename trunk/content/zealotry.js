/*
 *
 * The Zealous Client (C) 2002 Skotos Tech Inc
 *
 *  020622  Zell    Initial Revision
 *  03????  DanS    Added dynamic baseurl etc
 *  030606  Zell    Minor rewrite & upgrade, fixes from Zwoc
 *
 * Zealous is based on MUDzilla, the Mozilla based MUD client,
 * Copyright (C) 2001, MOO Canada Inc.
 * http://mudzilla.mozdev.org/
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
 *
 */

const ZEALOUS_VERSION = "0.7.11.7";
const ZEALOUS_SUPPORT = "SKOOT2";
const POLL_DELAY = 50;

function alert(s) { if (!confirm(s)) window.alert = null; }

var bgCrap = null;
var munge_buffer = "";
var onread_buffer = "";
var enter_down = false;
var scroll_splitter = null;
// var scrollback = null;
var scrolling = false;
var scrolltarg = null;
var enableBuffer = "false";
var madeCharName = null;
var skip_newline = false;
var onclick_counter = 0;
var hotRecipient = null;

function makeCharName()
{
    var ztitle, index, zlist, i;

    ztitle = window.charName;

    if (!ztitle || !ztitle.length) {
        return "";
    }

    index = ztitle.indexOf(':');

    if (index != -1)
        ztitle = ztitle.substring(index + 1);

    ztitle = ztitle.replace(/[^A-Za-z0-9_]+/g, '*');

    zlist = ztitle.split('*');
    for (i = 0; i < zlist.length; i++) {
        zlist[i] = zlist[i].substring(0, 1).toUpperCase() +
            zlist[i].substring(1);
    }

    return zlist.join(' ');
}

function onMainLoad()
{
    // Init some values.
    // scroll_splitter = document.getElementById('scroll_splitter');
    // scrollback = document.getElementById('scrollback');

    window.hasFocus = true;

    // Remove the onload trigger on the XUL
    window.onload = null;
    
    if (!document.getElementById("input")) {
        alert("cannot find input box element");
    }
    
    var h = document.location.href;
    
    if (h) {
        // h should be along the lines of "zealotry:username@server"
        // strip away the "zealotry:" part
        h = h.substr(9);

        // we should now have [user]@[game]
        // var ugArr = h.split("@");
        var ugArr;

        if (ugArr = (/([^\@]*)\@(.*)/).exec(h)) {
            ugArr = [ugArr[1], ugArr[2]];
        } else {
            // failed to parse that url. maybe it's just the server. let's change user to *.
            ugArr = ["*", h];
        }
        // do we recognize this server?
        var servList = MyWorld.zealotry_servList;
        var servMap = MyWorld.zealotry_servMap;
        
        if (servMap[ugArr[1]]) {
            ugArr[1] = servList[servMap[ugArr[1]]];
        }

        window.charName = ugArr[0];
        window.baseURL = "http://" + ugArr[1] + "/";
            
        if (ugArr[1]) {
            h = ugArr[1]; // args["baseurl"];
            ix = h.indexOf(".");
            if (ix >= 0) {
                window.gameName = h.substring(0, ix);
            } else {
                window.gameName = h;
            }
            window.gameName = window.gameName.substring(0, 1).toUpperCase() + window.gameName.substring(1);
        }
    }
    
    if (window.charName == null) {
        alert("this client will not run without a base url");
        return;
    }

    if (window.baseURL == null) {
        alert("this client will not run without a base url");
        return;
    }

    window.left_frame =   frames["left-frame"];
    window.right_frame =  frames["right-frame"];
    window.center_frame = frames["center-frame"];

    if (!window.left_frame) {
        alert("error: cannot find left frame in window");
    }
    if (!window.center_frame) {
        alert("error: cannot find center frame in window");
    }
    if (!window.right_frame) {
        alert("error: cannot find right frame in window");
    }

    /*
    **	When a user hits 'reload' on a client page all the contained
    **	documents are reloaded despite the xul file's src attributes
    **	being set to about:blank. Thus when we get to this onLoad()
    **	handler, the old documents have already reloaded and so we
    **	must explicitly invalidate their pageLoaded attributes...
    **
    **	Zell, after much headache, 030701
    */

    if (window.left_frame.document) {
        window.left_frame.document.pageLoaded = false;
    }
    if (window.center_frame.document) {
        window.center_frame.document.pageLoaded = false;
    }
    if (window.right_frame.document) {
        window.right_frame.document.pageLoaded = false;
    }

    var lf = document.getElementById('left-frame');
    var cf = document.getElementById('center-frame');
    var rf = document.getElementById('right-frame');

    var pref = Components.classes['@mozilla.org/preferences-service;1'].getService();
    pref = pref.QueryInterface(Components.interfaces.nsIPrefBranch);

    // Grab the "left, center and right sam" modifiers from the preferences.
    var lModifier = "", rModifier = "", cModifier = "";
    try {
        lModifier = pref.getCharPref(zealousPreference("leftModifier"));
        rModifier = pref.getCharPref(zealousPreference("rightModifier"));
        cModifier = pref.getCharPref(zealousPreference("centerModifier"));
    } catch (e) {}
    
    frames['left-frame'].location.href = baseURL + "Left.sam?zealous=0.6&" + lModifier; // ?zealous=" + ZEALOUS_VERSION;
    frames['center-frame'].location.href = baseURL + "Center.sam?zealous=0.6&" + cModifier; // ?zealous=" + ZEALOUS_VERSION;
    frames['right-frame'].location.href = baseURL + "Right.sam?zealous=0.6&" + rModifier; // ?zealous=" + ZEALOUS_VERSION;

    madeCharName = makeCharName();
    var cn = makeCharName().replace(/[ ]/g, "");
    document.title = (cn ? madeCharName + " @ " : "") + window.gameName;

    // OOO: This apparently doesn't want to work. Not sure why at this point.
    // XXX: Removing this. Let's not refer to eternalis.com if we don't have to, and I have no idea what this does.
    /*
    var head = document.getElementById('center-frame').contentDocument.getElementsByTagName('head')[0];
    if (head) {
        var link = document.createElement('link');
        link.setAttribute('rel', 'shortcut icon');
        link.setAttribute('type', 'image/x-icon');
        link.setAttribute('href', 'http://eternalis.com/backgrounds/favicon.ico');
        head.appendChild(link);
    }
    */

    try {
        window.pageBeep = pref.getCharPref(zealousPreference("pageBeep"));
        if (pageBeep == "true") {
            window.pageBeep = true;
        }
    } catch (err) {
        window.pageBeep = false;
        pref.setCharPref(zealousPreference("pageBeep"), "false");
    }

    // XXX: This should be a server-side setting -- and is a server-side setting. @toggle ooc-noise.
    try {
        window.ignoreOOC = pref.getCharPref(zealousPreference("ignoreOOC"));
        if (ignoreOOC == "true") {
            window.ignoreOOC = true;
        }
    } catch (err) {
        window.ignoreOOC = false;
        pref.setCharPref(zealousPreference("ignoreOOC"), "false");
    }

    // we have to use a polling system to support mozilla 1.0
    // XXX: Do we care at this point? I don't. If a user uses Moz 1.0, they need to upgrade anyway for more reasons than I can count.
    setTimeout("pollFrames()", POLL_DELAY);
}

function onUnLoad()
{
    if (window.client && window.client.connection)
        window.client.connection.disconnect();
}

function pollFrames() {
    var ldoc = frames["left-frame"].document;
    var cdoc = frames["center-frame"].document;
    var rdoc = frames["right-frame"].document;

    if (ldoc && cdoc && rdoc &&
        ldoc.pageLoaded && cdoc.pageLoaded && rdoc.pageLoaded) {
        mainStep();
        return;
    }

    setTimeout("pollFrames()", POLL_DELAY);
}

function mainStep()
{
    bubbleSettings();

    var output = window.center_frame.document.getElementById("output_body");
    if (!output) {
        alert("internal error: no 'output' element in page");
    }

    window.client = new CClient(document, window);

    window.client.setClientOutput(output); // , scrollback.contentDocument.body);

    window.client.clearHistory();

    try {
        window.myMacros = new MacroStruct(client);
    } catch (e) {
        dump("Exception in mainStep when loading macros: " + e);
    }

    try {
        readConfigurationFile();
    } catch (e) {
        dump("Exception in mainStep when loading configuration file: " + e);
    }

    window.client.connect
        (window.center_frame.getHost(),
         window.center_frame.getPort(),
         onRead);

    /* window.client.connection.onClose = onClose; */
    displayLine("Zealotry version " + ZEALOUS_VERSION + " loading...");

    var obj = document.getElementById("input");

    obj.focus();
    obj.addEventListener("keydown", onInputKeyDown, false);
    obj.addEventListener("keyup", onInputKeyUp, false);
    window.onkeypress = onWindowKeyPress;

    window.addEventListener ("focus", handleGotFocus, true);
    window.addEventListener ("blur", handleLostFocus, true);

    client.connection.write("SKOTOS Zealous " + ZEALOUS_VERSION + /* " " + ZEALOUS_SUPPORT + */ "\n");

    setTheme();
    startAutoLogging();
    doFontStyleAndSize();
}

function handleGotFocus()
{
    var cn = madeCharName.replace(/[ ]/g, "");
    document.title = (cn ? madeCharName + " @ " : "") + window.gameName;
    window.hasFocus = true;
    window.isblinking = false;
}

function handleLostFocus()
{
    window.hasFocus = false;
}

function doAlert()
{
    if (window.hasFocus == true) {
    	var cn = madeCharName.replace(/[ ]/g, "");
    	document.title = (cn ? madeCharName + " @ " : "") + window.gameName;
        return;
    } 

    var pref = Components.classes['@mozilla.org/preferences-service;1'].getService();
    pref = pref.QueryInterface(Components.interfaces.nsIPrefBranch);

    try {
        var blink = pref.getCharPref(zealousPreference("blink"));
    } catch (err) {
        pref.setCharPref(zealousPreference("blink"), "false");
        blink = "false";
    }

    if (blink == "false") {
        var cn = madeCharName.replace(/[ ]/g, "");
        document.title = (cn ? "*" + madeCharName + " @ " : "") + window.gameName;
        return;
    }

    if (window.isblinking == true) {
        return;
    } else {
    	doBlink();
    }
}

function doBlink()
{
    if (window.hasFocus == true) {
        var cn = madeCharName.replace(/[ ]/g, "");
        document.title = (cn ? madeCharName + " @ " : "") + window.gameName;
        window.isblinking = false;
        return;
    }

    if (!window.blink) {
        window.blink = true;
        document.title = document.title.toString().toUpperCase();
    } else {
        window.blink = false;
    	var cn = madeCharName.replace(/[ ]/g, "");
    	document.title = (cn ? "*" + madeCharName + " @ " : "") + window.gameName;
    }
    window.isblinking = true;
    setTimeout("doBlink()", 2000);
}

function onNextCmd()
{
    window.client.nextInputBuffer();
}

function onPrevCmd()
{
    window.client.prevInputBuffer();
}

function onWindowKeyPress(e)
{
    switch (e.keyCode) {
    case 9: // tab
        return false;  // Don't allow for tab switching.

    case 34: // page down
        if (e.ctrlKey != true && e.shiftKey != true && e.altKey != true) {
            onPageDown();
            /*
            if (!onPageDown() && enableBuffer == "true") { // onPageDown() is true or false depending on if we're at document bottom or not
                scroll_splitter.setAttribute('state', 'collapsed');
                scrolling = false;
            }
            */
        }
        break;

    case 33: // page up
        if (e.ctrlKey != true && e.shiftKey != true && e.altKey != true) {
            /*
            if (!scrolling && enableBuffer == "true") {
                scroll_splitter.setAttribute('state', 'open');
                doScroll();
                scrollback.contentDocument.body.scrollTop = scrollback.contentDocument.body.scrollHeight;
                scrolling = true;
            }
            */
            onPageUp();
        }
        break;

    case 38: // Cursor 'up'
        if (e.ctrlKey || e.target.selectionStart == 0) {
            // Only do this if you're using ctrl + Up or if the cursor
            // was at the beginning of the line anyway.
            window.client.prevInputBuffer(e.target);
            e.preventDefault();
        }
        break;

    case 40: // Cursor 'down'
        if (e.ctrlKey || e.target.selectionStart == e.target.value.length) {
            // Only do this if you're using ctrl + Down or if the
            // cursor was at the end of the line anyway.
            window.client.nextInputBuffer(e.target);
            e.preventDefault();
        }
        break;
    }
}

function onPageDown()
{
    /* if (enableBuffer == "true") {
        var w = scrollback.contentWindow; // window.center_frame;
        } else { */
    var w = window.center_frame;
    // }

    newOfs = w.pageYOffset + (w.innerHeight / 2);
    if (newOfs < (w.innerHeight + w.pageYOffset))
        w.scrollTo(w.pageXOffset, newOfs);
    else
        w.scrollTo(w.pageXOffset, (w.innerHeight + w.pageYOffset));
    return newOfs < w.scrollMaxY;
}

function onPageUp()
{
    /* if (enableBuffer == "true") {
        var w = scrollback.contentWindow; // window.scrollback;
        } else { */
    var w = window.center_frame;
    // }

    if (w.scrollMaxY == w.pageYOffset && enableBuffer == "true") {
        newOfs = w.pageYOffset - 1;
    } else {
        newOfs = w.pageYOffset - (w.innerHeight / 2);
    }
    
    if (newOfs > 0)
        w.scrollTo(w.pageXOffset, newOfs);
    else
        w.scrollTo(w.pageXOffset, 0);
}

function handleInputLine(str, noecho) {
    if (!handleCommands(str)) {
        var expanded = myMacros.applyMacros(str);
        if (expanded) {
            window.client.onInputCompleteLine(expanded);
            if (window.client.optionEchoSent && !noecho) {
                // note: this can be many lines of text
                if (window.client.localEcho) { 
                    outputStyledText(str, "font-style: italic");
                } else {
                    str = str.replace(/./g, "*");
                    outputStyledText(str, "font-style: italic");
                }
                // send the NL with nolog flag set
                outputNL(true);
                // window.client.outputNL();
                
            }
        } else {
	    window.client.onInputCompleteLine("");
	    if (window.client.optionEchoSent && !noecho) {
	        outputNL(true);
	    }
        }
    }
}

function onInputKeyDown(e)
{
    switch (e.keyCode) {
    case 9: // tab
        if (e.ctrlKey != true && e.shiftKey != true && e.altKey != true) {
	        window.client.tabCompleteInputBuffer();
        	break;
        }
    case 13:
        if (e.ctrlKey || e.shiftKey || e.altKey) {
            break;
        }
        enter_down = true;
        handleInputLine(e.target.value);
        e.target.value = "";
        break;
    }
}

function onInputKeyUp(e)
{
    if (!window.client.isConnected()) {
        e.target.value = "";
        return;
    }

    switch (e.keyCode) {

    case 9: // Tab
        break;

    case 13: // CR
        if (e.ctrlKey || e.shiftKey || e.altKey) {
            break;
        }
        if (!enter_down) {
            /*
             * onInputKeyDown() failed to trigger for the
             * CR, which means it's lost if we don't grab
             * it here.
             */
            handleInputLine(e.target.value);
        }
        enter_down = false;
        e.target.value = "";
        break;

    case 38:
        // 'Up' cursor key
        break;
        
    case 40:
        // 'Down' cursor key
        break;
        
    case 80:
        if (e.ctrlKey) {
            // ctrl + 'P'
            window.client.prevInputBuffer(e.target);
            break;
        }
            
    case 78:
        if (e.ctrlKey) {
            // ctrl + 'N'
            window.client.nextInputBuffer(e.target);
            break;
        }

    case 188: // ","
        if (e.ctrlKey != true && e.shiftKey != true && e.altKey != true) {
            // Hot-reply to a @page.
            if (hotRecipient != null) {
                var textBox = document.getElementById("input");
                if (textBox.value == "" || textBox.value == ",") {
                    textBox.value = "@page " + hotRecipient + " \"";
                    textBox.focus();
                    break;
                }
            }
        }
        
    default:
        window.client.incompleteLine = e.target.value;
        break;
    }
}

function editMenuInit() {
    el = document.getElementById("menuitem_copy");
    if (el) {
        el.setAttribute("disabled",
                        !document.commandDispatcher.getControllerForCommand('cmd_copy').isCommandEnabled('cmd_copy'));
    }
    el = document.getElementById("menuitem_paste");
    if (el) {
        el.setAttribute("disabled",
                        !document.commandDispatcher.getControllerForCommand('cmd_paste').isCommandEnabled('cmd_paste'));
    }
}


function onPaste() {
    document.commandDispatcher.getControllerForCommand('cmd_paste').doCommand('cmd_paste');
}

function onCut() {
    document.commandDispatcher.getControllerForCommand('cmd_cut').doCommand('cmd_cut');
}

function onCopy() {
    document.commandDispatcher.getControllerForCommand('cmd_copy').doCommand('cmd_copy');
}

function onClose(status, errStr)
{
    if (status == 0) {
        displayLine("Connection closed - session ended", "sys");
        / * else if (status == NS_BINDING_ABORTED) displayLine("Connection lost - session ended", "sys"); */
            } else { 
                displayLine("Connection failed: '"+errStr+"'", "sys");
            }
    connectionTerminated();
}

function loadCookie(name) {
    var allcookies = center_frame.dacookie();

    if (!allcookies) {
        alert("no cookies");
        return null;
    }
    var start = allcookies.indexOf(name + "="); 
    if (start == -1) {
        alert("no cookie: '" + name + "'");
        return null;
    }
    start += name.length + 1; 
    var end = allcookies.indexOf(';',start); 
    if (end == -1) {
        end = allcookies.length;
    }
    return allcookies.substring(start,end); 
} 

function onRead(bigstr) {
    var str, lines;

    if (window.client == null) {
        /*
        **	This seems to happen in mid-reload sometimes: the
        **	function is still being called, but the 'window'
        **	is no longer connected... just return here and
        **	await our doom
        */
        return;
    }

    bigstr = onread_buffer + bigstr;
    var nl_ix = bigstr.lastIndexOf("\r\n");
    if (nl_ix == -1) {
        onread_buffer = bigstr;
        bigstr = "";
        lines = new Array();
    } else {
        onread_buffer = bigstr.substr(nl_ix + 2);
        bigstr = bigstr.substr(0, nl_ix + 2);
        lines = bigstr.split('\r\n');
    }
    var ix = -1;
    var munge_it = false;
    
    for (var i = 0; i < lines.length; i++) {
        str = lines[i];

        ix = str.indexOf(" ");
        munge_it = ix == -1;
        if (!munge_it) {
            switch (str.substr(0, ix)) {
            case "SECRET":
                var secret, text;
                var userName, passWord;
                
                userName = loadCookie("user");
                passWord = loadCookie("pass");

                secret = str.substring(7, str.length);

                hash = hexMD5(userName + passWord + secret);

                client.connection.write("USER " + userName + "\n" +
                                        "SECRET " + secret + "\n" +
                                        "HASH " + hash + "\n" +
                                        (window.charName &&
					 window.charName.length > 0 ?
					 "CHAR " + window.charName + "\n" :
					 ""));
                break;

            case "SKOOT":
                var sppos = str.indexOf(" ", 6);
                if (sppos == -1) {
                    /* malformed SKOOT */
                    break;
                }
                try {
                    window.center_frame.newSkootMessage
                        (str.substring(6, sppos),
                         str.substring(sppos + 1),
                         window.left_frame,
                         window.right_frame);
                } catch (err) {}
                break;
                
            case "MAPURL":
                // XXX: This is obsolete.
                try {
                    window.center_frame.newSkootMessage
                        ("1",
                         str.substring(7),
                         window.left_frame,
                         window.right_frame);
                } catch (err) {}
                break; 
                
            default:
                munge_it = true;
                break;
            }
        }
        if (munge_it) {
            // dump(str+"\n");
            mungeForDisplay(str);
            if (i < lines.length-1) {
                outputNL();
            }
        }
    }

    if (onread_buffer.length == 0) {
        return;
    }

    // Check if onread_buffer starts with (the first few characters of) SECRET,
    // SKOOT, or MAPURL.  If not, just send it out to the screen and keep track
    // of the number of characters that we're now into the next line already.
    var len = onread_buffer.length;

    if (onread_buffer.substr(0, 5) == "SKOOT".substr(0, len) ||
        onread_buffer.substr(0, 6) == "MAPURL".substr(0, len) ||
        onread_buffer.substr(0, 6) == "SECRET".substr(0, len)) {
        return;
    }
    mungeForDisplay(onread_buffer);
    onread_buffer = "";
}

function goUpdateMenuItems(commandset)
{
    for (var i = 0; i < commandset.childNodes.length; i++) {
        var commandID = commandset.childNodes[i].getAttribute("id");
        if (commandID)
            goUpdateCommand(commandID);
    }
}

function zealousPreference(setting)
{
    return "zealous." + safe(gameName) + "." + safe(charName) + "." + setting;
}

function fileMenuInit() {
    el = document.getElementById("menuitem_echo");
    if (el) {
        el.setAttribute("checked", window.client.optionEchoSent);
    }
    el = document.getElementById("menuitem_logging");
    if (el) {
        var pref = Components.classes['@mozilla.org/preferences-service;1'].getService();
        pref = pref.QueryInterface(Components.interfaces.nsIPrefBranch);

        // XXX: What the fuck are these disabled/enabled lines up to? 
        try {
            this.autoLogging = pref.getCharPref(zealousPreference("autoLogging"));
        } catch (err) {
            el.setAttribute("checked",  window.logFile != null);
            /* el.setAttribute("disabled", false);
               el.setAttribute("enabled",  true); */
            this.autoLogging = null;
        }
        if (this.autoLogging) {
                /* el.setAttribute("enabled",  false);
                   el.setAttribute("disabled", true); */
            el.setAttribute("checked",  false);
        }
    }
    el = document.getElementById("menuitem_debugging");
    if (el) {
        el.setAttribute("checked", window.dbgFile != null);
    }
    el = document.getElementById("menuitem_autolog");
    if (el) {
        var pref = Components.classes['@mozilla.org/preferences-service;1'].getService();
        pref = pref.QueryInterface(Components.interfaces.nsIPrefBranch);
        
        try {
            this.autoLogging = pref.getCharPref(zealousPreference("Logging"));
        } catch (err) {
                /* el.setAttribute("enabled",  true);
                   el.setAttribute("disabled", false); */
            this.autoLogging = null;
        }
        if (this.autoLogging) {
                /* el.setAttribute("enabled",  false);
                   el.setAttribute("disabled", true); */
        }
        
        try {
            this.logging = pref.getCharPref(zealousPreference("autoLogging"));
        } catch (err) {
            return;
        }
        el.setAttribute("checked", true);
    }
}

function onToggleBuffer(event) {
    window.client.enableBuffer = event.target.getAttribute("checked");

    var pref = Components.classes['@mozilla.org/preferences-service;1'].getService();
    pref = pref.QueryInterface(Components.interfaces.nsIPrefBranch);

    if (enableBuffer == "true") {
        pref.setCharPref(zealousPreference("enableBuffer"), "false");
        document.getElementById("menuitem_buffer").setAttribute("checked", false);
        enableBuffer = "false";
        return;
    }
    pref.setCharPref(zealousPreference("enableBuffer"), "true");
    document.getElementById("menuitem_buffer").setAttribute("checked", true);
    enableBuffer = "true";
    return;
}


function onToggleEcho(event) {
    window.client.optionEchoSent = event.target.getAttribute("checked");

    var pref = Components.classes['@mozilla.org/preferences-service;1'].getService();
    pref = pref.QueryInterface(Components.interfaces.nsIPrefBranch);

    try {
        this.echo = pref.getCharPref(zealousPreference("echo"));
    } catch(err) {
        pref.setCharPref(zealousPreference("echo"), "false");
        return;
    }
    	
    if (this.echo == "true") {
    	pref.setCharPref(zealousPreference("echo"), "false");
    } else {
        pref.setCharPref(zealousPreference("echo"), "true");
    }
}

function onToggleLogging(event) {
    var pref = Components.classes['@mozilla.org/preferences-service;1'].getService();
    pref = pref.QueryInterface(Components.interfaces.nsIPrefBranch);
    
    try {
        this.autoLogging = pref.getCharPref(zealousPreference("autoLogging"));
    } catch (err) {
        event.target.setAttribute("checked", false);
        
        logFile = window.logFile;
        if (logFile == null) {
            var nsIFilePicker = Components.interfaces.nsIFilePicker;
            var filePicker = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
            filePicker.init(window, "Log to...", nsIFilePicker.modeSave);
            filePicker.appendFilters(nsIFilePicker.filterText);
            filePicker.defaultExtension = nsIFilePicker.filterText;
            var res = filePicker.show();
            if (res == nsIFilePicker.returnCancel) {
                return;
            }
            var theFile = filePicker.file;
            var filePath = theFile.path;
            
            logFile = new File(filePath);
            if (logFile.exists()) {
                logFile.open("a");
            } else {
                logFile.open("w");
            }
            if (!logFile) {
                outputStyledText("[Failed to open for writing: " + filePath + "]");
                outputNL();
                return;
            }
            window.logFile = logFile;
            outputStyledText("[Logging begins: " + new Date().toGMTString() + "]", "font-weight: bold");
            outputNL();
            event.target.setAttribute("checked", true);
            pref.setCharPref(zealousPreference("Logging"), "true");
            return;
        }
        outputStyledText("[Logging ends: " + new Date().toGMTString() + "]", "font-weight: bold");
        outputNL();
        logFile.close();
        window.logFile = null;
        pref.clearUserPref(zealousPreference("Logging"));
    }
}


function doLogging(logData) {
    // resume caller has tested that logFile exists
    window.logFile.write(logData);
}


function connectionTerminated()
{
    delete window.client.connection;
    
    window.client.connection = false;
    window.title = "MUDzilla";

    delete window.connectHost;
    delete window.connectPort;

    var input = document.getElementById("input");

    window.client.localEcho = true;

    input.setAttribute("type", "text");
    input.setAttribute("value", "");
    input.setAttribute("readonly", true);
}

function displayLine(str) {
    mungeForDisplay(str);
    outputNL();
}

function sendCommand(str) {
    alert("hello: " + str);
}

/*
 * This function was obsoleted, but reinstated after discovering that quotes were not
 * parsed correctly.
 */
function escapeSkotosLink(s)
{
    /*
     * we can't use regexp replace here, because we will overwrite
     * the global RegExp object with new regexp results.
     */
    var len = s.length;
    var res = "";
    var seq = 0;
    for (var i = 0; i < len; i++) {
        /*
         * We actually have to unescape HTML entities and crap. And  there's no built-ins for
         * that in JS. Yay.
         */
        if (s.substr(i, 6) == "&quot;") {
            res += s.substring(seq, i) + "\\\"";
            seq  = i+6;
        }
        else if (s.substr(i, 4) == "&lt;") {
            res += s.substring(seq, i) + "<";
            seq = i+4;
        }
        else if (s.substr(i, 4) == "&gt;") {
            res += s.substring(seq, i) + ">";
            seq = i+4;
        }
        else if (s.substr(i, 5) == "&amp;") {
            res += s.substring(seq, i) + "&";
            seq = i+5;
        }
    }
    return res + s.substring(seq);
}

var cow = 0;
function mungeForDisplay(str) {
    var element, element_name, style, pop, arr;

    /*
     * Add chopped munge-data.
     */
    str = munge_buffer + str;
    munge_buffer = "";

    /* SKOOT 2.0: */
    if        (arr = (/<skoot id=\'([^\']*)\' val=\'([^>]*)\'\/>/i).exec(str)) {
        // try {
        str = RegExp.rightContext;
        var num = arr[1] - 0;
        window.center_frame.newSkootMessage
            (num,
             unescape(arr[2].replace(/\+/g, " ")),
             window.left_frame,
             window.right_frame);
        // } catch (err) {}
        // We don't want the client to actually input this element.
        arr = null;
        skip_newline = true;
    }
    /* End SKOOT 2.0. */

    if (arr = (/<font color=\"([^>]*)\">/i).exec(str)) {
        element_name = "font";
        style = "color: " + arr[1];
    } else if (arr = (/<font color=([^>]*)>/i).exec(str)) {
        element_name = "font";
        style = "color: " + arr[1];
    } else if (arr = (/<font size=\+1>/i).exec(str)) {
        element_name = "font";
        style = "font-size: larger";
    } else if (arr = (/<b>/i).exec(str)) {
	element_name = "b";
        style = "font-weight: bold";
    } else if (arr = (/<i>/i).exec(str)) {
	element_name = "i";
        style = "font-style: italic";
    } else if (arr = (/<ol>/i).exec(str)) {
	element_name = "ol";
        element = document.createElementNS("http://www.w3.org/1999/xhtml",
                                           "html:ol");
    } else if (arr = (/<ul>/i).exec(str)) {
	element_name = "ul";
        element = document.createElementNS("http://www.w3.org/1999/xhtml",
                                           "html:ul");
    } else if (arr = (/<li>/i).exec(str)) {
	element_name = "li";
        element = document.createElementNS("http://www.w3.org/1999/xhtml",
                                           "html:li");
    } else if (arr = (/<hr>/i).exec(str)) {
	element_name = "hr";
        element = document.createElementNS("http://www.w3.org/1999/xhtml",
                                           "html:hr");
	element.style.width = "90%";
	pop = true;
    } else if (arr = (/<center>/i).exec(str)) {
	element_name = "center";
        element = document.createElementNS("http://www.w3.org/1999/xhtml",
                                           "html:center");
    } else if (arr = (/<pre>/i).exec(str)) {
	element_name = "pre";
        element = document.createElementNS("http://www.w3.org/1999/xhtml",
                                           "html:pre");
    } else if (arr = (/<body bgcolor=\'([^\']*)\' text=\'([^\']*)\'[^>]*>/i).exec(str)) {
        dump("body [" + arr + "]");
        setTheme(arr);
        frames["center-frame"].document.body.style.color = arr[2];
        // scrollback.contentDocument.body.style.color = arr[2];
    } else if (arr = (/<a xch_cmd='([^>]*)'>/i).exec(str)) {
        element_name = "a";
        element = document.createElementNS("http://www.w3.org/1999/xhtml",
                                           "html:a");
        element.style.cursor = "pointer";
        element.skotosLink = skotosLink;
	//	alert("skotosLink = " + skotosLink + "; window.skotosLink = " + window.skotosLink + "; element.skotosLink = " + element.skotosLink);
        onclick_counter++;
        eval("function onclick" + onclick_counter + "(e) { skotosLink(\"" + escapeSkotosLink(arr[1]) + "\"); } element.onclick = onclick" + onclick_counter);
    } else if (arr = (/<xch_page clear=\"text\" \/>/).exec(str)) {
	// Ignore?
    } else if (arr = (/<\/([a-z]+)>/i).exec(str)) {
	element_name = arr[1].toLowerCase(); // Sanitizing case, just in case.
        pop = true;
    }
    
    if (arr) {
        var left, right;
        
	left  = RegExp.leftContext;
    	right = RegExp.rightContext;
        
        if (left) {
            mungeForDisplay(left);
        }
        if (style) {
            element = document.createElementNS("http://www.w3.org/1999/xhtml",
                                               "html:span");
            element.setAttribute("style", style);
        }
        if (element) {
            // Output to both scroll buffer and regular window.
            // var copyEl = element.cloneNode(true);
            // scrollback.contentDocument.body.appendChild(copyEl); 
            /* var copyEl = scrollback.contentDocument.importNode(element, true);
               scrollback.contentDocument.body.appendChild(copyEl); */
            // scrolltarg = copyEl;
            window.client.pushTag(element_name, element);
        }
        if (pop) {
            window.client.popTag(element_name);
            // scrolltarg = scrolltarg.parentNode ? scrolltarg.parentNode : scrolltarg;
        }
        if (right) {
            mungeForDisplay(right);
        }
        return;
    } else if (!(/<([^>]*)>/i).exec(str) && (arr = (/</i).exec(str))) {
        // XXX: This may cause issues with the SKOOT 2.0 deal, since we null arr.
        /*
         * We've caught a chopped off tag.
         */
        munge_buffer = "<" + RegExp.rightContext;
        str = RegExp.leftContext;
    }

    // var page = (/^\[OOC Page\] from ([^:]*)/).exec(str);
    var page = (/^\[OOC Page\]([^]*)from ([^:]*)/).exec(str);
    if (page) {
        if (pageBeep == true) {
            gSound = Components.classes["@mozilla.org/sound;1"].createInstance(Components.interfaces.nsISound);
            gSound.beep();
        }
        var user = (/\[([^\/]*)\/([^\]]*)/).exec(page[2]);
        user = user ? user[2] : page[2];
        hotRecipient = user;
    }

    // XXX: ignoreOOC is already available within the game; it's pointless having it here as well.
    if (ignoreOOC == true) {
        var pattern = /^OOC --+/;
        if (pattern.test(str) == true) {
            return;
        }
    }

    outputText(str);
}

function outputNL(nolog) {
    if (skip_newline) {
        skip_newline = false;
    } else {
        window.client.outputNL();
        // scrolltarg.appendChild(document.createElement("br"));
        if (!nolog && window.logFile) {
            doLogging("\n");
        }
    }
}

function outputStyledText(str, style) {
    var span;
    
    span = document.createElementNS("http://www.w3.org/1999/xhtml",
                                    "html:span");
    span.setAttribute("style", style);
    window.client.pushTag("span", span);
    outputText(str);
    window.client.popTag("span");
}

function outputText(str) {
    var i = 0;
    var newstr = "";

    while (i < str.length) {
        if (str[i] == '&') {
            i ++;
            /* convert entities: lt, gt, amp */
            if (str.substring(i, i+3) == "lt;") {
                newstr += "<";
                i += 3;
            } else if (str.substring(i, i+3) == "gt;") {
                newstr += ">";
                i += 3;
            } else if (str.substring(i, i+4) == "amp;") {
                newstr += "&";
                i += 4;
            } else if (str.substring(i, i+5) == "quot;") {
                newstr += "\"";
                i += 5;
            } else if (str.substring(i, i+5) == "apos;") {
                newstr += "\'";
                i += 5;
            } else {
                newstr += "&";
            }
        } else if (str[i] == '\b') {
            if (newstr.length > 0) {
                newstr = newstr.substring(0, newstr.length-1);
            } else {
                window.client.outputBS(1);
            }
            i ++;
        } else if (str[i] == '\r') {
            /* just skip */
            i ++;
        } else {
            newstr += str[i];
            i ++;
        }
    }
    if (newstr) {
        window.client.outputText(newstr);
        // if (!scrolltarg) scrolltarg = scrollback.contentDocument.body;
        // scrolltarg.appendChild(document.createTextNode(newstr));
        if (window.logFile) {
            doLogging(newstr);
        }
    }
}

function handleCommands(str) {

    if (str == "MACRO" || (arr = (/^MACRO (.+)/).exec(str))) {
        outputLine("[MACRO: Macro support can be found in the Preferences popup.]");
        return true;
    }
    return false;
}

function handleMacros(str) {
    if (str == "MACRO" || (arr = (/^MACRO (.+)/).exec(str))) {	
    	window.myMacros.processMacroCommand(arr ? arr[1] : str);
    	return true;
    }
    return false;
}

/*
  if (str == "CONFIG WRITE") {
  writeConfigurationFile();
  return true;
  }
  return false;
  }
*/

function safe(s) {
    return s.replace(/[\/\:]/g, "_");
}

function readConfigurationFile(str) {
    var pref = Components.classes['@mozilla.org/preferences-service;1'].getService();
    pref = pref.QueryInterface(Components.interfaces.nsIPrefBranch);

    try {
        this.localEcho = pref.getCharPref(zealousPreference("echo"));
    } catch (err) {
        window.client.optionEchoSent = true;
    }

    if (this.localEcho == "false") {
        window.client.optionEchoSent = false;	
    } else {
        window.client.optionEchoSent = true;
    }

    try { 
        enableBuffer = pref.getCharPref(zealousPreference("enableBuffer"));
    } catch (err) {
        window.client.enableBuffer = false;
        enableBuffer = "false";
    }

    if (enableBuffer == "true") {
        window.client.enableBuffer = true;
    }

    try {
        this.homeFolder = pref.getCharPref(zealousPreference("macro"));
        // Hack-in for the bug where / was used in place of \\ on Win clients.
        if (this.homeFolder && this.homeFolder[1] == ':') {
            this.homeFolder = this.homeFolder.replace(/\/zealous/g, "\\zealous");
            pref.setCharPref(zealousPreference("macro"), this.homeFolder);
        }
    } catch (err) {
        return;
    }

    configFile = new File(this.homeFolder);
    if (!configFile.exists()) {
        configFile = new File(this.homeFolder);
        configFile.appendRelativePath(zealousPreference("macro"));
    }
    if (configFile.exists()) {
        configFile.open("r");
        while (!configFile.EOF) {
            var configLine = configFile.readline();
            handleMacros(configLine);
        }
        configFile.close();
        outputLine("[MACRO: Finished loading macros]");
        return;
    }


    // Unable to locate the config file.. lets give them a chance to locate it manually
    // Removing menu options... -- Jess
    /*
      if(str == "menu") {
      var nsIFilePicker = Components.interfaces.nsIFilePicker;
      var filePicker = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
      filePicker.init(window, "Please Select Your Zealous Config File...", nsIFilePicker.modeGetFile);
      var res = filePicker.show();
      if (res == nsIFilePicker.returnCancel) {
      return;
      }
      var configFile = new File(filePicker.file.path);
      configFile.open("r");
      while(!configFile.EOF) {
      var configLine = configFile.readline();
      handleCommands(configLine);
      }
      configFile.close();
      outputLine("[CONFIG: Finished reading configuration]");
      return;
      }
    */

}

function writeConfigurationFile() {
    var pref = Components.classes['@mozilla.org/preferences-service;1'].getService();
    pref = pref.QueryInterface(Components.interfaces.nsIPrefBranch);

    try {
        this.homeFolder = pref.getCharPref("zealous.homeFolder");
    } catch (err) {
        var nsIFilePicker = Components.interfaces.nsIFilePicker;
        var filePicker = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
        filePicker.init(window, "Where should Zealous configuration files live?", nsIFilePicker.modeGetFolder);
        var res = filePicker.show();
        if (res == nsIFilePicker.returnCancel) {
            return;
        }
        this.homeFolder = filePicker.file.path;
        pref.setCharPref("zealous.homeFolder", this.homeFolder);
    }
    
    configFile = new File(this.homeFolder);
    configFile.appendRelativePath("zealous." + safe(charName) + ".config");
    
    outputLine("[CONFIG: Data stored in: " + configFile.path + "]");

    configFile.open("w");
    myMacros.writeMacros(configFile);
    configFile.close();
    
    secondFile = new File(this.homeFolder);
    secondFile.appendRelativePath("zealous.config");

    if (!secondFile.exists()) {
        outputLine("[CONFIG: Copying to: " + secondFile.path + "]");
        configFile.copy(secondFile.path);
    }
}

function onToggleAutoLog(event)
{
    var pref = Components.classes['@mozilla.org/preferences-service;1'].getService();
    pref = pref.QueryInterface(Components.interfaces.nsIPrefBranch);

    try {
        this.autoLogging = pref.getCharPref(zealousPreference("autoLogging"));
    } catch (err) {
        pref.setCharPref(zealousPreference("autoLogging"), "true");
        setAutoLogDir();
        onAutoLog();
        return true;
    }
    pref.clearUserPref(zealousPreference("autoLogging"));
    pref.clearUserPref(zealousPreference("autoLogFolder"));
    onAutoLog();
    return true;
}

function setAutoLogDir()
{
    var pref = Components.classes['@mozilla.org/preferences-service;1'].getService();
    pref = pref.QueryInterface(Components.interfaces.nsIPrefBranch);

    try {
        this.autoLogFolder = pref.getCharPref(zealousPreference("autoLogFolder"));
    } catch (err) {
        var nsIFilePicker = Components.interfaces.nsIFilePicker;
        var filePicker = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
        filePicker.init(window, "Where do you wish to auto log to?", nsIFilePicker.modeGetFolder);
        var res = filePicker.show();
        if (res == nsIFilePicker.returnCancel) {
            return;
        }
        this.autoLogFolder = filePicker.file.path;
        pref.setCharPref(zealousPreference("autoLogFolder"), this.autoLogFolder);
    }
    
    var date = new Date();
    configFile = new File(this.autoLogFolder);
    outputLine("[AUTOLOG: Logging to directory:  " + configFile.path + "]");
}

function startAutoLogging() {
    var pref = Components.classes['@mozilla.org/preferences-service;1'].getService();
    pref = pref.QueryInterface(Components.interfaces.nsIPrefBranch);
    
    try {
        this.autoLogging = pref.getCharPref(zealousPreference("autoLogging"));
    } catch (err) {
        return true;
    }
    onAutoLog();
    return;
}

function lz(v) {
        v = "" + v;
        return (v.length < 2 ? "0" : "") + v;
}

// Convert a date to UTC YYYYMMDD-HHMM string format
Date.prototype.convertToYYYYMMDDHHMM = function()
{
        return (this.getUTCFullYear() + "." + lz(this.getUTCMonth()+1) + "." + lz(this.getUTCDate()) + "-" + lz(this.getUTCHours()) + "." + lz(this.getUTCMinutes()));
}


function onAutoLog() {
    var pref = Components.classes['@mozilla.org/preferences-service;1'].getService();
    pref = pref.QueryInterface(Components.interfaces.nsIPrefBranch);
    
    try {
        this.autoLogging = pref.getCharPref(zealousPreference("autoLogging"));
    } catch (err) {
        outputStyledText("[Logging ends: " + new Date().toGMTString() + "]", "font-weight: bold");
        outputNL();
        logFile.close();
        window.logFile = null;
        return;
    }

    try {
        this.autoLogFolder = pref.getCharPref(zealousPreference("autoLogFolder"));
    } catch (err) {
        var nsIFilePicker = Components.interfaces.nsIFilePicker;
        var filePicker = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
        filePicker.init(window, "Where should I save logs?", nsIFilePicker.modeGetFolder);
        var res = filePicker.show();
        if (res == nsIFilePicker.returnCancel) {
            return;
        }
        this.autoLogFolder = filePicker.file.path;
        pref.setCharPref(zealousPreference("autoLogFolder"), this.autoLogFolder);
    }
    autoLogFile = new File(this.autoLogFolder);
    autoLogFile.appendRelativePath("autolog." + safe(gameName) + "." + safe(charName) + "." + (new Date().convertToYYYYMMDDHHMM()) + ".txt");
    
    if (autoLogFile.exists()) {
        autoLogFile.open("a");
    } else {
        autoLogFile.open("w");
    }
    if (!autoLogFile) {
        outputStyledText("[Failed to open for writing: " + filePath + "]");
        outputNL();
        return;
    }
    window.logFile = autoLogFile;
    outputStyledText("[Logging begins: " + new Date().toGMTString() + "]", "font-weight: bold");
    outputNL();
    return;
}

function doFontStyleAndSize()
{

    var pref = Components.classes['@mozilla.org/preferences-service;1'].getService();
    pref = pref.QueryInterface(Components.interfaces.nsIPrefBranch);

    try {
    	var fontStyle = pref.getCharPref(zealousPreference("fontStyle"));
    } catch (err) {
    	pref.setCharPref(zealousPreference("fontStyle"), frames["center-frame"].document.body.style.fontFamily);
    	doFontStyleAndSize();
    }

    setFont(fontStyle);
    
    try {
    	var fontSize = pref.getCharPref(zealousPreference("fontSize"));
    } catch (err) {
    	pref.setCharPref(zealousPreference("fontSize"), frames["center-frame"].document.body.style.fontSize);
    	doFontStyleAndSize();
    }

    setSize(fontSize);

    try {
        var preFontSize = pref.getCharPref(zealousPreference("fixedFontSize"));
    } catch (err) {
        pref.setCharPref(zealousPreference("fixedFontSize"), "10pt");
        doFontStyleAndSize();
    }

    setFixedSize(preFontSize);

    /* try {
        var fontStyle = pref.getCharPref(zealousPreference("sbFontStyle"));
    } catch (err) {
        pref.setCharPref(zealousPreference("sbFontStyle"), frames["center-frame"].document.body.style.fontFamily);
        doFontStyleAndSize();
    }

    setSBFont(fontStyle);

    try {
        var fontSize = pref.getCharPref(zealousPreference("sbSize"));
    } catch (err) {
        pref.setCharPref(zealousPreference("sbSize"), frames["center-frame"].document.body.style.fontSize);
        doFontStyleAndSize();
    }

    setSBSize(fontSize);

    try {
        var preFontSize = pref.getCharPref(zealousPreference("sbPreSize"));
    } catch (err) {
        pref.setCharPref(zealousPreference("sbPreSize"), "10pt");
        doFontStyleAndSize();
    }

    setSBPreSize(preFontSize);
    */
}

function helpMenuInit(str) 
{
    switch(str) {
    case "new": // Opens whats new window
		window.open("chrome://zealotry/content/textfiles/whatsnew.html", "newWindow", 'resizable, scrollbars, status=no, width=550, height=650, screenX=100, screenY=100');
		return;
    case "about": // Open about dialog
		window.open("chrome://zealotry/content/textfiles/aboutzealous.html", "aboutWindow", 'width=400, height=600, screenX=100, screenY=100, resizeable, scrollbars, status=no');
		return;
    case "changelog": // Open changelog dialog
		window.open("chrome://zealotry/content/textfiles/changelog.html", "changeWindow", 'width=500, height=600, screenX=100, screenY=100, scrollbars, resizable, status=no');
		return;
    case "dictionary": // Open dictionary prompt
		var word = prompt("What word do you wish to define?");
		if (word) {
			var DICT = "http://www.dictionary.net/";
            window.open(DICT + word, 'Dictionary', 'height=200,width=650,scrollbars=yes,screenX=100,screenY=100');
		}
		return;	
    case "content": // Open help contents dialog
		window.open("chrome://zealotry/content/textfiles/aboutzealous.html", "aboutContent", 'width=400, height=600, screenX=100, screenY=100, resizable, scrollbars, status=no');
		return;
    }
}

function doBgSetup(arr)
{
    try {
        var pref = Components.classes['@mozilla.org/preferences-service;1'].getService();
        pref = pref.QueryInterface(Components.interfaces.nsIPrefBranch);
        this.bgImage = pref.getCharPref(zealousPreference("background"));
    } catch (err) {
        if (!bgCrap) return;
        
        document.getElementById('center-frame').style.background = bgCrap[1];
        // document.getElementById('scrollback').style.background = bgCrap[1];
        return;
    }
    document.getElementById('center-frame').style.background = 'white url(' + this.bgImage + ') no-repeat';
    // document.getElementById('scrollback').style.background = 'white url(' + this.bgImage + ') no-repeat';
}

function changeBg(url)
{

    if (url == "remove") {
        try {
            var pref = Components.classes['@mozilla.org/preferences-service;1'].getService();
        	pref = pref.QueryInterface(Components.interfaces.nsIPrefBranch);
        	var bg = pref.getCharPref(zealousPreference("background"));
        } catch (err) {
            alert("You don't have a background set.");
            return;
        }
        pref.clearUserPref(zealousPreference("background"));
        doBgSetup(bgCrap);
        return;
    }	
    
    if (!url) {
        var url = prompt("What is the URL to the background image you'd like to use?");
    }
    if (url) {
        document.getElementById('center-frame').style.background = 'white url(' + url + ') no-repeat';
        if (confirm("Is this ok?")) {
	        var pref = Components.classes['@mozilla.org/preferences-service;1'].getService();
        	pref = pref.QueryInterface(Components.interfaces.nsIPrefBranch);
        	pref.setCharPref(zealousPreference("background"), url);
            // document.getElementById('scrollback').style.background = 'white url(' + url + ') no-repeat';
        } else {
            doBgSetup();
        }
    }
}

function optionMenuInit()
{
    el = document.getElementById("menuitem_buffer");
    if (el) {
        el.setAttribute("checked", window.client.enableBuffer);
    }
}

function doPrefs()
{
    var pref = Components.classes['@mozilla.org/preferences-service;1'].getService();
    pref = pref.QueryInterface(Components.interfaces.nsIPrefBranch);

    try {
        var echo = pref.getCharPref(zealousPreference("echo"));
        if (echo == "true") {
            pref.setCharPref("zealous.temp.echo", true);
        } else {
            pref.setCharPref("zealous.temp.echo", false);
        }
    } catch (err) {
        pref.setCharPref("zealous.temp.echo", true);
    }
  
    try {
        var buffer = pref.getCharPref(zealousPreference("enableBuffer"));
        if (buffer == "true") {
            pref.setCharPref("zealous.temp.buffer", true);
        } else {
            pref.setCharPref("zealous.temp.buffer", false);
        }
    } catch (err) {
        pref.setCharPref("zealous.temp.buffer", false);
    }

    try {
        var blink = pref.getCharPref(zealousPreference("blink"));
        if (blink == "true") {
            pref.setCharPref("zealous.temp.blink", true);
        } else {
            pref.setCharPref("zealous.temp.blink", false);
        }
    } catch (err) {
        pref.setCharPref("zealous.temp.blink", false);
    }

    try {
        var beep = pref.getCharPref(zealousPreference("pageBeep"));
        if (beep == "true") {
            pref.setCharPref("zealous.temp.pageBeep", true);
        } else {
            pref.setCharPref("zealous.temp.pageBeep", false);
        }
    } catch (err) {
        pref.setCharPref("zealous.temp.pageBeep", false);
    }

    try {
        var ignore = pref.getCharPref(zealousPreference("ignoreOOC"));
        if (ignore == "true") {
            pref.setCharPref("zealous.temp.ignoreOOC", true);
        } else {
            pref.setCharPref("zealous.temp.ignoreOOC", false);
        }
    } catch (err) {
        pref.setCharPref("zealous.temp.ignoreOOC", false);
    }

    try {
        var font = pref.getCharPref(zealousPreference("fontStyle"));
        if (font) pref.setCharPref("zealous.temp.fontStyle", font);
    } catch (err) {
        pref.setCharPref("zealous.temp.fontStyle", false);
    }

    try {
        var sbFont = pref.getCharPref(zealousPreference("sbFontStyle"));
        if (sbFont) pref.setCharPref("zealous.temp.sbFontStyle", sbFont);
    } catch (err) {
        pref.setCharPref("zealous.temp.sbFontStyle", false);
    }

    try {
        var size = pref.getCharPref(zealousPreference("fontSize"));
        if (size) pref.setCharPref("zealous.temp.fontSize", size);
    } catch (err) {
        pref.setCharPref("zealous.temp.fontSize", false);
    }

    try {
        var fixedSize = pref.getCharPref(zealousPreference("fixedFontSize"));
        if (fixedSize) pref.setCharPref("zealous.temp.fixedFontSize", fixedSize);
    } catch (err) {
        pref.setCharPref("zealous.temp.fixedFontSize", false);
    }

    try {
        var sbSize = pref.getCharPref(zealousPreference("sbSize"));
        if (sbSize) pref.setCharPref("zealous.temp.sbSize", sbSize);
    } catch (err) {
        pref.setCharPref("zealous.temp.sbSize", false);
    }

    try {
        var sbPreSize = pref.getCharPref(zealousPreference("sbPreSize"));
        if (sbPreSize) pref.setCharPref("zealous.temp.sbPreSize", sbPreSize);
    } catch (err) {
        pref.setCharPref("zealous.temp.sbPreSize", false);
    }

    try {
        var macro = pref.getCharPref(zealousPreference("macro"));
        if (macro) pref.setCharPref("zealous.temp.macro", macro);
    } catch (err) {
        pref.setCharPref("zealous.temp.macro", false);
    }

    pref.setCharPref("zealous.temp.filename", zealousPreference("macro"));

    var themeArr = new Array("bg_image", "left_side", "right_side", "left_logo", "right_logo", "get_button", "master_button");

    for (var i = 0; i < 7; i++) {
        try {
            var list = pref.getCharPref(zealousPreference(themeArr[i] + ".list"));
        } catch (err) {
            continue; // No list, move on
        }
        pref.setCharPref("zealous.temp." + themeArr[i] + ".list", list);
    }

    window.open("chrome://zealotry/content/prefs.xul", "_blank", "scrollbars=no, status=no, resizable=yes, modal, dialog, chrome, width=850, height=300, screenX=100, screenY=100");

    try {
        pref.getCharPref("zealous.temp.state");
        pref.clearUserPref("zealous.temp.state");
    } catch (err) {
    	doFinishPrefs();
    } 
}

function doFinishPrefs() 
{

    var pref = Components.classes['@mozilla.org/preferences-service;1'].getService();
    pref = pref.QueryInterface(Components.interfaces.nsIPrefBranch);

    var cb = pref.getCharPref("zealous.temp.echo");

    if (cb == "true") {
        pref.setCharPref(zealousPreference("echo"), "true");
    } else {
        pref.setCharPref(zealousPreference("echo"), "false");
    }

    pref.clearUserPref("zealous.temp.echo");

    try {
        this.localEcho = pref.getCharPref(zealousPreference("echo"));
    } catch (err) {
        window.client.optionEchoSent = true;
    }

    if (this.localEcho == "false") {
        window.client.optionEchoSent = false;
    } else {
        window.client.optionEchoSent = true;
    }

    var bb = pref.getCharPref("zealous.temp.buffer");

    if (bb == "true") {
        pref.setCharPref(zealousPreference("enableBuffer"), "true");
    } else {
        pref.setCharPref(zealousPreference("enableBuffer"), "false");
    }

    pref.clearUserPref("zealous.temp.buffer");

    var ab = pref.getCharPref("zealous.temp.blink");

    if (ab == "true") {
        pref.setCharPref(zealousPreference("blink"), "true");
    } else {
        pref.setCharPref(zealousPreference("blink"), "false");
    }

    pref.clearUserPref("zealous.temp.blink");

    var pb = pref.getCharPref("zealous.temp.pageBeep");

    if (pb == "true") {
        pref.setCharPref(zealousPreference("pageBeep"), "true");
        window.pageBeep = true;
    } else {
        pref.setCharPref(zealousPreference("pageBeep"), "false");
        window.pageBeep = false;
    }

    pref.clearUserPref("zealous.temp.pageBeep");

    var pb = pref.getCharPref("zealous.temp.ignoreOOC");

    if (pb == "true") {
        pref.setCharPref(zealousPreference("ignoreOOC"), "true");
        window.ignoreOOC = true;
    } else {
        pref.setCharPref(zealousPreference("ignoreOOC"), "false");
        window.ignoreOOC = false;
    }

    pref.clearUserPref("zealous.temp.ignoreOOC");

    try {
        enableBuffer = pref.getCharPref(zealousPreference("enableBuffer"));
    } catch (err) {
        window.client.enableBuffer = false;
        enableBuffer = "false";
    }

    if (enableBuffer == "true") {
        window.client.enableBuffer = true;
    }

    try {
        macro = pref.getCharPref("zealous.temp.macro");
    } catch (err) {
        macro = "false";
    }

    if (macro && macro != "false") {
        pref.setCharPref(zealousPreference("macro"), macro);
        pref.clearUserPref("zealous.temp.macro");
    }

    setFont();
    setSize();
    setFixedSize();
    // setSBPreSize();
    // setSBSize();
    // setSBFont();
    setTheme();
    readConfigurationFile();
}

function setTheme(styles)
{
    if (styles) {
        document.getElementById('center-frame').style.background = styles[1];
        // document.getElementById('scrollback').style.background = styles[1];
    }

    var pref = Components.classes['@mozilla.org/preferences-service;1'].getService();
    pref = pref.QueryInterface(Components.interfaces.nsIPrefBranch);

    var themeArr = new Array("bg_image", "left_side", "right_side", "left_logo", "right_logo", "get_button", "master_button");

    for (var i = 0; i < 7; i++) {
        try {
                var url = pref.getCharPref("zealous.temp." + themeArr[i]);
        } catch (err) {
                try {
                        // It was deleted in the preferences.
                        pref.clearUserPref(zealousPreference(themeArr[i]));
                } catch (err2) {}
                continue;
        }
        pref.setCharPref(zealousPreference(themeArr[i]), url);
        pref.clearUserPref("zealous.temp." + themeArr[i]);
    }

    for (var i = 0; i < 7; i++) {
        try {
            var list = pref.getCharPref("zealous.temp." + themeArr[i] + ".list");
        } catch (err) {
            continue;
        }
        pref.setCharPref(zealousPreference(themeArr[i] + ".list"), list);
        pref.clearUserPref("zealous.temp." + themeArr[i] + ".list");
    }

    for (var i = 0; i < 7; i++) {
        switch(themeArr[i]) {
	    case "bg_image":
            try {
                    var url = pref.getCharPref(zealousPreference("bg_image"));
            } catch (err) {
                    break; // No background image to set
            }
            document.getElementById('center-frame').style.background = 'white url(' + url + ') no-repeat';
            // document.getElementById('scrollback').style.background = 'white url(' + url + ') no-repeat';
            break;
	    case "left_side":
            try {
                var url = pref.getCharPref(zealousPreference("left_side"));
            } catch (err) {
                break; // No left sidebar to set
            }
            document.getElementById('left-frame').contentDocument.getElementById('Left_Graphic').src = url;
            break;
	    case "left_logo":
            try {
                var url = pref.getCharPref(zealousPreference("left_logo"));
            } catch (err) {
                break; // No left logo to set
            }
            document.getElementById('left-frame').contentDocument.getElementById('Chat_Theatre').src = url;
            break;
        case "right_side":
            try {
                var url = pref.getCharPref(zealousPreference("right_side"));
            } catch (err) {
                break; // No right sidebar to set
            }
            document.getElementById('right-frame').contentDocument.getElementById('Right_Strip').src = url;
            break;
        case "right_logo":
            try {
                var url = pref.getCharPref(zealousPreference("right_logo"));
            } catch (err) {
                break; // No right logo to set
            }
            document.getElementById('right-frame').contentDocument.getElementById('Skotos_Logo').src = url;
            break;
        case "get_button":
            try {
                var url = pref.getCharPref(zealousPreference("get_button"));
            } catch (err) {
                break; // No getting started button to set
            }
            document.getElementById('right-frame').contentDocument.getElementById('Getting_Started').src = url;
            break;
        case "master_button":
            try {
                var url = pref.getCharPref(zealousPreference("master_button"));
            } catch (err) {
                break; // No mastering chat button to set
            }
            document.getElementById('right-frame').contentDocument.getElementById('Mastering_Chat').src = url;
            break;
	    default:
            break;
        }
    }

    // OOO: This apparently doesn't want to work. Not sure why at this point.
    var body = document.getElementById('left-frame').contentDocument.getElementsByTagName('body')[0];
    if (body) {
        var link = document.createElement('img');
        link.setAttribute('border', '1');
        link.setAttribute('id', 'zelly');
        link.setAttribute('style', 'position:absolute; top:50px; left:5px');
        link.setAttribute('src', 'chrome://zealotry/skin/zealotry/zelly.png');
        body.appendChild(link);
    }
}

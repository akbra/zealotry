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

const ZEALOUS_VERSION = "0.7.4.2";
const POLL_DELAY = 50;

var bgCrap = null;
var munge_buffer = "";
var enter_down = false;
var scroll_splitter = null;
var scrollback = null;
var scrolling = false;
var scrolltarg = null;
var enableBuffer = "false";

function makeCharName()
{
    var ztitle, index, zlist, i;

    ztitle = window.charName;

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
    scroll_splitter = document.getElementById('scroll_splitter');
    scrollback = document.getElementById('scrollback');

    // Remove the onload trigger on the XUL
    window.onload = null;
    
    /*
    This should no longer happen.
      if (this.alreadyLoaded) {
        // I don't know why this happens :( 
        return false;
    }
    
    this.alreadyLoaded = true;
    */
    
    if (!document.getElementById("input")) {
        alert("cannot find input box element");
    }
    
    var h = document.location.href;
    
    if (h) {
        // h should be along the lines of "zealotry:username@server"
        // strip away the "zealotry:" part
        h = h.substr(9);

        // we should now have [user]@[game]
        var ugArr = h.split("@");
        if (ugArr.length != 2) {
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
    
    if (!window.charName) {
        alert("this client will not run without a base url");
        return;
    }

    if (!window.baseURL) {
        alert("this client will not run without a base url");
        return;
    }
    
    document.title = makeCharName() + " @ " + window.gameName;
    
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
    
    lf.setAttribute("src", baseURL + "Left.sam?zealous="   + ZEALOUS_VERSION);
    cf.setAttribute("src", baseURL + "Center.sam?zealous=" + ZEALOUS_VERSION);
    rf.setAttribute("src", baseURL + "Right.sam?zealous="  + ZEALOUS_VERSION);

    doBgSetup();

    // we have to use a polling system to support mozilla 1.0
    
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

    window.client.setClientOutput(output, scrollback.contentDocument.body);

    window.client.clearHistory();

    window.myMacros = new MacroStruct(client);

    readConfigurationFile();

    window.client.connect(
                          window.center_frame.getHost(),
                          window.center_frame.getPort(),
                          onRead
                          );

    /* window.client.connection.onClose = onClose; */
    displayLine("SVN Zealotry version " + ZEALOUS_VERSION + " loading...");

    var obj = document.getElementById("input");

    obj.focus();
    obj.addEventListener("keydown", onInputKeyDown, false);
    obj.addEventListener("keyup", onInputKeyUp, false);
    window.onkeypress = onWindowKeyPress;

    client.connection.write("SKOTOS Zealous " + ZEALOUS_VERSION + "\n");

    startAutoLogging();
    doFontStyleAndSize();
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
            if (!onPageDown() && enableBuffer == "true") { // onPageDown() is true or false depending on if we're at document bottom or not
                scroll_splitter.setAttribute('state', 'collapsed');
                scrolling = false;
            }
        }
        break;

    case 33: // page up
        if (e.ctrlKey != true && e.shiftKey != true && e.altKey != true) {
            if (!scrolling && enableBuffer == "true") {
                scroll_splitter.setAttribute('state', 'open');
                doScroll();
	        scrollback.contentDocument.body.scrollTop = scrollback.contentDocument.body.scrollHeight;
                scrolling = true;
            }
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
    if (enableBuffer == "true") {
	var w = scrollback.contentWindow; // window.center_frame;
    } else {
	var w = window.center_frame;
    }

    newOfs = w.pageYOffset + (w.innerHeight / 2);
    if (newOfs < (w.innerHeight + w.pageYOffset))
        w.scrollTo(w.pageXOffset, newOfs);
    else
        w.scrollTo(w.pageXOffset, (w.innerHeight + w.pageYOffset));
    return newOfs < w.scrollMaxY;

}

function onPageUp()
{
    if (enableBuffer == "true") {
	var w = scrollback.contentWindow; // window.scrollback;
    } else {
	var w = window.center_frame;
    }

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

function handleInputLine(str) {
    if (!handleCommands(str)) {
        var expanded = myMacros.applyMacros(str);
        if (expanded) {
            window.client.onInputCompleteLine(expanded);
            if (window.client.optionEchoSent) {
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
    if (status == 0)
        displayLine("Connection closed - session ended", "sys");
    else if (status == NS_BINDING_ABORTED)
        displayLine("Connection lost - session ended", "sys");
    else
        displayLine("Connection failed: '"+errStr+"'", "sys");
    
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
    var str;
    var lines = bigstr.split('\r\n');
    var ix = -1;
    var munge_it = false;
    
    if (window.client == null) {
       /*
       **	This seems to happen in mid-reload sometimes: the
       **	function is still being called, but the 'window'
       **	is no longer connected... just return here and
       **	await our doom
       */
       return;
    }
    
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
                                        "CHAR " + window.charName + "\n");
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
            mungeForDisplay(str);
            if (i < lines.length-1) {
                outputNL();
            }
        }
    }
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

        try {
            this.autoLogging = pref.getCharPref(zealousPreference("autoLogging"));
        } catch (err) {
            el.setAttribute("checked",  window.logFile != null);
            el.setAttribute("disabled", false);
            el.setAttribute("enabled",  true);
            this.autoLogging = null;
        }
        if (this.autoLogging) {
            el.setAttribute("enabled",  false);
            el.setAttribute("disabled", true);
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
            el.setAttribute("enabled",  true);
            el.setAttribute("disabled", false);
            this.autoLogging = null;
        }
        if (this.autoLogging) {
            el.setAttribute("enabled",  false);
            el.setAttribute("disabled", true);
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

function escapeSkotosLink(s)
{
    // we can't use regexp replace here, because we will overwrite
    // the global RegExp object with new regexp results. 
    var len = s.length;
    var res = "";
    var seq = 0;
    for (var i = 0; i < len; i++)
        if (s[i] == "'") {
            res += s.substring(seq, i) + "\\";
            seq  = i;
        } else if (s[i] == '%') {
            res += s.substring(seq, i) + "%25";
            seq  = i+1;
        } else if (s.substr(i, 6) == "&quot;") {
            res += s.substring(seq, i) + '"';
            seq  = i+6;
        }
    return res + s.substring(seq);
}

function mungeForDisplay(str) {
    var element, style, pop, arr;

    /*
     * Add chopped munge-data.
     */
    str = munge_buffer + str;
    munge_buffer = "";
    
    if (arr = (/<font color=([^>]*)>/i).exec(str)) {
        style = "color: " + arr[1];
    } else if (arr = (/<b>/i).exec(str)) {
        style = "font-weight: bold";
    } else if (arr = (/<i>/i).exec(str)) {
        style = "font-style: italic";
    } else if (arr = (/<pre>/i).exec(str)) {
        element = document.createElementNS("http://www.w3.org/1999/xhtml",
                                           "html:pre");
    } else if (arr = (/<body bgcolor=\'([^\']*)\' text=\'([^\']*)\'[^>]*>/i).exec(str)) {
	bgCrap = arr;
	doBgSetup(arr);
        frames["center-frame"].document.body.style.color = arr[2];
        scrollback.contentDocument.body.style.color = arr[2];
    } else if (arr = (/<a xch_cmd='([^>]*)'>/i).exec(str)) {
        element = document.createElementNS("http://www.w3.org/1999/xhtml",
                                           "html:a");
        element.setAttribute( "href", "javascript:document.skotosLink('"+escapeSkotosLink(arr[1])+"');" );
        /* } else if (arr = (/&lt;inshow what='([^>]*)'&gt;/i).exec(str)) {
           element = document.createElementNS("http://www.w3.org/1999/xhtml",
           "html:img");
           element.style.border = 'solid #aaaa99 1px;';
           element.setAttribute( "src", arr[1] );
           } else if (arr = (/&lt;\/inshow&gt;/i).exec(str)) {
           pop = true; */
    } else if (arr = (/<\/[a-z]+>/i).exec(str)) {
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
            window.client.pushTag(element);
        }
        if (pop) {
            window.client.popTag();
            // scrolltarg = scrolltarg.parentNode ? scrolltarg.parentNode : scrolltarg;
        }
        if (right) {
            mungeForDisplay(right);
        }
        return;
    } else if( !(/<([^>]*)>/i).exec(str) && (arr = (/</i).exec(str)) ) {
        /*
         * We've caught a chopped off tag.
         */
        munge_buffer = "<" + RegExp.rightContext;
        str = RegExp.leftContext;
    }
    outputText(str);
}

function outputNL(nolog) {
    window.client.outputNL();
    // scrolltarg.appendChild(document.createElement("br"));
    if (!nolog && window.logFile) {
        doLogging("\n");
    }
}


function outputStyledText(str, style) {
    var span;
    
    span = document.createElementNS("http://www.w3.org/1999/xhtml",
                                    "html:span");
    span.setAttribute("style", style);
    window.client.pushTag(span);
    outputText(str);
    window.client.popTag();
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
        window.myMacros.processMacroCommand(arr ? arr[1] : str);
        return true;
    }
    if (str == "CONFIG WRITE") {
        writeConfigurationFile();
        return true;
    }
    return false;
}

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
        this.homeFolder = pref.getCharPref("zealous.homeFolder");
    } catch (err) {
        return;
    }

    configFile = new File(this.homeFolder);
    configFile.appendRelativePath("zealous." + safe(charName) + ".config");
    if (!configFile.exists()) {
        configFile = new File(this.homeFolder);
        configFile.appendRelativePath("zealous.config");
    }
    if (configFile.exists()) {
        configFile.open("r");
        while (!configFile.EOF) {
            var configLine = configFile.readline();
            handleCommands(configLine);
        }
        configFile.close();
        outputLine("[CONFIG: Finished reading configuration]");
        return;
    }

    // Unable to locate the config file.. lets give them a chance to locate it manually
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
    autoLogFile.appendRelativePath("autolog." + safe(gameName) + "." + safe(charName) + "." + new Date().getTime());
    
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
    	this.fontStyle = pref.getCharPref(zealousPreference("fontStyle"));
    } catch (err) {
    	pref.setCharPref(zealousPreference("fontStyle"), frames["center-frame"].document.body.style.fontFamily);
    	doFontStyleAndSize();
    }

    setFont(this.fontStyle);
    // frames["center-frame"].document.body.style.fontFamily = this.fontStyle;
    
    try {
    	this.fontSize = pref.getCharPref(zealousPreference("fontSize"));
    } catch (err) {
    	pref.setCharPref(zealousPreference("fontSize"), frames["center-frame"].document.body.style.fontSize);
    	doFontStyleAndSize();
    }

    setSize(this.fontSize);
    // frames["center-frame"].document.body.style.fontSize = this.fontSize;

    try {
        this.preFontSize = pref.getCharPref(zealousPreference("fixedFontSize"));
    } catch (err) {
        pref.setCharPref(zealousPreferences("fixedFontSize"), "10pt");
        doFontStyleAndSize();
    }

    setFixedSize(this.preFontSize);

}

function helpMenuInit(str) 
{
    switch(str) {
	case "about": // Open about dialog
		window.open("aboutzealous.html", "aboutWindow", 'width=400, height=550, screenX=100, screenY=100');
		return;

	case "changelog": // Open changelog dialog
		window.open("changelog.html", "changeWindow", 'width=450, height=500, screenX=100, screenY=100, scrollbars=yes');
		return;
	case "dictionary": // Open dictionary prompt
		var word = prompt("What word do you wish to define?");
		if (word) {
			var DICT = "http://www.dictionary.net/";
		        window.open(DICT + word, 'Dictionary', 'height=200,width=650,scrollbars=yes,screenX=100,screenY=100');
		}
		return;	
	case "content": // Open help contents dialog
		window.open("aboutzealous.html", "aboutContent", 'width=400, height=550, screenX=100, screenY=100');
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
        document.getElementById('scrollback').style.background = bgCrap[1];
        return;
    }
    document.getElementById('center-frame').style.background = 'white url(' + this.bgImage + ') no-repeat';
    document.getElementById('scrollback').style.background = 'white url(' + this.bgImage + ') no-repeat';
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
            document.getElementById('scrollback').style.background = 'white url(' + url + ') no-repeat';
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


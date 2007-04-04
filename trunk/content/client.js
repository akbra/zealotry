7/*
 *
 * The Zealous Client (C) 2002 Skotos Tech Inc
 *
 *  020622  Zell    Initial Revision
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

function CClient(doc, window) // , sback)
{
  this.document = doc;
  this.window = window;
  // this.sback = sback;

  this.optionMaxMessages   =  1000; // scrollback buffer size
  this.optionMaxHistory    =    50; // last commands buffer
  this.optionEchoSent      =  true; // echo what you typed on the output window
  this.optionColourValues  = ["#000000","#CCCCCC","#FFFF00","#FF0000"]; // colours used in client
  this.optionColourKeys    = [ "bg", "msg", "com", "sys"];              // what the above colours do

  this.connection = false;

  this.inputHistory = new Array();
  this.incompleteLine = "";
  this.lastHistoryReferenced = -1;
  this.messageCount = 0;

  this.localEcho = true;

  this.current_output = false;
  this.topmost_output = false;
  // this.sco = false;
  // this.stmo = false;
  this.tagStack = new Array();
}

CClient.prototype.setClientOutput =
function client_sco(output) { // , cboutput) {
    this.current_output = this.topmost_output = output;
    // this.sco = this.stmo = cboutput;
}

CClient.prototype.isConnected =
function client_ic()
{
    return !!(this.connection);
}

CClient.prototype.prevInputBuffer = 
function client_pib()
{
    if (!this.localEcho)
        return;

    var textBox = this.document.getElementById("input");

    if (this.lastHistoryReferenced == -2) {
        textBox.value = this.incompleteLine;
	this.lastHistoryReferenced = -1;
    } else if (this.lastHistoryReferenced < this.inputHistory.length -1) {
       textBox.value = this.inputHistory[++this.lastHistoryReferenced];
    }

    /* Set the cursor at the end of the line, effectively. */
    textBox.setSelectionRange(textBox.value.length, textBox.value.length);
    textBox.focus();
}

CClient.prototype.nextInputBuffer = 
function client_nib()
{
    if (!this.localEcho)
        return;

    var textBox = this.document.getElementById("input");

    if (this.lastHistoryReferenced > 0) {
        textBox.value = this.inputHistory[--this.lastHistoryReferenced];
    } else if (this.lastHistoryReferenced == 0) {
	// -1 means we're displaying incompleteLine
        this.lastHistoryReferenced = -1;
        textBox.value = this.incompleteLine;
    } else if (this.incompleteLine) {
	// -2 means we're displaying null line -after- incompleteLine
        this.lastHistoryReferenced = -2;
        textBox.value = null
        /* Skip the cursor-setting bit at the end. */
        return;
    }
    textBox.setSelectionRange(textBox.value.length, textBox.value.length);
    textBox.focus();
}

CClient.prototype.onInputCompleteLine =
function client_oicl(str) {
    if (this.localEcho)
    {
        if (this.inputHistory[0] != str)
            this.inputHistory.unshift(str); // unshift to put at beginning

        if (this.inputHistory.length > this.optionMaxHistory)
            this.inputHistory.pop(); // pop to pull from the end
    }

    this.lastHistoryReferenced = -1;
    this.incompleteLine = "";

    doScroll();
    this.connection.write(str + "\n");
}

CClient.prototype.clearHistory = 
function client_ch()
{
//    while (this.output.firstChild)
//        this.output.removeChild(this.output.firstChild);

//    this.messageCount = 0;
}

CClient.prototype.outputText =
function client_ot(msg) {
    /* create the node */
    var newNode = document.createTextNode(msg);
    // var sNode = document.createTextNode(msg);

    /* update the one-way linked list */
    newNode.lastTextNode = this.currentTextNode;
    // sNode.lastTextNode = this.currentScrollbackTextNode;
    this.currentTextNode = newNode;
    // this.currentScrollbackTextNode = sNode;

    this.outputNode(newNode);
    // var cloned = this.outputNode(newNode);
    // cloned.lastTextNode = this.currentScrollbackText;
    // this.currentScrollbackText = cloned;
    doAlert();
}

function doScroll() {
   var frame = window.center_frame;

   frame.scrollTo(frame.pageXOffset, frame.document.height + 40);
}

function testScrollbarPosition() {
   var frame = window.center_frame;

   return (frame.document.height -
	   (frame.innerHeight + frame.pageYOffset)) < 40;
}

// output_node returns the scrollback node.
CClient.prototype.outputNode =
function output_node(node) { // , no_cloning) {
    var scrollFlag = testScrollbarPosition();
    // var cloned = no_cloning ? null : node.cloneNode(true);
    
    this.current_output.appendChild(node);
    // if (!no_cloning) this.sco.appendChild(cloned);
    if (scrollFlag) {
       doScroll();
    }
    // return cloned;
}

CClient.prototype.outputNL =
function client_onl(msg) {
    this.outputNode(
        document.createElementNS("http://www.w3.org/1999/xhtml",
                                 "html:br"));
}

CClient.prototype.outputBS =
function client_obs(num) {
    var scrollFlag = testScrollbarPosition();
    /* delete data backwards, possibly stepping through several text nodes */
    while (this.currentTextNode && num > 0) {
        len = this.currentTextNode.length;
        offset = len - num;
        if (offset >= 0) {
            num = 0;
        } else {
            offset = 0;
            num -= len;
        }
        this.currentTextNode.deleteData(offset, len-offset);
        // this.currentScrollbackText.deleteData(offset, len-offset);
        /* if we deleted all the text in the current node, find the next one */
        while (this.currentTextNode && this.currentTextNode.length == 0) {
            this.currentTextNode = this.currentTextNode.lastTextNode;
            // this.currentScrollbackText = this.currentScrollbackText.lastTextNode;
        }
    }
    if (scrollFlag) {
        doScroll();
    }
}


CClient.prototype.pushTag =
function client_push(name, element) {

    this.outputNode(element);
    // var cloned = this.outputNode(element);
    element.next_output = this.current_output;
    this.current_output = element;
    // cloned.next_output = this.sco;
    // this.sco = cloned;
    this.tagStack.push(name);
}

CClient.prototype.popTag =
function client_pop(name) {
    if (!this.current_output.next_output) {
        // already bottom level
        return;
    }

    if (this.tagStack.length == 0) {
        // Sanity check, should cause same result as previous check.
        return;
    }
    for (i = this.tagStack.length - 1; i >= 0; i--) {
        if (this.tagStack[i] == name) {
	    for (j = this.tagStack.length - 1; j >= i; j--) {
		this.tagStack.pop();
		this.current_output = this.current_output.next_output;
	    }
        }
    }
    // Popping wrong element, ignore.  This approach makes it possible to
    // parse the "HTML" that TEC and Grendel's Revenge throw our way.
}

CClient.prototype.connect =
function client_c(host, port, onReadHandler)
{
    if (this.isConnected())
        throw "Already connected!";

    this.connection = new CConnection(host, port);
    this.connection.onRead = onReadHandler;
    this.connection.connect();
}

CClient.prototype.disconnect =
function client_d()
{
    this.connection.disconnect();

    delete this.connection;
    this.connection = false;
}

CClient.prototype.tabCompleteInputBuffer =
function client_tab()
{
    if (!this.localEcho)
        return;

    var textBox = this.document.getElementById("input");
    var historyRef = this.lastHistoryReferenced;
    do {
        historyRef++;
        if (historyRef > this.inputHistory.length -1) {
            historyRef = -1;
            candidate = this.incompleteLine;
        } else {
            candidate = this.inputHistory[historyRef];
        }
        if (candidate.indexOf(this.incompleteLine) == 0) {
            textBox.value = candidate;
            this.lastHistoryReferenced = historyRef;
            return;
        }
    } while (historyRef != this.lastHistoryReferenced)
}


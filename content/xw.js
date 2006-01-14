/*
 *
 * The XWoe Client (C) 2005 Skotos Tech Inc, derived from ...
 * The Zealous Client (C) 2002 Skotos Tech Inc
 *
 *  020622  Zell    Initial Revision
 *  03????  DanS    Added dynamic baseurl etc
 *  030606  Zell    Minor rewrite & upgrade, fixes from Zwoc
 *  050110  Kalle   Derivative work (XWoe)
 *
 * Zealous/XW is based on MUDzilla, the Mozilla based MUD client,
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
const TOW_VERSION = "0.3";

var CurrWoe = null; // :(

WoeClass = function(handler)
{
    this.h = handler;
    CurrWoe = this; // a sucky fix, but oh well.
};

WoeClass.prototype = {
    munge_buffer: "",
    enter_down: false,

    onMainLoad: function()
    {
        if (this.alreadyLoaded) {
            /* I don't know why this happens :( */
            return false;
        }

        this.alreadyLoaded = true;

        pm.enablePrivilege(privs);

        document.title = "XWoe (TOW interface 0.3)";

        this.h.init_xw();

        this.mainStep();
    },

    onUnLoad: function()
    {
        pm.enablePrivilege(privs);

        if (window.client && window.client.connection) {
            window.client.connection.disconnect();
        }
    },

    mainStep: function()
    {
        pm.enablePrivilege(privs);

        // Not sure if bubbleSettings is gonna do much good here.
        // bubbleSettings();

        window.client = new CClient();

        // No config file for now. No clue what it'd contain, except perhaps font settings.
        // readConfigurationFile();

        window.client.connect
        ("mv.skotos.net", //window.content_frame.getHost(),
         5090, // window.content_frame.getPort(),
         this.onRead);

        client.connection.write("TreeOfWoe " + TOW_VERSION + "\n");
        client.connection.write("SEND \n");
    },

    onNextCmd: function()
    {
        window.client.nextInputBuffer();
    },

    onPrevCmd: function()
    {
        window.client.prevInputBuffer();
    },

    onClose: function(status, errStr)
    {
        this.connectionTerminated();
    },

/* function loadCookie(name) {
   var allcookies = content_frame.dacookie();

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
} */

    onRead: function(bigstr) 
    {
        var self = CurrWoe;
        bigstr = self.munge_buffer + bigstr;
        if (bigstr.substr(bigstr.length-2) != '\r\n') {
            var lidx = bigstr.lastIndexOf('\r\n');
            self.munge_buffer = bigstr.substr(lidx);
            bigstr = bigstr.substr(0, lidx);
        } else {
            self.munge_buffer = "";
        }
        var lines = bigstr.split('\r\n');
        var sz    = lines.length;
    
        for (var i = 0; i < sz; i++) {
            self.h.xw_processWoeServerCommand(lines[i]);
        }
    },

/* function zealousPreference(setting)
{
    return "zealous." + safe(gameName) + "." + safe(charName) + "." + setting;
} */

    connectionTerminated: function()
    {
        alert("connection terminated");
    
        delete window.client.connection;

        window.client.connection = false;
        window.title = "XWoe (Disconnected.)";

        delete window.connectHost;
        delete window.connectPort;
    }
};

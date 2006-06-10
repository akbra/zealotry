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

var pm = netscape.security.PrivilegeManager;
var privs = "UniversalBrowserRead UniversalBrowserWrite UniversalXPConnect";

var WoeHandler = null;

var WoeHandlerClass = function(host, port)
{
    this.host = host;
    if (port) this.port = port;
};

WoeHandlerClass.prototype = {
    tow: null,
    xtree: null,
    cframe: null,
    host: null,
    port: 5090,
    xwi: null,
    lastselected: "",
        
    getHost: function()
    {
        return this.host; // "mv.skotos.net";
    },
        
    getPort: function()
    {
        return this.port; // 5090;
    },

    xw_newTree: function(s, pre, id)
    {
        var item = document.createElement('treeitem');
        item.setAttribute('container',  'true');
        item.setAttribute('open',       'false');
        item.setAttribute('rname',      s);
        item.setAttribute('woe_folder', true);
        
        var row = document.createElement('treerow');
        item.appendChild(row);
            
        var cell = document.createElement('treecell');
        cell.setAttribute('label', s);
        row.appendChild(cell);
        
        var kids = document.createElement('treechildren');
        kids.setAttribute('id',      id + s);
        kids.setAttribute('path',    pre + s);
        kids.setAttribute('fetched', false);
        item.appendChild(kids);
        
        return item;
    },

    // check if a folder is empty and, if so, remove it
    xw_checkFolder: function(o)
    {
        // XXX: Folder is treeitem -> treechildren + treerow
        // Acquired (o) is treechildren object. If treechildren is childless,
        // folder is empty, and treeitem should be removed.
        if (!o.hasChildNodes()) {
            // Folder is empty.
            var obj = o.parentNode; // hop to treeitem
            var p = obj.parentNode; // hop to treeitem's dad
            p.removeChild(obj);     // remove treeitem
            if (p.getAttribute('path') != null) this.xw_checkFolder(p); // check parent, presuming it has an id
        }
    },

    xw_newObject: function(s, path, id) 
    {
        var item = document.createElement('treeitem');
        item.setAttribute('path',      path + s);
        item.setAttribute('id',        id + s);
        item.setAttribute('rname',     s);
        item.setAttribute('container', 'false');
        // item.setAttribute('woe_folder', null);

        var row = document.createElement('treerow');
        item.appendChild(row);
            
        var cell = document.createElement('treecell');
        cell.setAttribute('label', s);
        row.appendChild(cell);
        
        return item;
    },

    // clear an object
    xw_clearObject: function(s)
    {
        var obj = this.xw_queryWoeObject(s, true);
        if (obj) {
            // XXX: This is the treeitem.
            var p = obj.parentNode;
            p.removeChild(obj); // remove treeitem, in which treerow + treecell reside
            this.xw_checkFolder(p); // check treeitem's parent.
        }
    },

    //    counter: 0,
    
    xw_queryWoeObject: function(s, nullIfMissing)
    {
        /* this.counter++;
           var dbg = this.counter == 2; */
        var stct = s.split(':');
        var sz   = stct.length;
        var pre  = '';
        var tid  = '';
        var s    = '';
        var f    = false;
        var papa = this.tow;
        var childCount = 0;
        var children = null;
        var child = null;
        var newChild = null;
        var i = 0;
        var j = 0;
        
        for (i = 0; i < sz; i++) { // step through each level (e.g. Mortalis:players:K:kalle is 4 levels)
            s = stct[i];
            newChild = document.getElementById(tid + s);
            if (!newChild) { // the folder/object is not existing yet, so we need to add it
                if (nullIfMissing) return null;
                f = i+1 < sz; // f == folder (true) or object (false)
                newChild = (f ? this.xw_newTree(s, pre, tid) : this.xw_newObject(s, pre, tid));
                children = papa.childNodes;
                childCount = children.length;
                for (j = 0; j < childCount; j++) {
                    child = children.item(j);
                    // if (dbg) alert((f ? "woe_folder: " : "object: ") + "child #" + j + " (" + (child.getAttribute('woe_folder') ? "f" : "o") + "), " + tid + s + " vs " + child.getAttribute('rname'));
                    if ((f && child.getAttribute('woe_folder') && s < child.getAttribute('rname')) || // for folders
                        (!f && (child.getAttribute('woe_folder') || s < child.getAttribute('rname')))) { // for objects
                        break;
                    }
                }
                // if (dbg) alert("Found " + j + " (" + (f ? "f" : "o") + "?" + (newChild.getAttribute('woe_folder') ? "f" : "o") + ")");
                // j++; // move i to the node which we will place the new node before.
                if (j < childCount) {
                    // if (dbg) alert("inside range; insertBefore " + children.item(j).getAttribute('rname'));
                    // new node is above the last node (somewhere)
                    papa.insertBefore(newChild, children.item(j));
                } else {
                    // if (dbg) alert("outside range; append after " + (childCount > 0 ? children.item(childCount-1).getAttribute('rname') : "[n/a]"));
                    // new node is after the last node
                    papa.appendChild(newChild);
                }
                // (obj, byLabel, intoContainer)
                // papa.appendChild();
            }
            papa = (f ? newChild.firstChild.nextSibling : newChild);
            pre += s + ":";
            tid += s + "_";
        }
        return papa;
    },
        
    xw_TreeAttrModified: function(e)
    {
        var self = WoeHandler; // *mutter*
        if (e.attrName != "open") return true; // we only care about the "open" attribute
        if (e.newValue != "true") return true; // we only care about when the state becomes open
        try {
            var src = e.relatedNode.ownerElement;
            var folder = src.parentNode;
            var path = (folder == self.tow ? null : folder.getAttribute('path'));
            var item = src.firstChild.firstChild; //
            var itemLabel = item.getAttribute('label');
            var resolved = (path ? path + ":" : "") + itemLabel;
            // alert("Opening " + resolved);
            if (!item.getAttribute('fetched')) {
                // alert("Not fetched -> " + resolved + ": " + self.xwi.client.write);
                self.xwi.client.connection.write("SEND " + resolved + "\n");
                // woeConn.writeLine("SEND " + node.getFullPath());
                item.setAttribute('fetched', true);
            }
        } catch (e) {}
    },
        
    xw_processWoeServerCommand: function(cmd) 
    {
        if (!cmd || cmd == "") {
            return;
        }
        // SET http://mv.skotos.netURL OBJECT
        // CLEAR OBJECT
        var process = cmd.split(' ');
        switch (process[0]) {
        case "SET" :
            if (process[2]) {
                this.xw_queryWoeObject(process.splice(2).join(' ')).src = process[1];
            } else {
                alert("queryWoeObject(" + process[0] + " - " + process[1] + " - " + process[2] + ") isn't valid");
            }
            break;
            
        case "CLEAR" :
            // alert(cmd);
            // clear object
            this.xw_clearObject(process.splice(1).join(' '));
            break;
            
        default :
            alert("Unknown command: " + process[0]);
            break;
        }
    },

    init_xw: function() 
    {
        this.tow   = document.getElementById('tow');
        this.xtree = document.getElementById('xtree');
        this.cframe = document.getElementById('pageFrame');
        this.tow.addEventListener("DOMAttrModified", this.xw_TreeAttrModified, false);
    },

    set_xwi: function(xwi)
    {
        this.xwi = xwi;
        // alert("WoeHandler.xwi = " + WoeHandler.xwi);
    },
        
    woeView: function()
    {
    },
        
    woeEdit: function()
    {
    },
        
    woeXML: function()
    {
    },
    
    woeKarmode: function()
    {
    },
        
    onselect: function()
    {
        var index = this.xtree.currentIndex;
        if (index == -1) {
            // deselect
            return;
        }
        
        var el = this.xtree.contentView.getItemAtIndex(index);
        if (!el.src) {
            // selected folder, not object
            // but we still want to set last selected, otherwise we won't be able to reload an item
            // by clicking on a nearby folder and then on the item again.
            this.lastselected = null;
            return;
        }
        var src = el.src;
        // When someone opens/closes folders, the onselect is triggered as well. This makes sure it doesn't
        // reload the current selection repeatedly when browsing through folders.
        if (src == this.lastselected) return;
        this.lastselected = src;

        window.open("http://" + this.getHost() + "/" + el.src, 'pageFrame');
    }
};

function initializeWoeInterface()
{
    window.onload = null;
    // Was a valid value supplied?
    var url = document.location.href;
    // First try to extract it, if it's a shortcut.
    if (MyWorld.xwoe_servMap[url.substr(4)]) {
        url = "woe://" + MyWorld.xwoe_servList[MyWorld.xwoe_servMap[url.substr(4)]];
    } else if (url.substr(0, 6) != "woe://") {
        alert("Invalid URL. Use 'woe://HOSTNAME' or 'woe://HOSTNAME:PORTNUMBER'");
        document.location.href = "about:blank";
    }
    // Figure out the server name.
    var port = null;
    
    // Strip off "woe://"
    url = url.substr(6);

    // Is there a colon (i.e. port reference)?
    url = url.split(":");
    if (url.length == 2) {
        port = url[1];
        url = url[0];
    } else url = url[0];

    WoeHandler = new WoeHandlerClass(url, port);
    WoeInstance = new WoeClass(WoeHandler);
    WoeHandler.set_xwi(WoeInstance);
    WoeInstance.onMainLoad();
    document.getElementById('pageFrame').width = "70%";
    document.getElementById('pageFrame').style.width = "70%";

    // Set the gamelink frame source.
    // alert(url + "/Dev/Logo.sam");
    window.open("http://" + url + "/Dev/Logo.sam", "gamelink");
    // document.getElementById('gamelink').src = "http://" + url + "/Dev/Logo.sam";
}

function ontreeselectwrapper(e)
{
    WoeHandler.onselect(e);
}

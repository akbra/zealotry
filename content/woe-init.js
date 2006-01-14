var pm = netscape.security.PrivilegeManager;
var privs = "UniversalBrowserRead UniversalBrowserWrite UniversalXPConnect";
try {
    pm.enablePrivilege(privs);
} catch (err) {
    throw("Zealotry Woe failed to acquire privileges. This shouldn't happen.");
}

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
        
    getHost: function()
    {
        return this.host; // "mv.skotos.net";
    },
        
    getPort: function()
    {
        return this.port; // 5090;
    },

    xw_listenTree_Open: function(event)
    {
        alert("listenTree_Open: " + event);
    },

    xw_newTree: function(s, pre, id)
    {
        var item = document.createElement('treeitem');
        item.setAttribute('container', 'true');
        item.setAttribute('open',      'false');
        // item.addEventListener('toggleOpenState', this.xw_listenTree_Open, false);
        
        var row = document.createElement('treerow');
        item.appendChild(row);
            
        var cell = document.createElement('treecell');
        cell.setAttribute('label', s);
        row.appendChild(cell);
        
        var kids = document.createElement('treechildren');
        kids.setAttribute('id', id + s);
        kids.setAttribute('path', pre + s);
        item.appendChild(kids);
        
        return item;
    },

    xw_newObject: function(s, path, id) 
    {
        var item = document.createElement('treeitem');
        item.setAttribute('path', path + s);
        item.setAttribute('id', id + s);
        item.setAttribute('container', 'false');
            
        var row = document.createElement('treerow');
        item.appendChild(row);
            
        var cell = document.createElement('treecell');
        cell.setAttribute('label', s);
        row.appendChild(cell);
        
        return item;
    },
        
    xw_queryWoeObject: function(s)
    {
        // XXX: Why is this thing replacing : with _? To have a valid "id" tag? Why not simply
        // use another attribute?
        // Because we get them by ID. Le sigh!
        var stct = s.split(':');
        var sz   = stct.length;
        var pre  = '';
        var tid  = '';
        var s    = '';
        var papa = this.tow;
        
        for (i = 0; i < sz; i++) {
            s = stct[i];
            if (!document.getElementById(pre + s))
                papa.appendChild((i+1 < sz ? this.xw_newTree(s, pre, tid) : this.xw_newObject(s, pre, tid)));
            papa = document.getElementById(tid + s);
            pre += s + ":";
            tid += s + "_";
        }
        return papa;
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
                this.xw_queryWoeObject(process[2]).src = process[1];
            } else {
                alert("queryWoeObject(" + process[0] + " - " + process[1] + " - " + process[2] + ") isn't valid");
            }
            /*
              label = ob.getAttribute('label');
               ob.setAttribute('label', 
               '<a target="_blank" href="' + 
               process[1] + '">' + 
               label +
               '</a>'); */
            // alert("setting " + process[2] + " to point at " + process[1]);
        case "CLEAR" :
            // clear object
            break;
        default :
            alert("Unknown command: " + process[0]);
            break;
        }
    },

    fark: function(e)
    {
        alert(e.attrName + ": " + e.prevValue + " -> " + e.newValue + " in " + e.relatedNode);
    },

    xw_TreeAttrModified: function(e)
    {
        if (e.attrName != "open") return true; // we only care about the "open" attribute
        if (e.newValue != "true") return true; // we only care about when the state becomes open
        try {
            var src = e.relatedNode.ownerElement;
            var path = src.parentNode;
            if (path == this.tow) path = null; else path = path.getAttribute('path');
            var item = src.firstChild.firstChild.getAttribute('label');
            var resolved = (path ? path + ":" : "") + item;
            alert("Opening " + resolved);
        } catch (e) {}
    },
        
    init_xw: function() 
    {
        pm.enablePrivilege(privs);
        this.tow   = document.getElementById('tow');
        this.xtree = document.getElementById('xtree');
        this.tow.addEventListener("DOMAttrModified", this.xw_TreeAttrModified, false);
        this.cframe = document.getElementById('content');
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
        pm.enablePrivilege(privs);
        
        var index = this.xtree.currentIndex;
        if (index == -1) {
            // deselect
            return;
        }
        var el = this.xtree.contentView.getItemAtIndex(index);
        if (!el.src) {
            // selected folder, not object
            return;
        }

        
        // this.cframe.contentW
        window.open("http://" + this.getHost() + "/" + el.src, 'content'); //.setAttribute('src', el.src);
    }
};

function initializeWoeInterface()
{
    window.onload = null;
    // Figure out the server name.
    var url = document.location.href;
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
    WoeInstance.onMainLoad();
    document.getElementById('content').width = "70%";
    document.getElementById('content').style.width = "70%";
}

function ontreeselectwrapper(e)
{
    WoeHandler.onselect(e);
}

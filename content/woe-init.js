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

    xw_newTree: function(s, pre)
    {
        var item = document.createElement('treeitem');
        item.setAttribute('container', 'true');
        item.setAttribute('open',      'false');
            
        var row = document.createElement('treerow');
        item.appendChild(row);
            
        var cell = document.createElement('treecell');
        cell.setAttribute('label', s);
        row.appendChild(cell);
        
        var kids = document.createElement('treechildren');
        kids.setAttribute('id', pre + s);
        item.appendChild(kids);
        
        return item;
    },
        
    xw_newObject: function(s, path) 
    {
        var item = document.createElement('treeitem');
        item.setAttribute('id', path + s);
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
        var stct = s.split(':');
        var sz   = stct.length;
        var pre  = '';
        var s    = '';
        var papa = this.tow;
        
        for (i = 0; i < sz; i++) {
            s = stct[i];
            if (!document.getElementById(pre + s))
                papa.appendChild((i+1 < sz ? this.xw_newTree(s, pre) : this.xw_newObject(s, pre)));
            papa = document.getElementById(pre + s);
            pre += s + "_";
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
        
    init_xw: function() 
    {
        pm.enablePrivilege(privs);
        this.tow   = document.getElementById('tow');
        this.xtree = document.getElementById('xtree');
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
        
        window.open("http://" + this.getHost() + "/" + el.src, 'contentFrame'); //.setAttribute('src', el.src);
    }
};

function initializeWoeInterface()
{
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
}

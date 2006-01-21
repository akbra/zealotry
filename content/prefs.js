var preNode = null;
var sbPreNode = null;
var centerStyleTag = null;
var scrollbackStyleTag = null;

var pm = netscape.security.PrivilegeManager;
var privs = "UniversalBrowserRead UniversalBrowserWrite UniversalXPConnect";

function doMainLoad()
{
    var pref = Components.classes['@mozilla.org/preferences-service;1'].getService();
    pref = pref.QueryInterface(Components.interfaces.nsIPrefBranch);

    document.getElementById('echocheck').setAttribute("checked", pref.getCharPref("zealous.temp.echo"));
    document.getElementById('scrollbackcheck').setAttribute("checked", pref.getCharPref("zealous.temp.buffer"));
    generate_fontmenu();
    generate_themeLists();
}

function doMainUnload()
{
    var pref = Components.classes['@mozilla.org/preferences-service;1'].getService();
    pref = pref.QueryInterface(Components.interfaces.nsIPrefBranch);

    var cb = document.getElementById('echocheck').checked;
    var bb = document.getElementById('scrollbackcheck').checked;

    if (cb == true) {
        pref.setCharPref("zealous.temp.echo", "true");
    } else {
        pref.setCharPref("zealous.temp.echo", "false");
    }

    if (bb == true) {
        pref.setCharPref("zealous.temp.buffer", "true");
    } else {
        pref.setCharPref("zealous.temp.buffer", "false");
    }
}

function openMacros()
{
    document.getElementById('macrotext').setAttribute('collapsed', false);
}

function browseThemePreference(prefDesc, prefName)
{
    var url = prompt("What is the URL to the left side image you'd like to use?");

    if (false) {
        var nsIFilePicker = Components.interfaces.nsIFilePicker;
        var filePicker = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
        filePicker.init(window, "Pick image for " + prefDesc, nsIFilePicker.modeOpen);
        var res = filePicker.show();
        if (res == nsIFilePicker.returnCancel) {
            return;
        }
        var url = filePicker.file.path;
        if (url.indexOf("://") == -1) {
            // XXX: See if it's possible to provide an URL directly in browser dialog and how that affects things.
            // XXX: See what happens if a file contains "://". Unlikely but who knows.
            // No protocol specified. It is thus a file.
            url = "file:///" + url;
        }
    }

    var pref = Components.classes['@mozilla.org/preferences-service;1'].getService();
    pref = pref.QueryInterface(Components.interfaces.nsIPrefBranch);

    if (url) {
        pref.setCharPref("zealous.temp." + prefName, url);
    }

    try {
        var list = pref.getCharPref("zealous.temp." + prefName + ".list");
        pref.setCharPref("zealous.temp." + prefName + ".list", list + "@" + url);
    } catch (err) {
        pref.setCharPref("zealous.temp." + prefName + ".list", url);
    }
    generate_themeLists(prefName, url);
}

function doNewLS()
{
    browseThemePreference("left side pane", "left_side");
}

function doNewBG()
{
    browseThemePreference("background", "bg_image");
}

function doNewRS()
{
    browseThemePreference("right side pane", "right_side");
}

function doNewLL()
{
    browseThemePreference("left logo", "left_logo");
}

function doNewRL()
{
    browseThemePreference("right logo", "right_logo");
}

function doNewGB()
{
    browseThemePreference("the Getting Started button", "get_button");
}

function doNewMB()
{
    browseThemePreference("the Mastering Chat button", "master_button");
}

function newTheme(url, type)
{
    // XXX Can't we just do this?
    var pref = Components.classes['@mozilla.org/preferences-service;1'].getService();
    pref = pref.QueryInterface(Components.interfaces.nsIPrefBranch);

    pref.setCharPref("zealous.temp." + type, url);
    return;
    
    switch(type) {
	case "bg_image":
	    setBgImage(url);
	    break;
    case "left_side":
        setLeftSide(url);
        break;
    case "right_side":
        setRightSide(url);
        break;
    case "left_logo":
        setLeftLogo(url);
        break;
    case "right_logo":
        setRightLogo(url);
        break;
    case "get_button":
        setGetButton(url);
        break;
    case "master_button":
        setMasterButton(url);
        break;
    }
}

function setBgImage(url)
{
    var pref = Components.classes['@mozilla.org/preferences-service;1'].getService();
    pref = pref.QueryInterface(Components.interfaces.nsIPrefBranch);

    pref.setCharPref("zealous.temp.bg_image", url);
}

function setLeftSide(url)
{
    var pref = Components.classes['@mozilla.org/preferences-service;1'].getService();
    pref = pref.QueryInterface(Components.interfaces.nsIPrefBranch);

    pref.setCharPref("zealous.temp.left_side", url);
}

function setRightSide(url)
{
    var pref = Components.classes['@mozilla.org/preferences-service;1'].getService();
    pref = pref.QueryInterface(Components.interfaces.nsIPrefBranch);

    pref.setCharPref("zealous.temp.right_side", url);
}

function setLeftLogo(url)
{
    var pref = Components.classes['@mozilla.org/preferences-service;1'].getService();
    pref = pref.QueryInterface(Components.interfaces.nsIPrefBranch);

    pref.setCharPref("zealous.temp.left_logo", url);
}

function setRightLogo(url)
{
    var pref = Components.classes['@mozilla.org/preferences-service;1'].getService();
    pref = pref.QueryInterface(Components.interfaces.nsIPrefBranch);

    pref.setCharPref("zealous.temp.right_logo", url);
}

function setGetButton(url)
{
    var pref = Components.classes['@mozilla.org/preferences-service;1'].getService();
    pref = pref.QueryInterface(Components.interfaces.nsIPrefBranch);

    pref.setCharPref("zealous.temp.get_button", url);
}

function setMasterButton(url)
{
    var pref = Components.classes['@mozilla.org/preferences-service;1'].getService();
    pref = pref.QueryInterface(Components.interfaces.nsIPrefBranch);

    pref.setCharPref("zealous.temp.get_button", url);
}

function generate_fontmenu()
{
    var langgroup = new Array("x-western");
    var fonttype  = new Array("serif", "sans-serif", "cursive", "fantasy", "monospace");
    var fontList  = Components.classes["@mozilla.org/gfx/fontlist;1"].createInstance(Components.interfaces.nsIFontList);
    var results   = new Array();
    var lsz       = langgroup.length;
    var fsz       = fonttype.length;
    var fontNameStr;
    var fontName;
    var found     = new Array();
    var i, j;
    
    for (i = 0; i < lsz; i++) {
        for (j = 0; j < fsz; j++) {
            var fontEnumerator = fontList.availableFonts(langgroup[i], fonttype[j]);
            while (fontEnumerator.hasMoreElements()) {
                fontName = fontEnumerator.getNext();
                fontName = fontName.QueryInterface(Components.interfaces.nsISupportsString);
                fontNameStr = fontName.toString();
                if (!found[fontNameStr]) {
                    results[results.length] = fontNameStr;
                    found[fontNameStr] = 1;
                }
            }
        }
    }
    
    results.sort();

    var d           = document;
    var popup       = d.getElementById('font-list');
    var prepop	    = d.getElementById('sb_font');
    var menuitems   = results;
    var l           = menuitems.length;
    var elements    = new Array();
    var newElement;
    var letter;
    
    for (var z = 0; z < l; z++) {
        var item = d.createElement('menuitem');
	var pitem = d.createElement('menuitem');
        item.setAttribute('id', 'fm_' + menuitems[z]);
	pitem.setAttribute('id', 'pfm_' + menuitems[z]);
        item.setAttribute('label', menuitems[z]);
	pitem.setAttribute('label', menuitems[z]);
        item.setAttribute('oncommand', 'setFont("' + menuitems[z] + '");');
	pitem.setAttribute('oncommand', 'setSBFont("' + menuitems[z] + '");');
        item.style.fontFamily = menuitems[z];
	pitem.style.fontFamily = menuitems[z];
        popup.appendChild(item);
	prepop.appendChild(pitem);
    }
    
    /* Font sizes. */
    popup = d.getElementById('sizes-menu');
    var pre_popup = d.getElementById('pre-sizes-menu');
    var sbpopup = d.getElementById('sb_size');
    var sbpre_popup = d.getElementById('sb_presize');
    var size_el, size_pre_el, size_sb_el, size_sb_pre_el;
    
    var pref = Components.classes['@mozilla.org/preferences-service;1'].getService();
    pref = pref.QueryInterface(Components.interfaces.nsIPrefBranch);

    try {
        var sz = pref.getCharPref("zealous.temp.fontSize");
        sz = sz.substr(0, sz.length-2);
    } catch (err) {
        var sz = null;
    }

    try {
        var sf = pref.getCharPref("zealous.temp.fixedFontSize");
        sf = sf.substr(0, sf.length-2);
    } catch (err) {
        var sf = null;
    }

    try {
        var ft = pref.getCharPref("zealous.temp.fontStyle");
    } catch (err) {
        var ft = null;
    }

    try {
        var sbs = pref.getCharPref("zealous.temp.sbSize");
        sbs = sbs.substr(0, sbs.length-2);
    } catch (err) {
        var sbs = null;
    }

    try {
        var sbp = pref.getCharPref("zealous.temp.sbPreSize");
        sbp = sbp.substr(0, sbp.length-2);
    } catch (err) {
        var sbp = null;
    }

    try {
        var sbf = pref.getCharPref("zealous.temp.sbFontStyle");
    } catch (err) {
        var sbf = null;
    }

    for (var z = 6; z < 30; z++) {
        size_el = d.createElement('menuitem');
        size_pre_el = d.createElement('menuitem');
	size_sb_el = d.createElement('menuitem');
	size_sb_pre_el = d.createElement('menuitem');

        size_el.setAttribute('id', 's_'+z);
        size_pre_el.setAttribute('id', 'sp_'+z);
	size_sb_el.setAttribute('id', 'sb_'+z);
	size_sb_pre_el.setAttribute('id', 'sbp_'+z);

        size_el.setAttribute('label', z);
        size_pre_el.setAttribute('label', z);
	size_sb_el.setAttribute('label', z);
	size_sb_pre_el.setAttribute('label', z);

        size_el.setAttribute('oncommand', 'setSize(' + z + ' + "pt");');
        size_pre_el.setAttribute('oncommand', 'setFixedSize(' + z + ' + "pt");');
	size_sb_el.setAttribute('oncommand', 'setSBSize(' + z + ' + "pt");');
	size_sb_pre_el.setAttribute('oncommand', 'setSBPreSize(' + z + ' + "pt");');

        popup.appendChild(size_el);
        pre_popup.appendChild(size_pre_el);
	sbpopup.appendChild(size_sb_el);
	sbpre_popup.appendChild(size_sb_pre_el);
    }

    switchSelection('size', sz);
    switchSelection('psize', sf);
    switchSelection('font', ft);

    switchSelection('sbsize', sbs);
    switchSelection('sbpsize', sbp);
    switchSelection('sbfont', sbf);



}

/*
 * Font/size switch function.
 */
var cfont, csize, cpsize;
var psize    = "s_";
var pfont    = "fm_";
var ppsize   = "sp_";
var psbsize  = "sb_";
var psbpsize = "sbp_";
var psbfont  = "pfm_";

function switchSelection(what, val)
{
    var font_element;
    var old = window["c"+what];
    
    font_element = document.getElementById(old);
    
    if (font_element) {
        font_element.style.color      = '';
        font_element.style.fontWeight = '';
    }
    
    var element_id = val;
    
    if (typeof(window["p"+what]) != "undefined")
        element_id = window["p"+what] + element_id;
    
    window["c"+what] = element_id;
    
    font_element = document.getElementById(element_id);
    if (font_element) {
        font_element.style.color      = 'red';
        font_element.style.fontWeight = 'bold';
        font_element.style.fontSize   = '14pt';
    }
}

function setFont(family)
{
    var pref = Components.classes['@mozilla.org/preferences-service;1'].getService();
    pref = pref.QueryInterface(Components.interfaces.nsIPrefBranch);
    pref.setCharPref("zealous.temp.fontStyle", family);
}

function setSBFont(family)
{
    var pref = Components.classes['@mozilla.org/preferences-service;1'].getService();
    pref = pref.QueryInterface(Components.interfaces.nsIPrefBranch);
    pref.setCharPref("zealous.temp.sbFontStyle", family);
}


function setSize(pts)
{
    var pref = Components.classes['@mozilla.org/preferences-service;1'].getService();
    pref = pref.QueryInterface(Components.interfaces.nsIPrefBranch);
    pref.setCharPref("zealous.temp.fontSize", pts);
}

function setFixedSize(pts) 
{
    var pref = Components.classes['@mozilla.org/preferences-service;1'].getService();
    pref = pref.QueryInterface(Components.interfaces.nsIPrefBranch);
    pref.setCharPref("zealous.temp.fixedFontSize", pts);
}
    
function setSBSize(pts)
{
    var pref = Components.classes['@mozilla.org/preferences-service;1'].getService();
    pref = pref.QueryInterface(Components.interfaces.nsIPrefBranch);
    pref.setCharPref("zealous.temp.sbSize", pts);
}

function setSBPreSize(pts)
{
    var pref = Components.classes['@mozilla.org/preferences-service;1'].getService();
    pref = pref.QueryInterface(Components.interfaces.nsIPrefBranch);
    pref.setCharPref("zealous.temp.sbPreSize", pts);
}

function generate_bgList()
{
    try {
        var pref = Components.classes['@mozilla.org/preferences-service;1'].getService();
        pref = pref.QueryInterface(Components.interfaces.nsIPrefBranch);
        var bgList = pref.getCharPref(zealousPreference("backgroundList"));
    } catch (err) {
        return;
    }

    var bg;
    var popup = document.getElementById('background-popup');
    bgList = bgList.split("@");
    var l = bgList.length;

    for (var z = 0; z < l; z++) {
        bg = document.createElement( 'menuitem' );
        bg.setAttribute('id', 'bg_'+z );
        bg.setAttribute('label', bgList[z] );
        bg.setAttribute('oncommand', 'changeBg("' + bgList[z] + '");' );
        popup.appendChild( bg );
    }
}

function clearScrollback()
{
    if(confirm("Are you sure you want to clear you scrollback buffer?")) {
        scrollback.contentDocument.body.innerHTML = "";
        return;
    }
    return;
}

function generate_themeLists(type, url)
{
    var pref = Components.classes['@mozilla.org/preferences-service;1'].getService();
    pref = pref.QueryInterface(Components.interfaces.nsIPrefBranch);

    if (type) {
        var themeArr = new Array(type);
    } else { 
        var themeArr = new Array("bg_image", "left_side", "right_side", "left_logo", "right_logo", "get_button", "master_button");
    }

    for (var i = 0; i < themeArr.length; i++) {
        try {
            var list = pref.getCharPref("zealous.temp." + themeArr[i] + ".list");
        } catch (err) {
            continue; // Nothing to list
        }

        var popup = document.getElementById(themeArr[i]);
        if (url) {
            var list = url.split("@");
        } else {
    	    var list = list.split("@");
        }
    	var l = list.length;
    	var el;

    	for (var z = 0; z < l; z++) {
            el = document.createElement( 'menuitem' );
            el.setAttribute('id', 'th_'+z );
            el.setAttribute('label', list[z] );
            el.setAttribute('oncommand', 'newTheme("' + list[z] + '", "' + themeArr[i] + '");' );
            popup.appendChild( el );
        }
    }
}

function doDelete()
{
    alert("Deleting is not available yet!");
    return;
}
0

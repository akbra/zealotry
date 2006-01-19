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

function doNewLS()
{
    var pref = Components.classes['@mozilla.org/preferences-service;1'].getService();
    pref = pref.QueryInterface(Components.interfaces.nsIPrefBranch);

    var url = prompt("What is the URL to the left side image you'd like to use?");

    if (url) {
        pref.setCharPref("zealous.temp.left_side", url);
    }

    try {
	var list = pref.getCharPref("zealous.temp.left_side.list");
    } catch (err) {
 	pref.setCharPref("zealous.temp.left_side.list", url);
        generate_themeLists("left_side", url);
        return;
    }
    pref.setCharPref("zealous.temp.left_side.list", pref.getCharPref("zealous.temp.left_side.list") + "@" + url);

    generate_themeLists("left_side", url);
}

function doNewBG()
{
    var pref = Components.classes['@mozilla.org/preferences-service;1'].getService();
    pref = pref.QueryInterface(Components.interfaces.nsIPrefBranch);

    var url = prompt("What is the URL to the background image you'd like to use?");

    if (url) {
        pref.setCharPref("zealous.temp.bg_image", url);
    }

    try {
        var list = pref.getCharPref("zealous.temp.bg_image.list");
    } catch (err) {
        pref.setCharPref("zealous.temp.bg_image.list", url);
        generate_themeLists("bg_image", url);
        return;
    }
    pref.setCharPref("zealous.temp.bg_image.list", pref.getCharPref("zealous.temp.bg_image.list") + "@" + url);
    generate_themeLists("bg_image", url);
}

function doNewRS()
{
    var pref = Components.classes['@mozilla.org/preferences-service;1'].getService();
    pref = pref.QueryInterface(Components.interfaces.nsIPrefBranch);

    var url = prompt("What is the URL to the right side image you'd like to use?");

    if (url) {
        pref.setCharPref("zealous.temp.right_side", url);
    }

    try {
        var list = pref.getCharPref("zealous.temp.right_side.list");
    } catch (err) {
        pref.setCharPref("zealous.temp.right_side.list", url);
        generate_themeLists("right_side", url);
        return;
    }
    pref.setCharPref("zealous.temp.right_side.list", pref.getCharPref("zealous.temp.right_side.list") + "@" + url);
    generate_themeLists("right_side", url);
}

function doNewLL()
{
    var pref = Components.classes['@mozilla.org/preferences-service;1'].getService();
    pref = pref.QueryInterface(Components.interfaces.nsIPrefBranch);

    var url = prompt("What is the URL to the left side logo you'd like to use?");

    if (url) {
        pref.setCharPref("zealous.temp.left_logo", url);
    }

    try {
        var list = pref.getCharPref("zealous.temp.left_logo.list");
    } catch (err) {
        pref.setCharPref("zealous.temp.left_logo.list", url);
        generate_themeLists("left_logo", url);
        return;
    }
    pref.setCharPref("zealous.temp.left_logo.list", pref.getCharPref("zealous.temp.left_logo.list") + "@" + url);
    generate_themeLists("left_logo", url);
}

function doNewRL()
{
    var pref = Components.classes['@mozilla.org/preferences-service;1'].getService();
    pref = pref.QueryInterface(Components.interfaces.nsIPrefBranch);

    var url = prompt("What is the URL to the right side logo you'd like to use?");

    if (url) {
        pref.setCharPref("zealous.temp.right_logo", url);
    }

    try {
        var list = pref.getCharPref("zealous.temp.right_logo.list");
    } catch (err) {
        pref.setCharPref("zealous.temp.right_logo.list", url);
        generate_themeLists("right_logo", url);
        return;
    }
    pref.setCharPref("zealous.temp.right_logo.list", pref.getCharPref("zealous.temp.right_logo.list") + "@" + url);
    generate_themeLists("right_logo", url);
}

function doNewGB()
{
    var pref = Components.classes['@mozilla.org/preferences-service;1'].getService();
    pref = pref.QueryInterface(Components.interfaces.nsIPrefBranch);

    var url = prompt("What is the URL to the Getting Started Button image you'd like to use?");

    if (url) {
        pref.setCharPref("zealous.temp.get_button", url);
    }

    try {
        var list = pref.getCharPref("zealous.temp.get_button.list");
    } catch (err) {
        pref.setCharPref("zealous.temp.get_button.list", url);
        generate_themeLists("get_button", url);
        return;
    }
    pref.setCharPref("zealous.temp.get_button.list", pref.getCharPref("zealous.temp.get_button.list") + "@" + url);
    generate_themeLists("get_button", url);
}

function doNewMB()
{
    var pref = Components.classes['@mozilla.org/preferences-service;1'].getService();
    pref = pref.QueryInterface(Components.interfaces.nsIPrefBranch);

    var url = prompt("What is the URL to the Mastering Chat Button image you'd like to use?");

    if (url) {
        pref.setCharPref("zealous.temp.master_button", url);
    }

    try {
        var list = pref.getCharPref("zealous.temp.master_button.list");
    } catch (err) {
        pref.setCharPref("zealous.temp.master_button.list", url);
        generate_themeLists("master_button", url);
        return;
    }
    pref.setCharPref("zealous.temp.master_button.list", pref.getCharPref("zealous.temp.master_button.list") + "@" + url);
    generate_themeLists("master_button", url);
}

function newTheme(url, type)
{

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

function submitSkotosSelectCommand(elementName)
{
    var rdoc      = document.getElementById('right-frame').contentDocument;
    var elementDo = rdoc.getElementById(elementName);
    var chatCode  = rdoc.chatMode ? "/" : "";
    handleInputLine(chatCode + elementDo.options[elementDo.selectedIndex].value);
    elementDo.selectedIndex = 0;

    /* Refocus the input window after clicking in the output window. */
    var obj = document.getElementById("input");
    obj.focus();
}

function submitSkotosClickCommand(elementName)
{
    var rdoc      = document.getElementById('right-frame').contentDocument;
    var elementDo = rdoc.getElementById(elementName);
    var chatCode  = rdoc.chatMode ? "/" : "";
    handleInputLine(chatCode + elementDo.title);

    /* Refocus the input window after clicking in the output window. */
    var obj = document.getElementById("input");
    obj.focus();
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
    var menuitems   = results;
    var l           = menuitems.length;
    var elements    = new Array();
    var newElement;
    var letter;
    
    for (var z = 0; z < l; z++) {
        var item = d.createElement('menuitem');
        item.setAttribute('id', 'fm_' + menuitems[z]);
        item.setAttribute('label', menuitems[z]);
        item.setAttribute('oncommand', 'setFont("' + menuitems[z] + '");');
        item.style.fontFamily = menuitems[z];
        // elements[letter].appendChild(item);
	popup.appendChild(item);
    }
    
    /* Font sizes. */
    popup = d.getElementById('sizes-menu');
    var pre_popup = d.getElementById('pre-sizes-menu');
    var size_el, size_pre_el;
    
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

    for (var z = 6; z < 30; z++) {
        size_el = d.createElement('menuitem');
        size_pre_el = d.createElement('menuitem');

        size_el.setAttribute('id', 's_'+z);
        size_pre_el.setAttribute('id', 'sp_'+z);

        size_el.setAttribute('label', z);
        size_pre_el.setAttribute('label', z);

        size_el.setAttribute('oncommand', 'setSize(' + z + ' + "pt");');
        size_pre_el.setAttribute('oncommand', 'setFixedSize(' + z + ' + "pt");');

	/* I have no idea why the selected code is failing :( -- Jess */
	if (z == Number(sz)) {
	    size_el.selected = true;
	}
        if (z == Number(sf)) {
	    size_pre_el.selected = true;
	}
        popup.appendChild(size_el);
        pre_popup.appendChild(size_pre_el);
    }

    switchSelection('size', sz);
    switchSelection('psize', sf);
    switchSelection('font', ft);

}

function submitSkotosLink(link)
{
    var rdoc = document.getElementById('right-frame').contentDocument;
    var chatCode = rdoc.chatMode ? "/" : "";
    handleInputLine(chatCode+link);
    
    /* Refocus the input window after clicking in the output window. */
    var obj = document.getElementById("input");
    obj.focus();
}

function bubbleSettings()
{
    var sb = document.getElementById('scrollback').contentDocument;
    sb.open();
    sb.write
        ('<html><head><style></style></head><body></body>');
    sb.close();
    centerStyleTag = document.getElementById('center-frame').contentDocument.getElementsByTagName("style")[0];
    scrollbackStyleTag = sb.getElementsByTagName("style")[0];
    
    var rframe = document.getElementById('right-frame').contentDocument;
    var cframe = document.getElementById('center-frame').contentDocument;

    rframe.rs = submitSkotosSelectCommand;
    rframe.rc = submitSkotosClickCommand;

    cframe.skotosLink = submitSkotosLink;
    generate_fontmenu();
    generate_bgList();
}

/*
 * Font/size switch function.
 */
var cletter, cfont, csize, cpsize;
var pletter = "m_";
var psize   = "s_";
var pfont   = "fm_";
var ppsize  = "sp_";

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
    
var inputRows = 2;
var foop;
    
function onInput()
{
    var inEl = document.getElementById('input');
    if        (inEl.inputField.rows < inputRows) {
        alert ("<rows");
    } else if (inEl.inputField.rows > inputRows) {
        alert (">rows");
    }
    inputRows = inEl.inputField.rows;
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

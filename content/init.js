var pm = netscape.security.PrivilegeManager;
var privs = "UniversalBrowserRead UniversalBrowserWrite UniversalXPConnect";

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
    
    var d           = document;
    var popup       = d.getElementById('font-list');
    var menuitems   = results;
    var l           = menuitems.length;
    var elements    = new Array();
    var newElement;
    var letter;
    
    for (var z = 0; z < l; z++) {
        letter = menuitems[z].substring(0, 1).toUpperCase();
        if (!elements[letter]) {
            elements[letter] = d.createElement('menupopup');
            elements[letter].setAttribute('id', 'p_' + letter);
        }
        var item = d.createElement('menuitem');
        item.setAttribute('id', 'fm_' + menuitems[z]);
        item.setAttribute('label', menuitems[z]);
        item.setAttribute('oncommand', 'setFont("' + menuitems[z] + '");');
        item.style.fontFamily = menuitems[z];
        elements[letter].appendChild(item);
    }
    // Loop over 'A' to 'Z":
    for (var z = 65; z <= 90; z++) {
        var chr = String.fromCharCode(z);
        if (elements[chr]) {
            var menu = d.createElement('menu');
            menu.setAttribute('id', 'm_'+chr);
            menu.setAttribute('label', chr);
            popup.appendChild(menu);
            menu.appendChild(elements[chr]);
        }
    }
    
    /* Font sizes. */
    popup = d.getElementById('sizes-menu');
    var pre_popup = d.getElementById('pre-sizes-menu');
    var size_el, size_pre_el;
    
    for (var z = 6; z < 30; z++) {
        size_el = d.createElement('menuitem');
        size_el.setAttribute('id', 's_'+z);
        size_el.setAttribute('label', z);
        size_pre_el = size_el.cloneNode(true);
        size_el.setAttribute('oncommand', 'setSize(' + z + ' + "pt")');
        size_pre_el.setAttribute('oncommand', 'setFixedSize(' + z + ' + "pt")');
        popup.appendChild(size_el);
        pre_popup.appendChild(size_pre_el);
    }
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
var cletter, cfont, csize;
var pletter = "m_";
var psize   = "s_";
var pfont   = "fm_";

function switchSelection( what, val )
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
    }
}

function setFont(family)
{
    document.getElementById('center-frame').contentDocument.body.style.fontFamily = family.replace(/'/g, "\\'");
	document.getElementById('scrollback').contentDocument.body.style.fontFamily = family.replace(/'/g, "\\'");
 	document.getElementById('input').style.fontFamily = family.replace(/'/g, "\\'");

    var pref = Components.classes['@mozilla.org/preferences-service;1'].getService();
    pref = pref.QueryInterface(Components.interfaces.nsIPrefBranch);
    pref.setCharPref
        (zealousPreference("fontStyle"),
         document.getElementById('center-frame').contentDocument.body.style.fontFamily);

    switchSelection('font', family);
    switchSelection('letter', family.substring(0,1).toUpperCase());
}

function setSize(pts)
{
	// This shit don't work for me apparently. I can change font size all day long
	// and nothing changes. -- Strike that, this apparently only affects fixed font size.
    document.getElementById('center-frame').contentDocument.body.style.fontSize = pts;
    document.getElementById('input').style.fontSize = pts;
	// TODO: Convert pts to an int, and decrement by 2 and put in scrollback fontsize.
	// document.getElementById('scrollback').contentDocument.body.style.fontSize = "10pt";

    var pref = Components.classes['@mozilla.org/preferences-service;1'].getService();
    pref = pref.QueryInterface(Components.interfaces.nsIPrefBranch);
    pref.setCharPref(zealousPreference("fontSize"), document.getElementById('center-frame').contentDocument.body.style.fontSize);

    switchSelection( 'size', pts.substring(0, pts.length-2) );
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


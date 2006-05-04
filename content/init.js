var preNode = null;
var sbPreNode = null;
var centerStyleTag = null;
var scrollbackStyleTag = null;

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

function submitSkotosLink(link)
{
    var rdoc = document.getElementById('right-frame').contentDocument;
    var chatCode = rdoc.chatMode && link[0] != '!' && link[0] != '+' ? "/" : "";
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
    generate_bgList();
}

function setFont(font)
{
    var pref = Components.classes['@mozilla.org/preferences-service;1'].getService();
    pref = pref.QueryInterface(Components.interfaces.nsIPrefBranch);

    try {
        var font = (font ? font : pref.getCharPref("zealous.temp.fontStyle"));
    } catch (err) {
        font = null;
    }

    if (font) {
    	pref.setCharPref(zealousPreference("fontStyle"), font);
        document.getElementById('center-frame').contentDocument.body.style.fontFamily = font.replace(/'/g, "\\'");
    	document.getElementById('input').style.fontFamily = font.replace(/'/g, "\\'");
    }
}

function setSBFont(font) 
{
    var pref = Components.classes['@mozilla.org/preferences-service;1'].getService();
    pref = pref.QueryInterface(Components.interfaces.nsIPrefBranch);

    try {
	var font = (font ? font : pref.getCharPref("zealous.temp.sbFontStyle"));
    } catch (err) {
	font = null;
    }

    if (font) {
    	document.getElementById('scrollback').contentDocument.body.style.fontFamily = font.replace(/'/g, "\\'");
	pref.setCharPref(zealousPreference("sbFontStyle"), font);
    }
}

function setSize(pts)
{
    var pref = Components.classes['@mozilla.org/preferences-service;1'].getService();
    pref = pref.QueryInterface(Components.interfaces.nsIPrefBranch);

    try {
        var size = (pts ? pts : pref.getCharPref("zealous.temp.fontSize"));
    } catch (err) {
        size = null;
    }

    if (size) { 
	pref.setCharPref(zealousPreference("fontSize"), size);
    	document.getElementById('center-frame').contentDocument.body.style.fontSize = size;
    	document.getElementById('input').style.fontSize = size;
    }
}

function setSBSize(pts)
{
    var pref = Components.classes['@mozilla.org/preferences-service;1'].getService();
    pref = pref.QueryInterface(Components.interfaces.nsIPrefBranch);

    try {
	size = (pts ? pts : pref.getCharPref("zealous.temp.sbSize"));
    } catch (err) {
	size = null;
    }

    if (size) {
    	pref.setCharPref(zealousPreference("sbSize"), size);
    	document.getElementById('scrollback').contentDocument.body.style.fontSize = size;
    }
}


function setFixedSize(pts) 
{
    var pref = Components.classes['@mozilla.org/preferences-service;1'].getService();
    pref = pref.QueryInterface(Components.interfaces.nsIPrefBranch);

    try {
    	var size = (pts ? pts : pref.getCharPref("zealous.temp.fixedFontSize"));
    } catch (err) {
	size = null;
    }

    if (size) {
    	pref.setCharPref(zealousPreference("fixedFontSize"), size);

    	var styles = centerStyleTag;
    	if (preNode) {
            preNode.parentNode.removeChild(preNode);
    	}
        preNode = document.createTextNode("pre { font-size: " + size + "; }");
        styles.appendChild(preNode);
    }
}

function setSBPreSize(pts)
{
    var pref = Components.classes['@mozilla.org/preferences-service;1'].getService();
    pref = pref.QueryInterface(Components.interfaces.nsIPrefBranch);

    try {
	var size = (pts ? pts : pref.getCharPref("zealous.temp.sbPreSize"));
    } catch (err) {
	size = null;
    }

    if (size) {
	pref.setCharPref(zealousPreference("sbPreSize"), size);
 
  	var styles = scrollbackStyleTag;
    	if (sbPreNode) {
            sbPreNode.parentNode.removeChild(sbPreNode);
    	}
    	sbPreNode = document.createTextNode("pre { font-size: " + size + "; }");
    	styles.appendChild(sbPreNode);
    }	    
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

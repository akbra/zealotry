var preNode = null;
var sbPreNode = null;
var centerStyleTag = null;
// var scrollbackStyleTag = null;
var submit = null;

// XXX: Is this crap even used these days?
var pm = netscape.security.PrivilegeManager;
var privs = "UniversalBrowserRead UniversalBrowserWrite UniversalXPConnect";

/*
 * Request the directory in which macros should be/are stored.
 * Returns the macros file for the current char, or null if aborted.
 */
function requestMacrosDirectory(returnMacrosFile) {
    var pref = Components.classes['@mozilla.org/preferences-service;1'].getService();
    pref = pref.QueryInterface(Components.interfaces.nsIPrefBranch);
    var nsIFilePicker = Components.interfaces.nsIFilePicker;
    var filePicker = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
    filePicker.init(window, "Where should the macro files live?", nsIFilePicker.modeGetFolder);
    var res = filePicker.show();
    if (res == nsIFilePicker.returnCancel) {
        dump("result is canceled. exiting\n");
        return null;
    }
    var macroFolder = filePicker.file.path;
    // Figure out if we need \\ or /.
    var separator = (macroFolder && macroFolder[1] == ':' ? "\\" : "/");
    dump("separator (os dependent) detected to be: " + separator + "\n");
    var macroFile = macroFolder + separator + pref.getCharPref("zealous.temp.filename");
    pref.setCharPref("zealous.temp.macro", macroFile);
    return returnMacrosFile ? macroFile : macroFolder;
}

function loadMacrosFromDisk(macro) {
    var macros = null;

    if (macro && macro != false && macro != "false") {
        var mptr = null;
        
        document.getElementById('macrostore').setAttribute("value", macro);
        mptr = new File(macro);
        if (mptr.exists()) {
            // alert("macro file " + macro + " exists");
            mptr.open("r");
            macros = mptr.read();
            // alert("read: " + macros);
        } else {
            // alert("macro file does not exist; testing");
            /*
             * macros are gone, even though we have a macro location set ... this may mean that no macros
             * exist (for this character) or it may mean that the macros were moved! we decide by trying
             * to create the macros file for this char... wasteful I know.
             */
            try {
                macro.open("w");
                macro.close();
                // alert("test OK -- moving on");
            } catch (err) {
                // alert("test FAILED -- asking for new macros dir");
                /*
                 * Okay, here's the situation: we had a macros directory, but no macros file was found.
                 * We checked if this was a matter of the macro simply not existing for this character
                 * by trying to create an empty macro file for the character in question, BUT...
                 * ... that threw an exception. An exception is thrown in cases where e.g. the directory
                 * doesn't exist or similar. Thus, we now ask the user to give us the location for macros
                 * again.
                 */
                macro = requestMacrosDirectory(true);
                /*
                 * We call ourselves repeatedly, until user aborts. Hopefully we only end up doing it once,
                 * and that's to fetch the macros from the new location.
                 */
                // alert("got \"" + macro + "\": reloading if non-nil");
                if (macro) return loadMacrosFromDisk(macro);
            }
        }
    } else {
        document.getElementById('macrostore').setAttribute("value", "No macro file set...");
    }

    // alert("if \"" + macros + "\", set the macrotext value");
    if (macros) {
        document.getElementById('macrotext').value = macros;
    }
}

function doMainLoad()
{
    var macro = null;
    
    var pref = Components.classes['@mozilla.org/preferences-service;1'].getService();
    pref = pref.QueryInterface(Components.interfaces.nsIPrefBranch);

    document.getElementById('echocheck').setAttribute("checked", pref.getCharPref("zealous.temp.echo"));
    // document.getElementById('scrollbackcheck').setAttribute("checked", pref.getCharPref("zealous.temp.buffer"));
    document.getElementById('blinkcheck').setAttribute("checked", pref.getCharPref("zealous.temp.blink"));
    document.getElementById('pagecheck').setAttribute("checked", pref.getCharPref("zealous.temp.pageBeep"));
    document.getElementById('ooccheck').setAttribute("checked", pref.getCharPref("zealous.temp.ignoreOOC"));
    generate_fontmenu();
    generate_themeLists();

    try {
        macro = pref.getCharPref("zealous.temp.macro");
        if (macro == false) macro = null;
    } catch (err) {
        macro = null;
    }

    if (macro != null) {
        loadMacrosFromDisk(macro);
    }
}

function doMainUnload()
{
    dump("doMainUnload()\n");
    var pref = Components.classes['@mozilla.org/preferences-service;1'].getService();
    pref = pref.QueryInterface(Components.interfaces.nsIPrefBranch);

    dump("got interface\n");
    var cb = document.getElementById('echocheck').checked;
    // var bb = document.getElementById('scrollbackcheck').checked;
    var ab = document.getElementById('blinkcheck').checked;
    var pb = document.getElementById('pagecheck').checked;
    var ob = document.getElementById('ooccheck').checked;
    dump("got element values\n");
    
    if (cb == true) {
        pref.setCharPref("zealous.temp.echo", "true");
    } else {
        pref.setCharPref("zealous.temp.echo", "false");
    }

    /* if (bb == true) {
        pref.setCharPref("zealous.temp.buffer", "true");
    } else {
        pref.setCharPref("zealous.temp.buffer", "false");
        } */

    if (ab == true) {
        pref.setCharPref("zealous.temp.blink", "true");
    } else {
        pref.setCharPref("zealous.temp.blink", "false");
    }

    if (pb == true) {
        pref.setCharPref("zealous.temp.pageBeep", "true");
    } else {
        pref.setCharPref("zealous.temp.pageBeep", "false");
    }

    if (ob == true) {
        pref.setCharPref("zealous.temp.ignoreOOC", "true");
    } else {
        pref.setCharPref("zealous.temp.ignoreOOC", "false");
    }

    dump("set initial prefs\n");

    try {
        var macro = pref.getCharPref("zealous.temp.macro");
    } catch (err) {
        macro = false;
    }

    dump("macro = " + macro + "\n");
    if (macro && macro != false && macro != "false") {
        dump("it is, it isn't false, it isn't \"false\"\n");
        // Changed "var macro = new File(macro);" to "var mptr = ...".
        // XXX: Kalle removed the if case. If macros break apart, re-add it.
        // XXX: Macros did break apart, but in File open, and for a specific reason that should be addressed.
        // if (mptr.exists()) {
        var mptr = null;
        mptr = new File(macro);
        try {
            mptr.open("w");
            mptr.write(document.getElementById('macrotext').value);
            mptr.close();
        } catch (err) {
            /*
             * It seems the macro file writing failed. This can mean a variety of things,
             * but most probable cause is that user moved the macros.
             */
            macro = null;
        }
        //} // if (mptr.exists())
    } else macro = null;
    /*
     * We add !macro to if case below because we may end up failing to open the macro
     * file in the above if case; if that is the case, user probably moved the macros
     * file or deleted it (CM TAS #30667).
     */
    if (!macro && document.getElementById('macrotext').value.length > 0) {
        dump("it isn't, or it's false, or it's \"false\"\n");
        // Player set some macros but doesn't have a place to store them. Lets fix that.
        var macroFolder = requestMacrosDirectory();
        if (!macroFolder) return; // was aborted

        dump("configFile creation: " + macroFolder + "\n");
        configFile = new File(macroFolder);
        configFile.appendRelativePath(pref.getCharPref("zealous.temp.filename"));

       // alert("creatin config file");
        configFile.create();
        configFile.open("w");
        configFile.write(document.getElementById('macrotext').value);
        configFile.close();
        // alert("done with that");
        dump("done creating\n");
    }
    window.submit = true;

    window.close();
}

function doCancel()
{
    dump("doCancel\n");
    if (submit) {
        dump("submit\n");
        doMainUnload();
        return;
    }

    var pref = Components.classes['@mozilla.org/preferences-service;1'].getService();
    pref = pref.QueryInterface(Components.interfaces.nsIPrefBranch);
    pref.setCharPref("zealous.temp.state", "cancel");
    window.close();
}    

function openMacros()
{
    el = document.getElementById('macrotext');

    if (el.collapsed == true) {
        window.resizeBy(0, 400);
        el.setAttribute('collapsed', 'false');
        document.getElementById('openmacro').setAttribute("label", "Hide Macros");
        return;
    }

    window.resizeBy(0, -400);
    el.setAttribute('collapsed', 'true');
    document.getElementById('openmacro').setAttribute("label", "Show Macros");
}

function browseThemePreference(prefDesc, prefName)
{
    var url = prompt("What is the URL to the " + prefDesc + " image you'd like to use?");

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
        // XXX Can't we just do this? Yes we can; removing crud below.
        var pref = Components.classes['@mozilla.org/preferences-service;1'].getService();
        pref = pref.QueryInterface(Components.interfaces.nsIPrefBranch);

        if (url == "[nothing]") {
                try {
                        pref.clearUserPref("zealous.temp." + type);
                } catch (e) {}
        } else {
                pref.setCharPref("zealous.temp." + type, url);
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
    // var prepop	    = d.getElementById('sb_font');
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
        // prepop.appendChild(pitem);
    }
    
    /* Font sizes. */
    popup = d.getElementById('sizes-menu');
    var pre_popup = d.getElementById('pre-sizes-menu');
    // var sbpopup = d.getElementById('sb_size');
    // var sbpre_popup = d.getElementById('sb_presize');
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

    /* try {
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
        } */

    for (var z = 6; z < 30; z++) {
        size_el = d.createElement('menuitem');
        size_pre_el = d.createElement('menuitem');
        // size_sb_el = d.createElement('menuitem');
        // size_sb_pre_el = d.createElement('menuitem');

        size_el.setAttribute('id', 's_'+z);
        size_pre_el.setAttribute('id', 'sp_'+z);
        // size_sb_el.setAttribute('id', 'sb_'+z);
        // size_sb_pre_el.setAttribute('id', 'sbp_'+z);

        size_el.setAttribute('label', z);
        size_pre_el.setAttribute('label', z);
        // size_sb_el.setAttribute('label', z);
        // size_sb_pre_el.setAttribute('label', z);

        size_el.setAttribute('oncommand', 'setSize(' + z + ' + "pt");');
        size_pre_el.setAttribute('oncommand', 'setFixedSize(' + z + ' + "pt");');
        // size_sb_el.setAttribute('oncommand', 'setSBSize(' + z + ' + "pt");');
        // size_sb_pre_el.setAttribute('oncommand', 'setSBPreSize(' + z + ' + "pt");');

        popup.appendChild(size_el);
        pre_popup.appendChild(size_pre_el);
        // sbpopup.appendChild(size_sb_el);
        // sbpre_popup.appendChild(size_sb_pre_el);
    }

    switchSelection('size', sz);
    switchSelection('psize', sf);
    switchSelection('font', ft);

    /* switchSelection('sbsize', sbs);
    switchSelection('sbpsize', sbp);
    switchSelection('sbfont', sbf); */
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

/* function clearScrollback()
{
    if(confirm("Are you sure you want to clear you scrollback buffer?")) {
        scrollback.contentDocument.body.innerHTML = "";
        return;
    }
    return;
}*/

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
            var list;
            try {
                    list = pref.getCharPref("zealous.temp." + themeArr[i] + ".list");
            } catch (err) {
                    continue; // Nothing to list
            }

            var popup = document.getElementById(themeArr[i]);
            if (url) {
                    list = ("[nothing]@" + url).split("@");
            } else {
                    list = ("[nothing]@" + list).split("@");
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

// XXX: What is this, anyway?
function parseXML()
{
    var xmlDoc = document.implementation.createDocument("", "", null);
    xmlDoc.async=false;
    xmlDoc.load("theme.xml");
    var element = xmlDoc.getElementsByTagName("theme");
    alert(element[0].attributes["background"].value);
}



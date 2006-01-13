/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Mozilla.
 *
 * The Initial Developer of the Original Code is IBM Corporation.
 * Portions created by IBM Corporation are Copyright (C) 2004
 * IBM Corporation. All Rights Reserved.
 *
 * Contributor(s):
 *   Darin Fisher <darin@meer.net>
 *   Doron Rosenberg <doronr@us.ibm.com>
 *   Kalle Alm <kalle@enrogue.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

// Zealotry protocol related
const kSCHEME = "zealotry";
const kPROTOCOL_NAME = "Skotos Zealotry";
const kPROTOCOL_CONTRACTID = "@mozilla.org/network/protocol;1?name=" + kSCHEME;
const kPROTOCOL_CID = Components.ID("c8c7dbba-8405-11da-b434-00a0cc5ad2cf");

// Mozilla defined
const kCHROMEHANDLER_CID_STR = "{61ba33c0-3031-11d3-8cd0-0060b0fc14a3}";
const kSIMPLEURI_CONTRACTID = "@mozilla.org/network/simple-uri;1";
const kIOSERVICE_CONTRACTID = "@mozilla.org/network/io-service;1";
const nsISupports = Components.interfaces.nsISupports;
const nsIIOService = Components.interfaces.nsIIOService;
const nsIProtocolHandler = Components.interfaces.nsIProtocolHandler;
const nsIURI = Components.interfaces.nsIURI;

function Protocol()
{
}

Protocol.prototype =
    {
        QueryInterface: function(iid)
        {
            if (!iid.equals(nsIProtocolHandler) &&
                !iid.equals(nsISupports))
            throw Components.results.NS_ERROR_NO_INTERFACE;
            return this;
        },

        scheme: kSCHEME,
        defaultPort: 12645,
        protocolFlags: nsIProtocolHandler.URI_NORELATIVE |
        nsIProtocolHandler.URI_NOAUTH,

        allowPort: function(port, scheme)
        {
            return false;
        },

        newURI: function(spec, charset, baseURI)
        {
            var uri = Components.classes[kSIMPLEURI_CONTRACTID].createInstance(nsIURI);
            uri.spec = spec;
            return uri;
        },

        newChannel: function(aURI)
        {
            // aURI is a nsIUri, so get a string from it using .spec
            var myURL = aURI.spec;

            var chrome_service = Components.classesByID[kCHROMEHANDLER_CID_STR].getService()
            .QueryInterface(nsIProtocolHandler);
            
            // strip away the kSCHEME: part
            myURL = myURL.substring(myURL.indexOf(":") + 1, myURL.length);

            // we should now have [user]@[game]
            var ugArr = myURL.split("@");
            if (ugArr.length != 2) {
                // failed to parse that url. maybe it's just the server. let's change user to *.
                ugArr = ["*", myURL];
            }
            // myURL = encodeURI(myURL);
            // do we recognize this server?
            var servList =
            {cm  : "marrach.skotos.net/Marrach/Zealous",
             mv  : "mv.skotos.net", // prolly need special stuff on that one, I think, but we'll see.
             lc  : "lovecraft.skotos.net",
             s7  : "skotos-seven.skotos.net",
             laz : "lazarus.skotos.net",
             ic  : "ironclaw.skotos.net",
             stages : "stages.skotos.net"};
            
            var servMap =
            {cm : "cm",
             marrach : "cm",
             mv : "mv",
             mortalis : "mv",
             lc : "lc",
             abn : "lc",
             lovecraft : "lc",
             s7 : "s7",
             laz : "laz",
             lazarus : "laz",
             ic : "ic",
             ironclaw : "ic",
             stages : "stages",
             oasis : "stages",
             st : "stages"};
            if (servMap[ugArr[1]]) {
                ugArr[1] = servList[servMap[ugArr[1]]];
            }

            dump("[user, server = " + ugArr + "]\n");
            
            /* create dummy nsIURI and nsIChannel instances */
            var ios = Components.classes[kIOSERVICE_CONTRACTID].getService(nsIIOService);

            var yuri = ios.newURI("chrome://zealotry/content/zealotry.xul", null, null);
            
            return ios.newChannel("chrome://zealotry/content/zealotry.xul?char=" + ugArr[0] + "&baseurl=" + ugArr[1], null, yuri);
            
            // return chrome_service.newChannel(furry);
            // return ios.newChannel("chrome://zealotry/content/zealotry.xul?char=" + ugArr[0] + "&baseurl=" + ugArr[1]);
            // return ios.newChannel("javascript:document.location.href='zealotry.xul?char=" + ugArr[0] + "&baseurl=" + ugArr[1] + "';", null, null);
        },
    }

var ProtocolFactory = new Object();

ProtocolFactory.createInstance = function (outer, iid)
{
    if (outer != null)
    throw Components.results.NS_ERROR_NO_AGGREGATION;

    if (!iid.equals(nsIProtocolHandler) &&
        !iid.equals(nsISupports))
    throw Components.results.NS_ERROR_NO_INTERFACE;

    return new Protocol();
}


/**
 * JS XPCOM component registration goop:
 *
 * We set ourselves up to observe the xpcom-startup category.  This provides
 * us with a starting point.
 */

var ZealotryModule = new Object();

ZealotryModule.registerSelf = function (compMgr, fileSpec, location, type)
{
    compMgr = compMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
    compMgr.registerFactoryLocation(kPROTOCOL_CID,
                                    kPROTOCOL_NAME,
                                    kPROTOCOL_CONTRACTID,
                                    fileSpec,
                                    location,
                                    type);
}

ZealotryModule.getClassObject = function (compMgr, cid, iid)
{
    if (!cid.equals(kPROTOCOL_CID))
    throw Components.results.NS_ERROR_NO_INTERFACE;

    if (!iid.equals(Components.interfaces.nsIFactory))
    throw Components.results.NS_ERROR_NOT_IMPLEMENTED;

    return ProtocolFactory;
}

ZealotryModule.canUnload = function (compMgr)
{
    return true;
}

function NSGetModule(compMgr, fileSpec)
{
    return ZealotryModule;
}

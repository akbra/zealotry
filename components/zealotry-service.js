/* -*- Mode: C++; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4 -*-
 * ***** BEGIN LICENSE BLOCK *****
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
 * The Original Code is mozilla.org code.
 *
 * The Initial Developer of the Original Code is
 * Netscape Communications Corporation.
 * Portions created by the Initial Developer are Copyright (C) 1999
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Seth Spitzer <sspitzer@netscape.com>
 *   Robert Ginda <rginda@netscape.com>
 *   Justin Arthur <justinarthur@ieee.org>
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

/*
 * This is Zealotry, a MUD client based on the SkotOS system. It is based on
 * ChatZilla for parts (such as the window management and URI custom protocol
 * handling).
 */

/* components defined in this file */
/* const CLINE_SERVICE_CONTRACTID =
"@mozilla.org/commandlinehandler/general-startup;1?type=chat";
const CLINE_SERVICE_CID =
Components.ID("{38a95514-1dd2-11b2-97e7-9da958640f2c}"); */
const ZEALOTRYCONTENT_LISTENER_CONTRACTID =
"@mozilla.org/uriloader/zealotry-external-content-listener;1";
const ZEALOTRYCONTENT_LISTENER_CID =
Components.ID("{0e8e0d05-c303-4d2f-8c0e-6f3f0d601748}");
const ZEALOTRYPROT_HANDLER_CONTRACTID =
"@mozilla.org/network/protocol;1?name=zealotry";
const ZEALOTRYPROT_HANDLER_CID =
Components.ID("{c1843906-3a22-4009-a44b-4df23a3964b8}");

const ZEALOTRY_MIMETYPE = "application/x-skotos-zealotry";

/* components used in this file */
const MEDIATOR_CONTRACTID =
"@mozilla.org/appshell/window-mediator;1";
const STANDARDURL_CONTRACTID =
"@mozilla.org/network/standard-url;1";
const IOSERVICE_CONTRACTID =
"@mozilla.org/network/io-service;1";
const ASS_CONTRACTID =
"@mozilla.org/appshell/appShellService;1";
const RDFS_CONTRACTID =
"@mozilla.org/rdf/rdf-service;1";

/* interfaces used in this file */
const nsIWindowMediator  = Components.interfaces.nsIWindowMediator;
const nsICmdLineHandler  = Components.interfaces.nsICmdLineHandler;
const nsICategoryManager = Components.interfaces.nsICategoryManager;
const nsIURIContentListener = Components.interfaces.nsIURIContentListener;
const nsIURILoader       = Components.interfaces.nsIURILoader;
const nsIProtocolHandler = Components.interfaces.nsIProtocolHandler;
const nsIURI             = Components.interfaces.nsIURI;
const nsIStandardURL     = Components.interfaces.nsIStandardURL;
const nsIChannel         = Components.interfaces.nsIChannel;
const nsIRequest         = Components.interfaces.nsIRequest;
const nsIIOService       = Components.interfaces.nsIIOService;
const nsIAppShellService = Components.interfaces.nsIAppShellService;
const nsISupports        = Components.interfaces.nsISupports;
const nsISupportsWeakReference = Components.interfaces.nsISupportsWeakReference;
const nsIRDFService      = Components.interfaces.nsIRDFService;
const nsICommandLineHandler = Components.interfaces.nsICommandLineHandler;
const nsICommandLine     = Components.interfaces.nsICommandLine;

/* content listener */
function ZEALOTRYContentListener()
{
}
   
proto = ZEALOTRYContentListener.prototype;

proto.QueryInterface =
function zealotry_QueryInterface(iid)
{
    if (!iid.equals(nsIURIContentListener) &&
        !iid.equals(nsISupportsWeakReference) &&
        !iid.equals(nsISupports)) {
            throw Components.results.NS_ERROR_NO_INTERFACE;
        }
    return this;
}

proto.onStartURIOpen =
function zealotry_onStartURIOpen()
{}

proto.doContent =
function zealotry_doContent(contentType, preferred, request, contentHandler, count)
{
    var e;
    var channel = request.QueryInterface(nsIChannel);

    var wmClass = Components.classes[MEDIATOR_CONTRACTID];
    var windowManager = wmClass.getService(nsIWindowMediator);

    var assClass = Components.classes[ASS_CONTRACTID];
    var ass = assClass.getService(nsIAppShellService);
    hiddenWin = ass.hiddenDOMWindow;

    // Ok, not starting currently, so check if we've got existing windows.
    var w = windowManager.getMostRecentWindow("skotos:zealotry");

    // Claiming that a Zealotry window is loading.
    if ("ZealotryStarting" in hiddenWin) {
        dump("cz-service: Zealotry claiming to be starting.\n");
        if (w && ("client" in w) && ("initialized" in w.client) &&
            w.client.initialized) {
            dump("cz-service: It lied. It's finished starting.\n");
            // It's actually loaded ok.
            delete hiddenWin.ZealotryStarting;
        }
    }

    if ("ZealotryStarting" in hiddenWin) {
        count = count || 0;
        
        if ((new Date() - hiddenWin.ZealotryStarting) > 10000) {
            dump("cz-service: Continuing to be unable to talk to existing window!\n");
        } else {
            //dump("cz-service: **** Try: " + count + ", delay: " + (new Date() - hiddenWin.ChatZillaStarting) + "\n");

            // We have a Zealotry window, but we're still loading.
            hiddenWin.setTimeout(function wrapper(t, count) {
                t.doContent(contentType, preferred, request, contentHandler, count + 1);
            }, 250, this, count);
            return true;
        }
    }

    // We have a window.
    if (w)  {
        dump("cz-service: Existing, fully loaded window. Using.\n");
        // Window is working and initialized ok. Use it.
        w.focus();
        w.gotoZealotryURL(channel.URI.spec);
        return true;
    }

    dump("cz-service: No windows, starting new one.\n");
    // Ok, no available window, loading or otherwise, so start Zealotry.
    var args = new Object();
    args.url = channel.URI.spec;

    hiddenWin.ZealotryStarting = new Date();
    hiddenWin.openDialog("chrome://zealotry/content/zealotry.xul", "_blank",
                         "chrome,menubar,toolbar,status,resizable,dialog=no",
                         args);
    
    return true;
}

proto.isPreferred =
function zealotry_isPreferred(contentType, desiredContentType)
{
    return contentType == ZEALOTRY_MIMETYPE;
}

proto.canHandleContent =
function zealotry_canHandleContent(contentType, isContentPreferred, desiredContentType)
{
    return contentType == ZEALOTRY_MIMETYPE;
}

/* protocol handler factory object (ZEALOTRYContentListener) */
var ZEALOTRYContentListenerFactory = new Object();

ZEALOTRYContentListenerFactory.createInstance =
function zealotryclf_createInstance(outer, iid)
{
    if (outer != null) {
        throw Components.results.NS_ERROR_NO_AGGREGATION;
    }

    if (!iid.equals(nsIURIContentListener) &&
        !iid.equals(nsISupportsWeakReference) &&
        !iid.equals(nsISupports)) {
            throw Components.results.NS_ERROR_INVALID_ARG;
        }
    
    return new ZEALOTRYContentListener(false);
}

/* zealotry protocol handler component */
function ZEALOTRYProtocolHandler()
{}

proto = ZEALOTRYProtocolHandler.prototype;

proto.protocolFlags = nsIProtocolHandler.URI_NORELATIVE | nsIProtocolHandler.ALLOWS_PROXY;

proto.allowPort =
function zealotryph_allowPort(port, scheme)
{
    return false;
}

proto.newURI =
function zealotryph_newURI(spec, charset, baseURI)
{
    var cls = Components.classes[STANDARDURL_CONTRACTID];
    var url = cls.createInstance(nsIStandardURL);
    url.init(nsIStandardURL.URLTYPE_STANDARD, 443, spec, charset, baseURI);

    return url.QueryInterface(nsIURI);
}

// Channel here is "connection as a character to a host", not connection to a chatline
// on an irc server.
proto.newChannel =
function zealotryph_newChannel(URI)
{
    ios = Components.classes[IOSERVICE_CONTRACTID].getService(nsIIOService);
    if (!ios.allowPort(URI.port, URI.scheme)) {
        throw Components.results.NS_ERROR_FAILURE;
    }

    var bogusChan = new BogusChannel(URI);
    bogusChan.contentType = ZEALOTRY_MIMETYPE;
    return bogusChan;
}

/* protocol handler factory object (ZEALOTRYProtocolHandler) */
var ZEALOTRYProtocolHandlerFactory = new Object();

ZEALOTRYProtocolHandlerFactory.createInstance =
function zealotryphf_createInstance(outer, iid)
{
    alert("zealotryphf_createInstance(" + outer + ", " + iid + ")");
    if (outer != null) {
        throw Components.results.NS_ERROR_NO_AGGREGATION;
    }

    if (!iid.equals(nsIProtocolHandler) && !iid.equals(nsISupports)) {
        throw Components.results.NS_ERROR_INVALID_ARG;
    }

    var protHandler = new ZEALOTRYProtocolHandler();
    protHandler.scheme = "zealotry";
    protHandler.defaultPort = 443;
    return protHandler;
}

/* bogus IRC channel used by the ZEALOTRYProtocolHandler */
function BogusChannel(URI)
{
    this.URI = URI;
    this.originalURI = URI;
}

proto = BogusChannel.prototype;

proto.QueryInterface =
function bc_QueryInterface(iid)
{
    if (!iid.equals(nsIChannel) &&
        !iid.equals(nsIRequest) &&
        !iid.equals(nsISupports)) {
            throw Components.results.NS_ERROR_NO_INTERFACE;
        }
    
    return this;
}

/* nsIChannel */
proto.loadAttributes = null;
proto.contentLength = 0;
proto.owner = null;
proto.loadGroup = null;
proto.notificationCallbacks = null;
proto.securityInfo = null;

proto.open =
function bc_open()
{
    throw Components.results.NS_ERROR_NOT_IMPLEMENTED;
}

proto.asyncOpen =
function bc_asyncOpen(observer, ctxt)
{
    observer.onStartRequest(this, ctxt);
}

proto.asyncRead =
function bc_asyncRead(listener, ctxt)
{
    return listener.onStartRequest(this, ctxt);
}

/* nsIRequest */
BogusChannel.prototype.isPending =
function bc_isPending()
{
    return true;
}

proto.status = Components.results.NS_OK;

proto.cancel =
function bc_cancel(status)
{
    this.status = status;
}

proto.suspend =
proto.resume =
function bc_suspres()
{
    throw Components.results.NS_ERROR_NOT_IMPLEMENTED;
}

var ZealotryModule = new Object();

ZealotryModule.registerSelf =
function zealotry_mod_registerSelf(compMgr, fileSpec, location, type)
{
    compMgr = compMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
    var catman = Components.classes["@mozilla.org/categorymanager;1"]
        .getService(nsICategoryManager);

    /* debug("*** Registering -chat handler.\n");
    compMgr.registerFactoryLocation(CLINE_SERVICE_CID,
                                    "Chatzilla CommandLine Service",
                                    CLINE_SERVICE_CONTRACTID,
                                    fileSpec, location, type);
    catman.addCategoryEntry("command-line-argument-handlers",
                            "chatzilla command line handler",
                            CLINE_SERVICE_CONTRACTID, true, true);
    catman.addCategoryEntry("command-line-handler",
                            "m-irc",
                            CLINE_SERVICE_CONTRACTID, true, true); */

    debug("*** Registering content listener.\n");
    compMgr.registerFactoryLocation(ZEALOTRYCONTENT_LISTENER_CID,
                                    "Zealotry content listener",
                                    ZEALOTRYCONTENT_LISTENER_CONTRACTID,
                                    fileSpec, location, type);
    catman.addCategoryEntry("external-uricontentlisteners",
                            ZEALOTRY_MIMETYPE,
                            ZEALOTRYCONTENT_LISTENER_CONTRACTID, true, true);

    debug("*** Registering zealotry protocol handler.\n");
    compMgr.registerFactoryLocation(ZEALOTRYPROT_HANDLER_CID,
                                    "Zealotry protocol handler",
                                    ZEALOTRYPROT_HANDLER_CONTRACTID,
                                    fileSpec, location, type);

    debug("*** Registering done.\n");
}

ZealotryModule.unregisterSelf =
function zealotry_mod_unregisterSelf(compMgr, fileSpec, location)
{
    compMgr = compMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);

    var catman = Components.classes["@mozilla.org/categorymanager;1"]
        .getService(nsICategoryManager);
    /* catman.deleteCategoryEntry("command-line-argument-handlers",
                               "chatzilla command line handler", true);
    catman.deleteCategoryEntry("command-line-handler",
    "m-irc", true); */
}

ZealotryModule.getClassObject =
function zealotry_mod_getClassObject(compMgr, cid, iid)
{
    // Checking if we're disabled in the Chrome Registry.
    var rv;
    try {
        var rdfSvc = Components.classes[RDFS_CONTRACTID].getService(nsIRDFService);
        var rdfDS = rdfSvc.GetDataSource("rdf:chrome");
        var resSelf = rdfSvc.GetResource("urn:mozilla:package:zealotry");
        var resDisabled = rdfSvc.GetResource("http://www.mozilla.org/rdf/chrome#disabled");
        rv = rdfDS.GetTarget(resSelf, resDisabled, true);
    } catch (e) {
    }
    if (rv)
    throw Components.results.NS_ERROR_NO_INTERFACE;

    /* if (cid.equals(CLINE_SERVICE_CID))
       return CLineFactory; */

    if (cid.equals(ZEALOTRYCONTENT_LISTENER_CID))
    return ZEALOTRYContentListenerFactory;

    if (cid.equals(ZEALOTRYPROT_HANDLER_CID))
    return ZEALOTRYProtocolHandlerFactory;

    if (!iid.equals(Components.interfaces.nsIFactory))
    throw Components.results.NS_ERROR_NOT_IMPLEMENTED;

    throw Components.results.NS_ERROR_NO_INTERFACE;
}

ZealotryModule.canUnload =
function zealotry_mod_canUnload(compMgr)
{
    return true;
}

/* entrypoint */
function NSGetModule(compMgr, fileSpec)
{
    return ZealotryModule;
}

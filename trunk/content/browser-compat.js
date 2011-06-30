/*
 * Browser compatibility library for Zealotry
 * Written 2011-04-30 by Kalle Alm <kalle@enrogue.com>
 */

// ensure the wrappedJSObject exists for the given target
function bcEnsureWrapped(ob) 
{
    if (ob != null && ob.wrappedJSObject == null) {
	ob.wrappedJSObject = ob;
    }
}

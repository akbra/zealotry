/*
 *
 * The Zealous Client (C) 2002 Skotos Tech Inc
 *
 *  020622  Zell    Initial Revision
 *
 * Zealous is based on MUDzilla, the Mozilla based MUD client,
 * Copyright (C) 2001, MOO Canada Inc.
 * http://mudzilla.mozdev.org/
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
 *
 */

function CConnection(host, port)
{
    this.host = host;
    this.port = port;

    this.opened = false;

    return this;
}

CConnection.prototype.onStreamClose =
function connection_osr(status)
{
    if (typeof(onClose) != "undefined") {
        var errorString = "";

        /* for some reason, NS_ERROR_UNKNOWN_HOST is undefined */
        /*
        switch (status) {
        case NS_ERROR_UNKNOWN_HOST:
            errorString = "Unknown host.";
            break;
        case NS_ERROR_CONNECTION_REFUSED:
            errorString = "Connection refused.";
            break;
        case NS_ERROR_NET_TIMEOUT:
            errorString = "Connection timed out.";
            break;
        case NS_BINDING_ABORTED:
            errorString = "User disconnected.";
            break;
        case 0:
            break;
        default:
            alert("unknown status "+status);
            break;
        }
        */
        onClose(status, "status: " + status);
    }

    this.opened = false;
}

CConnection.prototype.onStreamDataAvailable =
function connection_sda(request, inStream, sourceOffset, count)
{
    if (this.onRead) {
        var line = this.bsConnection.readData(0, count);

        this.onRead(line);
    }
}

CConnection.prototype.connect =
CConnection.prototype.open =
function connection_open()
{
    if (this.opened) {
        throw "Already opened";
    }

    try  {
        this.bsConnection = new CBSConnection();
    } catch (ex) {
        alert("Error. Couldn't create socket: " + ex);
        return false;
    }

    if (this.bsConnection.connect(this.host, this.port, (void 0), true, null)) {
        this.bsConnection.startAsyncRead(this);
        this.opened = true;
        return true;
    }
    return false;
}

CConnection.prototype.write =
function connection_write(str)
{
    this.bsConnection.sendData(str);
}

CConnection.prototype.close =
CConnection.prototype.disconnect =
function connection_close()
{
    if (!this.opened) {
        throw "not opened";
    }

    this.bsConnection.disconnect();
}

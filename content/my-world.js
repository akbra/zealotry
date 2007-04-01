/*
 *
 * The Zealotry Client (C) 2006 Skotos Tech Inc
 *
 *  020622  Zell    Initial Revision
 *  03????  DanS    Added dynamic baseurl etc
 *  030606  Zell    Minor rewrite & upgrade, fixes from Zwoc
 *  [see changelog for further entries]
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

var MyWorldSpecification = function() {
    /*
     * This is a list of server pointers, referred to using the
     * zealotry_servMap property, in order to allow users to write
     * "shortcuts" for a particular game. This is tuned for Skotos'
     * gameservers.
     */
    this.zealotry_servList = 
       {cm  : "marrach.skotos.net/Marrach/Zealous",
        mv  : "mv.skotos.net/SAM/Prop/Mortalis:Theatre:Web:Zealous",
        lc  : "lovecraft.skotos.net/Theatre/Zealous",
        s7  : "skotos-seven.skotos.net/Theatre/Zealous",
        laz : "lazarus.skotos.net/Theatre/Zealous",
        ic  : "ironclaw.skotos.net/Theatre/Zealous",
        stages : "stages.skotos.net/Theatre/Zealous",
        chattheatre : "gables.chattheatre.net/Theatre/Zealous",
        hq : "hq.skotos.net/Theatre/Zealous"};

    /*
     * This is a list of shortcuts pointing to specific servers. Multiple
     * shortcuts can point to the same servList entry.
     */
    this.zealotry_servMap =
       {cm : "cm",
        marrach : "cm",
        mv : "mv",
        mortalis : "mv",
        lc : "lc",
        abn : "lc",
        lovecraft : "lc",
        s7 : "s7",
        hq : "hq",
        skotos7 : "s7",
        laz : "laz",
        lazarus : "laz",
        ic : "ic",
        ironclaw : "ic",
        stages : "stages",
        oasis : "stages",
        st : "stages",
        ct : "chattheatre",
        gables : "chattheatre"};

    /*
     * This is a list of WOE server configs.
     */
    this.xwoe_servList =
       {cm  : "marrach.skotos.net:8090",
        mv  : "mv.skotos.net:5090",
        lc  : "lovecraft.skotos.net:3090",
        s7  : "skotos-seven.skotos.net:6090",
        hq  : "hq.skotos.net:4090",
        laz : "lazarus.skotos.net:2090",
        ic  : "ironclaw.skotos.net:7090",
        stages : "stages.skotos.net:4090",
        chattheatre : "gables.chattheatre.net:2090"};

    /*
     * This is a list of shortcuts for WOE servers.
     */
    this.xwoe_servMap =
       {cm        : "cm",
        marrach   : "cm",
        mv        : "mv",
        mortalis  : "mv",
        lc        : "lc",
        hq        : "hq",
        abn       : "lc",
        lovecraft : "lc",
        s7        : "s7",
        skotos7   : "s7",
        laz       : "laz",
        lazarus   : "laz",
        ic        : "ic",
        ironclaw  : "ic",
        stages    : "stages",
        oasis     : "stages",
        st        : "stages",
        gables    : "chattheatre",
        ct        : "chattheatre",
        jon       : "chattheatre"};
}

var MyWorld = new MyWorldSpecification();

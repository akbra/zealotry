/*
**
**	This is Zealous' Macro support, originally copied from
**	the Java client where it was (I think) entirely written by
**	Matthew Seidl.
**
**	Painfully crammed into JavaScript by Zell on the sunny
**	afternoon of June 29th 2003.
*/


function MacroStruct(c) {
   this.client = c;
   this.macroHash = new Object();
}

function outputLine(s) {
   this.client.outputText(s);
   this.client.outputNL();
}

MacroStruct.prototype.add =
function add(inStr, outStr) {
   var newMacro = new Object();

   /* search for previous macro */
   var updating = (this.macroHash[inStr] != null);

   newMacro = new Object();
   newMacro.inStr = inStr;
   newMacro.outStr = outStr;
   newMacro.args = 0;

   var index;

   while ((index = outStr.indexOf("%", index)) != -1) {
      index++;
      if (outStr[index] >= '1' && outStr[index] <= '9') {
	 var argIndex = outStr[index] - '0';
	 if (argIndex > newMacro.args) {
	    newMacro.args = argIndex;
	 }
      }
   }
   if (updating) {
      outputLine("[MACRO <" + inStr + "> altered to: " + outStr + "]");
   } else {
      outputLine("[MACRO <" + inStr + "> created as: " + outStr + "]");
   }
   this.macroHash["ix:" + inStr] = newMacro;
}

MacroStruct.prototype.remove =
function remove(toDelete) {
   this.macroHash["ix:" + toDelete] = null;
}

MacroStruct.prototype.clear =
function clear() {
   this.macroHash = new Object();
}

MacroStruct.prototype.list =
function list() {
   for (ix in this.macroHash) {
      var el = this.macroHash[ix];
      if (el) {
	 outputLine("[MACRO <" + el.inStr + "> is: " + el.outStr + "]");
      }
   }
}

MacroStruct.prototype.writeMacros =
function writeMacros(outFile) {
   for (ix in this.macroHash) {
      outFile.write("MACRO ADD " + this.macroHash[ix].inStr + " " +
		    this.macroHash[ix].outStr + "\n");
   }
}

MacroStruct.prototype.processMacroCommand =
function process(input) {
   var arr;

   if (input == "ADD") {
      outputLine("MACRO ADD Usage: MACRO ADD in_macro out_macro");
   } else if (arr = (/ADD ([^ ]+) (.+)/).exec(input)) {
      this.add(arr[1], arr[2]);
   } else {
      outputLine("[MACRO: Macro support can be found in the Preferences popup.]");
   }


/*
   } else if (input == "LIST") {
      this.list();
   } else if (arr = (/REMOVE (.+)/).exec(input)) {
      this.remove(arr[1]);
      outputLine("[MACRO <" + arr[1] + "> deleted]");
   } else if (input == "REMOVEALL") {
      this.clear();
      outputLine("[MACRO: Data cleared]");
   } else if (input == "LOAD") {
      var nsIFilePicker = Components.interfaces.nsIFilePicker;
      var filePicker = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
      filePicker.init(window, "Read macros from...", nsIFilePicker.modeOpen);
      filePicker.appendFilters(nsIFilePicker.filterText);
      filePicker.defaultExtension = nsIFilePicker.filterText;
      var res = filePicker.show();
      if (res == nsIFilePicker.returnCancel) {
	 return;
      }
      var filePath = filePicker.file.path;

      var macroFile = new File(filePath);
      macroFile.open("r");
      macroFile.close();
      outputLine("[MACRO: Finished reading from: " + filePath + "]");
   } else if (input == "STORE") {
      var nsIFilePicker = Components.interfaces.nsIFilePicker;
      var filePicker = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
      filePicker.init(window, "Save macros to...", nsIFilePicker.modeSave);
      filePicker.appendFilters(nsIFilePicker.filterText);
      filePicker.defaultExtension = nsIFilePicker.filterText;
      var res = filePicker.show();
      if (res == nsIFilePicker.returnCancel) {
	 return;
      }
      var filePath = filePicker.file.path;

      var macroFile = new File(filePath);
      macroFile.open("w");
      this.writeMacros(macroFile);
      macroFile.close();
      outputLine("[MACRO: Data stored to: " + filePath + "]");
   } else {
      outputLine("[MACRO: Usage: MACRO [LOAD STORE ADD REMOVE REMOVEALL LIST]");
   }
*/

}

MacroStruct.prototype.applyMacros =
function apply(remainingInput) {
   var expansions = 0;
   var argsToDo = 0;

   done = "";

   // fetch the next word
   while (arr = (/([a-zA-Z0-9_]+)/).exec(remainingInput)) {
      // any bits to the left of that word are added verbatim
      done += RegExp.leftContext;
      remainingInput = RegExp.rightContext;
      var word = arr[0];

      var macroMatch = this.macroHash["ix:" + word];
      if (macroMatch) {
	 // it's a macro; prepend it to the string we're working on
	 var outStr = macroMatch.outStr;

	 // then do macro-arg replacement (if any) on coming words
	 argsToDo = macroMatch.args;
	 argCount = 1;
	 while (argsToDo > 0) {
	    if (arr = (/([a-zA-Z0-9_]+)/).exec(remainingInput)) {
	       // leftContext is discarded here as garbage
	       remainingInput = RegExp.rightContext;
	       word = arr[0];

	       // make sure we're not inserting recursive junk
	       if (word.indexOf("%") == -1) {
		  // then substitute e.g. %1 for the new word
		  while ((index = outStr.indexOf("%" + argCount)) != -1) {
		     outStr = outStr.substring(0, index) + word +
			outStr.substring(index + 2);
		  }
	       }
	    }
	    argCount ++;
	    argsToDo --;
	 }
	 // allow recursion: prepend 'input' rather than append 'done'
	 remainingInput = outStr + remainingInput;

	 expansions ++;
	 if (expansions > 20) {
	    alert("too many macro expansions: aborting");
	    return null;
	 }
      } else {
	 // not a macro; accept the original word verbatim
	 done += word;
      }
   }
   return done + remainingInput;
}

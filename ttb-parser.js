/**
* Copyright (C) 2014 Dockbite
* Author: Kester Everts
*
* This is free software, placed under the terms of the
* GNU Lesser General Public License, as published by the Free Software
* Foundation; either version 2.1 of the License, or (at your option) any
* later version. Please see the file LICENSE-LGPL for details.
*/

var fs = require("fs");
var path = require("path");

var tablePath = process.argv[2] || "./Tables";

var time = process.hrtime();
console.log(JSON.stringify({
	BrailleLanguage: fs.readdirSync(tablePath).filter(function(filename) {
		return path.extname(filename) == ".ttb";
	}).map(function(filename) {
		console.error("Producing " + filename + "...");
		return {
			"Language": path.basename(filename, ".ttb"),
			"BrailleCharacter": parseFile(filename)
		};
})}, null, "  "));
var diff = process.hrtime(time);
var perf = diff[0] + diff[1] / 1000000000;
console.error("\r\nDone in %d seconds", perf);

function parseFile(filename, includedFrom) {
	//console.log("Parsing " + filename + (includedFrom ? (" included from " + includedFrom) : ""));
	var table = [];
	var file = fs.readFileSync(path.join(tablePath, filename), {encoding: "utf-8"});
	var lines = file.split(/\n|\r|\r\n/);
	// console.log(lines);

	for(var i = 0; i < lines.length; i++) {
		var line = lines[i];
		table = table.concat(parseLine(line, filename, i + 1));
	}

	return table;
}

function parseLine(line, filename, lineNumber) {
	line = line.trim();
	// console.log("Line: " + line);

	// empty line, produces nothing
	if(line.length == 0) {
		//console.log("-> Empty line.");
		return [];
	}

	// comment, produces nothing
	if(line[0] == "#") {
		//console.log("-> Comment.")
		return [];
	}

	var directiveMatch = line.match(/^.+?\b/);
	if(directiveMatch == null) {
		throw new Error("Parse error: no directive on line " + lineNumber + " in " + filename);
	}
	var directive = directiveMatch[0];

	// char, produces a single entry in the char table
	if(directive == "char") {
		//console.log("-> Char.")
		var parsedCharacter = "";
		var parsedDots = [0, 0, 0, 0, 0, 0, 0, 0];
		var match = line.match(/^char\s+([^\s]+)\s+([^#]+)/);
		if(match == null) {
			throw new Error("Parse error: unrecognized char directive syntax on line " + lineNumber + " in " + filename);
		}
		var character = match[1];
		var dots = match[2];

		// A backslash-prefixed special character
		if(character[0] == "\\") {
			var c = character[1];
			if(c == "b") {
				// backspace
				parsedCharacter = "\b";
			} else if(c == "f") {
				// form feed
				parsedCharacter = "\f";
			} else if(c == "n") {
				// line feed
				parsedCharacter = "\n";
			} else if(c == "o") {
				// octal
				parsedCharacter = String.fromCharCode(parseInt(character.substr(2), 8));
			} else if(c == "r") {
				// carriage return
				parsedCharacter = "\r";
			} else if(c == "s") {
				// space
				parsedCharacter = " ";
			} else if(c == "t") {
				parsedCharacter = "\t";
			} else if(c == "u" || c == "U" || c == "x" || c == "X") {
				// hex
				parsedCharacter = String.fromCharCode(parseInt(character.substr(2), 16));
			} else if(c == "v") {
				parsedCharacter = "\v";
			} else if(c == "#") {
				parsedCharacter = "#";
			} else if(c == "<") {
				throw new Error("Parse error: Unicode names are not supported on line " + lineNumber
					 + " in " + filename);
			} else if(c == "\\") {
				parsedCharacter = "\\";
			} else {
				throw new Error("Parse error: Unknown special character on line " + lineNumber + " in " + filename);
			}
		}
		// Any single character other than a backslash or a white-space character
		else {
			parsedCharacter = character[0];
		}

		parsedDots[0] = Number(dots.indexOf("1") != -1);
		parsedDots[1] = Number(dots.indexOf("2") != -1);
		parsedDots[2] = Number(dots.indexOf("3") != -1);
		parsedDots[3] = Number(dots.indexOf("4") != -1);
		parsedDots[4] = Number(dots.indexOf("5") != -1);
		parsedDots[5] = Number(dots.indexOf("6") != -1);
		parsedDots[6] = Number(dots.indexOf("7") != -1);
		parsedDots[7] = Number(dots.indexOf("8") != -1);


		return [{character: parsedCharacter, code: parsedDots}];
	}

	// byte, produces nothing because no sensible char information can be extracted
	if(directive == "byte") {
		console.warn("Warning: byte directive ignored");
		return []
	}

	// glyph, produces nothing as it may be used for mapping characters to braille only
	if(directive == "glyph") {
		return [];
	}

	// include, may produce another table
	if(directive == "include") {
		var includingFile = line.match(/^include ([^#]+)/)[1];
		//console.log("Including file: " + includingFile);
		return parseFile(includingFile, filename);
	}

	// unknown directive
	throw new Error("Parse error: unknown directive on line " + lineNumber + " in " + filename);
}
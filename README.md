# ttb-parser

## Description
Parses [BRLTTY](https://github.com/brltty/brltty/) ttb tables into JSON

## Usage
```
node ttb-parser [tables_dir]
```
ttb-parser outputs JSON to stdout
tables_dir is optional and defaults to ./Tables

Example:
```
node ttb-parser ./Tables > output/languages.json
```
Outputs JSON to output/languages.json. View the file in this repo to see the output.

## Requirements
- [node.js](http://nodejs.org/)

// xmlParser.js

var fs = require('fs');
var sax = require('./sax.js');

var strict = true; // set to false for html-mode


var nodeStack = [];
var rootNode;


function createNode(inputNode) {
	var node = {};
	node.__name = inputNode.name;
	node.__attributes = inputNode.attributes;

	var isRoot = false;
	if (nodeStack.length == 0) {
		isRoot = true;
	}

	var parent;
	if (!isRoot) {
		parent = peekStack();
	}

	nodeStack.push(node);
	var level = nodeStack.length - 2;
	if (level >= 0) {
		node.__level = level;
	}

	if (isRoot) {
		rootNode = node;
	} else {
		if (parent !== null && parent !== undefined) {
			if (parent.__children === null
				|| parent.__children === undefined
				|| Object.prototype.toString.call(parent.__children) !== '[object Array]') {
				parent.__children = [];
			}
			parent.__children.push(node);
		}

	}
	return node;

}

function closeNode(inputNode) {
	nodeStack.pop()
}

function peekStack() {
	if (nodeStack !== null && nodeStack !== undefined && nodeStack.length > 0) {
		return nodeStack[nodeStack.length - 1];
	}

	return null;
}

function toJson(xmlPath, onEnd) {

	var saxSteam = sax.createStream(strict);
	saxSteam.on("error", function (e) {
		console.log("Syntax error in xml!", e);
	});

	saxSteam.on("opentag", function (node) {

		createNode(node);

	});

	saxSteam.on("closetag", function (node) {
		closeNode(node);
	});

	saxSteam.on("end", function (node) {
		onEnd(rootNode);
	});

	fs.createReadStream(xmlPath)
		.pipe(saxSteam);
}

exports.toJson = toJson;
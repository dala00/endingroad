function random(minValue, maxValue) {
	return Math.floor(minValue + Math.random() * (maxValue - minValue + 1));
}

function createBg() {
	var bg = new ccui.Layout();
	var winSize = cc.director.getWinSizeInPixels();
	bg.setContentSize(winSize.width, winSize.height);
	bg.setBackGroundColorType(ccui.Layout.BG_COLOR_GRADIENT);
	bg.setBackGroundColor(cc.color(0, 0, 0), cc.color(0, 0, 128));
	return bg;
}

function createUI(resource, params) {
	var ui = ccs.uiReader.widgetFromJsonFile(resource);
	if (params == undefined) {
		params = {};
	}
	setUIParameters(ui, params);
	
	if (Configure.coinName != 'モバコイン') {
		setCoinName(ui);
	}
	return ui;
}

function setUIParameters(ui, params) {
	for (var name in params) {
		setUIParameter(ui, name, params[name]);
	}
}

function setUIParameter(ui, name, value) {
	var node = ui.getChildByName(name);
	if (typeof value == 'string' || typeof value == 'number') {
		node.setString(value);
	} else {
		setUIParameters(node, value);
	}
}

function setCoinName(ui) {
	var children = ui.getChildren();
	if (children.length > 0) {
		for (var i = 0; i < children.length; i++) {
			setCoinName(children[i]);
		}
	}
	
	if (ui.setString != undefined && ui.getString != undefined) {
		var str = ui.getString();
		str = str.replace('モバコイン', 'ジェム');
		ui.setString(str);
	}
}

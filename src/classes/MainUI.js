// MainUI is layer for header.
var MainUI = cc.Layer.extend({
	scene: null,
	bgLayer: null,
	header: null,
	navi: null,
	bg: null,
	baseHp: 0,
	oldHp: 0,
	
	headerHeight: 0,
	
	ctor: function(scene) {
		this._super();
		this.scene = scene;
		this.initHp();
		
		var winSize = cc.director.getWinSizeInPixels();

		//header
		this.header = createUI('ui/Header/Header.json');
		this.updateHeader();
		this.headerHeight = this.header.getContentSize().height;
		this.header.setPosition(0, winSize.height - this.headerHeight);
		this.addChild(this.header);
		
		var mailButton = this.header.getChildByName('MailButton');
		mailButton.addTouchEventListener(this.onMailButtonClick, this);
		if (Configure.messages != null) {
			if (Configure.messages.filter(function(i){return !i.received;}).length > 0) {
				var label = new NewLabel();
				label.setPosition(20, 2);
				mailButton.addChild(label);
			}
		}
		
		this.setEvent();

		//navi
		this.navi = createUI('ui/Navi/Navi.json');
		this.headerHeight += this.navi.getContentSize().height;
		this.navi.setPosition(0, winSize.height - this.headerHeight);

		var list = this.navi.getChildByName('ButtonList');

		var buttons = ['Stage', 'Party', 'Characters', 'Gacha', 'Shop', 'Other'];
		for (var i = 0; i < buttons.length; i++) {
			var name = buttons[i];
			var button = list.getChildByName(name + 'Button');
			button.name = name;
			button.addTouchEventListener(function(button, type) {
				if (type == 2) {
					Sound.se('sounds/cursor8.wav');
					var className = button.name + 'Scene';
					cc.director.runScene(new cc.TransitionFade(0.25, eval('new ' + className + '()')));
				}
			});
		}
		this.addChild(this.navi);
		
		//bg layer
		this.bgLayer = new cc.Layer();

		//bg
		this.bg = createBg();
		this.bgLayer.addChild(this.bg, 0);
		
		this.setName('MainUI');
		scene.addChild(this.bgLayer, 0);
		scene.addChild(this, 10000);
		
		this.schedule(this.onTimer, 1, cc.REPEAT_FOREVER);
		Sound.bgm('sounds/tamhe08_loop.ogg');
	},
	
	setEvent: function() {
		var scene = this.scene;
		var eventStages = Configure.stages.filter(function(i){return i.id >= 10000;});
		var buttonWidthSum = 0;
		var activeEventCount = 0;
		var now = Configure.getDateTime();
		for (var i = 0; i < eventStages.length; i++) {
			var stage = eventStages[i];
			var isActive = true;
			if (stage.start_time != null && stage.start_time > now) {
				isActive = false;
			}
			if (stage.end_time != null && stage.end_time < now) {
				isActive = false;
			}
			var eventButton = this.header.getChildByName('EventButton' + stage.id);
			if (isActive) {
				var parts = stage.end_time.substr(5, 5).split('-');
				var date = Number(parts[0]) + '/' + Number(parts[1]);
				eventButton.getChildByName('LabelDate').setString(date + 'まで');
				eventButton.name = stage.id;
				eventButton.setPositionY(20);
				eventButton.addTouchEventListener(function(button, type) {
					if (type == 2) {
						var selectedStage = Configure.stages.filter(function(i){return i.id == button.name;})[0];
						var stageLevel = Configure.stageLevels.filter(function(i){return i.stageId == selectedStage.id && i.level == 1})[0];
						var ui = createUI('ui/' + selectedStage.event_ui + '/'  + selectedStage.event_ui + '.json');
						var image = new CharacterImage(Configure.characters.filter(function(i){return i.id == stageLevel.addCharacterId;})[0]);
						image.setPosition(650, 305);
						ui.addChild(image);
						var panel = ui.getChildByName('Panel_1');
						panel.getChildByName('LabelDate').setString(date + 'まで');
						panel.getChildByName('EventStartButton').addTouchEventListener(function(button2, type2) {
							if (type2 == 2) {
								Communicator.setItem('stageId', selectedStage.id);
								Communicator.setItem('levelId', 1);
								cc.director.runScene(new cc.TransitionFade(0.25, new StageScene()));
							}
						});
						panel.getChildByName('EventCloseButton').addTouchEventListener(function(button3, type3) {
							if (type3 == 2) {
								scene.removeChild(ui, true);
							}
						});
						scene.addChild(ui, 20000);
					}
				});
			} else {
				eventButton.setVisible(false);
			}
		}
	},
	
	onMailButtonClick: function(button, type) {
		if (type == 2) {
			Sound.se('sounds/cursor8.wav');
			cc.director.runScene(new cc.TransitionFade(0.25, new MessageScene()));
		}
	},
	
	initHp: function() {
		this.baseHp = Configure.user.hp;
		this.oldHp = this.baseHp;
	},
	
	updateHeader: function() {
		var params = {
			Hp: this.oldHp + ' / ' + Configure.user.maxHp,
			Gold: Configure.user.gold,
			Stone: Configure.user.stone
		};
		setUIParameters(this.header, params);
	},
	
	getHeaderHeight: function() {
		return this.headerHeight;
	},
	
	onTimer: function() {
		if (this.oldHp >= Configure.user.maxHp) return;
		
		var now = (new Date()).getTime();
		var old = (new Date(Configure.user.hpChecked)).getTime();
		var span = 300000;
		now -= now % span;
		old -= old % span;
		var past = now - old;
		past -= past % span;
		if (past > 0) {
			var heal = past / span;
			var hp = this.baseHp + heal;
			if (hp > Configure.user.maxHp) {
				hp = Configure.user.maxHp;
			}
			if (hp != this.oldHp) {
				this.oldHp = hp;
			}
			this.updateHeader();
		}
	}
});

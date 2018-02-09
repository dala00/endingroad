var OpeningScene = cc.Scene.extend({
	terops: [
	    [
	     	'T歴43年',
	     	'世界は滅亡へと向かった。'
	    ],
	    [
	     	'全ての人々は救いを求め',
	     	'古くから語り継がれている',
	     	'永遠の地「楽園」へと向かうため',
	     	'南極星を目印に歩みを進めていた。'
	    ],
	    [
	     	'そこでたまたま巡りあった4人の冒険者達は',
	     	'共に歩みを進めていくこととなった。'
	    ]
	],
	
	layer: null,
	page: 0,
	lineNo: 0,
	count: -180,
	label: null,
	pageEnd: false,
	charaintro: false,
	
	ctor: function() {
		this._super();
		
		var resources = [
		    'pipo-pic002b.jpg'
		];
		var scene = this;
		cc.loader.load(resources, function(err) {
			scene.onImageLoaded();
		});
		var touch = cc.EventListener.create({
			event: cc.EventListener.TOUCH_ALL_AT_ONCE,
			swallowTouches: true,                
			onTouchesBegan:function (touches, event) {
				if (scene.charaintro) return;
				if (scene.pageEnd) {
					scene.lineNo = 0;
					if (++scene.page == scene.terops.length) {
						scene.generateUser();
						return;
					}
					scene.pageEnd = false;
					scene.scheduleUpdate();
					scene.layer.removeAllChildren(true);
				} else {
					if (scene.count > 0) {
						scene.count = 10000;
					}
				}
			}
		});
		cc.eventManager.addListener(touch, this);
	},

	onImageLoaded: function() {
		var bg = new cc.Sprite('pipo-pic002b.jpg');
		var winSize = cc.director.getWinSizeInPixels();
		var bgSize = bg.getContentSize();
		bg.setScale(winSize.width / bgSize.width, winSize.height / bgSize.height);
		bg.setPosition(winSize.width / 2, winSize.height / 2);
		this.addChild(bg, 0);
		
		this.layer = new cc.Layer();
		this.addChild(this.layer, 10);
		
		this.scheduleUpdate();
	},
	
	update: function(dt) {
		if (this.count >= 0) {
			if (this.count == 0) {
				this.createLine();
			} else if (this.count < Configure.fps * 2) {
				this.lineFadeIn(this.count);
			} else if (this.count >= Configure.fps * 4) {
				this.nextLine();
				return;
			}
		}
		this.count++;
	},
	
	createLine: function() {
		var line = this.terops[this.page][this.lineNo];
		var winSize = cc.director.getWinSizeInPixels();
		this.label = new cc.LabelTTF(line, 'Arial', 30);
		this.label.setOpacity(0);
		this.label.setColor(cc.color(255, 255, 255));
		this.label.enableStroke(cc.color(0, 0, 0), 2);
		this.label.setPosition(winSize.width / 2, 350 - this.lineNo * 70);
		this.layer.addChild(this.label);
	},
	
	lineFadeIn: function(count) {
		this.label.setOpacity(255 * count / (Configure.fps * 2));
	},
	
	nextLine: function() {
		var lines = this.terops[this.page];
		this.label.setOpacity(255);
		if (++this.lineNo == lines.length) {
			this.pageEnd = true;
			this.unscheduleUpdate();
		}
		this.count = 0;
	},
	
	generateUser: function() {
		Configure.loading('opening');

		var scene = this;
		Communicator.request('users/generate', null, function(json) {
			if (json.result) {
				Configure.loadData(function() {
					Communicator.setItem('party1', json.characterIds);
					Configure.loadingEnd('opening');
					scene.initializeCharaIntro();
				});
			}
		});
	},
	
	initializeCharaIntro: function() {
		this.charaintro = true;
		
		var layer = new cc.Layer();
		var sprite = new cc.Sprite('bg/pipo-battlebg001.jpg');
		var winSize = cc.director.getWinSizeInPixels();
		sprite.setPosition(winSize.width / 2, winSize.height / 2);
		sprite.setScaleX(winSize.width / sprite.getContentSize().width);
		sprite.setOpacity(0);
		sprite.runAction(new cc.FadeIn(2));
		layer.addChild(sprite, 0);
		
		var x = winSize.width - 200;
		var y = winSize.height - 100;
		var charabg = new cc.Scale9Sprite('pipo-CursorBase001.png', null, cc.rect(10, 10, 10, 10));
		charabg.setContentSize(cc.size(sprite.getContentSize().width + 20, 100));
		charabg.setPosition(sprite.getContentSize().width / 2, y - 28);
		charabg.setOpacity(0);
		charabg.runAction(new cc.FadeIn(2));
		sprite.addChild(charabg, 1);
		
		var i = 0;
		for (var characterId in Configure.usersCharacters) {
			var usersCharacter = Configure.usersCharacters[characterId];
			var chara = new CharacterImage(usersCharacter.character, 2);
			chara.setPosition(-30 - 40 * i, 100 + i * 20 - 40 * (i % 2));
			var move = new cc.MoveBy(10, cc.p(winSize.width + 250, 0));
			if (i == 0) {
				chara.runAction(new cc.Sequence(
					move,
					new cc.CallFunc(this.moveEnd, this)
				));
			} else {
				chara.runAction(move);
			}
			layer.addChild(chara, 10);
			
			var image = new CharacterImage(usersCharacter.character);
			image.setPosition(x, y);
			var name = new cc.LabelTTF(usersCharacter.character.name, 'Arial', 16);
			name.setColor(cc.color(255, 255, 255));
			name.enableStroke(cc.color(0, 0, 0), 2);
			name.setPosition(x, y - 40);
			var rare = new cc.LabelTTF(usersCharacter.character.rare, 'Arial', 16);
			rare.setColor(cc.color(255, 255, 255));
			rare.enableStroke(cc.color(0, 0, 0), 2);
			rare.setPosition(x, y - 60);
			var attribute = Configure.attributes.filter(function(item, no) {
				return item.id == usersCharacter.character.attribute;
			})[0];
			var attr = new cc.Sprite('attributes/' + attribute.image + '.png');
			attr.setScale(0.5);
			attr.setPosition(x - name.getContentSize().width / 2 - 10, y - 40);
			
			this.setAction(image, i);
			this.setAction(name, i);
			this.setAction(rare, i);
			this.setAction(attr, i);
			layer.addChild(image, 10);
			layer.addChild(name, 10);
			layer.addChild(rare, 10);
			layer.addChild(attr, 10);
			
			i++;
		}
		
		this.addChild(layer, 100);
	},
	
	setAction: function(node, no) {
		node.setOpacity(0);
		
		var moves = [];
		for (var i = 0; i < 20; i++) {
			moves.push(new cc.MoveBy(1.0 / 20, cc.p(-i * i / 10, 0)));
		}
		var actions = [];
		actions.push(new cc.DelayTime(1 + no * 2));
		actions.push(new cc.FadeIn(0.5));
		actions.push(new cc.DelayTime(1.5));
		actions.push(new cc.Spawn(
				new cc.Sequence(moves),
				new cc.FadeOut(1)
		));
		node.runAction(new cc.Sequence(actions));
	},
	
	moveEnd: function() {
		cc.director.runScene(new cc.TransitionFade(1.0, new NewsScene()));
	}
});

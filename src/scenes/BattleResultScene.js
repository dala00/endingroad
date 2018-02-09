var BattleResultScene = cc.Scene.extend({
	oldUsersCharacters: null,
	newUsersCharacters: null,
	gotUsersCharacters: null,
	gotItems: null,
	isLastLevel: false,
	lastLevelDone: false,
	resultLayer: null,
	resultNo: 0,
	itemLayer: null,
	itemDone: false,

	ctor: function(battle) {
		this._super();
		this.oldUsersCharacters = battle.oldUsersCharacters;
		this.newUsersCharacters = battle.newUsersCharacters;
		this.gotUsersCharacters = battle.gotUsersCharacters;
		this.gotItems = battle.gotItems;
		this.isLastLevel = battle.isLastLevel;
	},
	
	onEnter: function() {
		this._super();
		var scene = this;
		var layer = new cc.Layer();
		layer.addChild(createBg(), 0);
		var winSize = cc.director.getWinSizeInPixels();

		var particle = new cc.ParticleSystem('particles/gacha_result.plist');
		particle.setPosition(cc.p(winSize.width / 2, winSize.height / 2));
		particle.setAutoRemoveOnFinish(true);
		layer.addChild(particle, 10);
		
		var text = new cc.LabelTTF('RESULT', 'Arial', 30);
		text.setColor(cc.color(255, 255, 255));
		text.setPosition(winSize.width / 2, 410);
		text.setHorizontalAlignment(cc.TEXT_ALIGNMENT_CENTER);
		layer.addChild(text, 100);

		for (var i = 0; i < this.oldUsersCharacters.length; i++) {
			var old = this.oldUsersCharacters[i];
			var usersCharacter = this.newUsersCharacters[i];
			var params = {
				Name: usersCharacter.character.name,
				Level: 'LV.' + old.level,
				Experience: 'EXP.' + old.experience + ' >> ' + usersCharacter.experience
			};
			if (old.level != usersCharacter.level) {
				params.Level += ' >> ' + usersCharacter.level;
			}
			
			var window = new cc.Scale9Sprite();
			window.initWithFile('pipo-CursorBase002.png', cc.rect(0, 0, 30, 30), cc.rect(10, 10, 10, 10));
			var size = cc.size(250, 150);
			window.setContentSize(size);

			var ui = createUI('ui/BattleResultRow/BattleResultRow.json', params);
			var x = winSize.width / 2 - 260 + (i % 3) * 260;
			var y = 280 - Math.floor(i / 3) * 175;
			window.setPosition(x, y);
			window.addChild(ui);
			
			var image = new CharacterImage(usersCharacter.character);
			image.setPosition(125, 100);
			window.addChild(image);
			
			layer.addChild(window, 100);
		}
		
		this.addChild(layer);
		
		var touch = cc.EventListener.create({
			event: cc.EventListener.TOUCH_ALL_AT_ONCE,
			swallowTouches: true,                
			onTouchesBegan:function (touches, event) {
				if (scene.isLastLevel && !scene.lastLevelDone) {
					scene.showLastLevel();
				} else if (scene.gotItems != null && !scene.itemDone) {
					scene.showItems();
				} else if (scene.gotUsersCharacters != null && scene.resultNo < scene.gotUsersCharacters.length) {
					if (scene.itemLayer != null) {
						scene.removeChild(scene.itemLayer, true);
						scene.itemLayer = null;
					}
					scene.showResult10();
				} else {
					scene.endScene();
				}
			}
		});
		cc.eventManager.addListener(touch, this);
		
		Sound.bgm('sounds/tamhe08_loop.ogg');
	},

	showLastLevel: function() {
		var str = "ステージコンプリート!\n";
		str += "最大体力が増加!\n";
		str += "チケットの切れ端を３枚入手!";

		var label = new cc.LabelTTF(str, Configure.font, 16);
		label.setHorizontalAlignment(cc.TEXT_ALIGNMENT_LEFT);
		label.setColor(cc.color(0, 0, 0));
		var size = label.getContentSize();
		var winSize = cc.director.getWinSizeInPixels();

		this.itemLayer = new cc.Sprite();
		this.itemLayer.setTextureRect(cc.rect(0, 0, size.width + 50, size.height + 50));
		this.itemLayer.setColor(cc.color(255, 255, 255));
		this.itemLayer.setPosition(winSize.width / 2, winSize.height / 2);
		this.itemLayer.addChild(label);
		label.setPosition(size.width / 2 + 25, size.height / 2 + 25);
		this.addChild(this.itemLayer, 100);

		this.lastLevelDone = true;
	},
	
	showItems: function() {
		if (this.itemLayer != null) {
			this.removeChild(this.itemLayer, true);
			this.itemLayer = null;
		}
		
		var str = '';
		for (var itemId in this.gotItems) {
			var number = this.gotItems[itemId];
			var item = Configure.items.filter(function(i,no) {return i.id == Number(itemId);})[0];
			str += item.name + ' ' + number + "個\n";
		}
		str += 'を手に入れた!';
		
		var label = new cc.LabelTTF(str, Configure.font, 16);
		label.setHorizontalAlignment(cc.TEXT_ALIGNMENT_LEFT);
		label.setColor(cc.color(0, 0, 0));
		var size = label.getContentSize();
		var winSize = cc.director.getWinSizeInPixels();
		
		this.itemLayer = new cc.Sprite();
		this.itemLayer.setTextureRect(cc.rect(0, 0, size.width + 50, size.height + 50));
		this.itemLayer.setColor(cc.color(255, 255, 255));
		this.itemLayer.setPosition(winSize.width / 2, winSize.height / 2);
		this.itemLayer.addChild(label);
		label.setPosition(size.width / 2 + 25, size.height / 2 + 25);
		this.addChild(this.itemLayer, 100);
		
		this.itemDone = true;
	},
	
	showResult10: function() {
		if (this.resultNo == 0) {
			this.resultLayer = new cc.Layer();
			var winSize = cc.director.getWinSizeInPixels();

			var ui = createUI('ui/GachaResult/GachaResult.json');
			ui.setPosition(320, 140);

			this.resultLayer.addChild(ui, 10, 25);
			this.addChild(this.resultLayer, 100);
		}

		var ui = this.resultLayer.getChildByTag(25);
		var characterId = this.gotUsersCharacters[this.resultNo].character_id;
		var chara = Configure.characters.filter(function(i, no) {return i.id == characterId;})[0];
		var params = {
			Name: chara.name + 'が',
			Rare: '仲間になった！'
		};
		setUIParameters(ui, params);
		ui.getChildByName('LabelPlus').setVisible(false);
		ui.getChildByName('LabelPlused').setVisible(false);

		ui.removeChildByTag(11, true);
		var image = new CharacterImage(chara);
		image.setPosition(100, 130);
		ui.addChild(image, 0, 11);
		this.resultNo++;
	},
	
	endScene: function() {
		cc.director.runScene(cc.TransitionFade.create(0.25, new StageScene()));
	}
});

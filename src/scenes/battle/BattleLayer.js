var BattleLayer = cc.Layer.extend({
	scene: null,
	characters: null,
	enemies: null,
	phase: 1,
	mode: '',
	modeClass: null,
	cursor: null,
	
	padding: 30,
	fieldW: 610,
	fieldH: 330,
	effectZ: 600,
	memberCount: 4,
	
	modes: null,
	oldUsersCharacters: null,
	newUsersCharacters: null,
	gotUsersCharacters: null,
	gotItems: null,
	isLastLevel: null,
	
	ctor: function(scene, usersCharacters, stageLevel) {
		this._super();
		this.scene = scene;
		this.enemies = [];
		var self = this;
		var winSize = cc.director.getWinSizeInPixels();
		
		//bg
		var stage = Configure.stages.filter(function(i, no) {
			return i.id == stageLevel.stageId;
		})[0];
		var bg = new cc.Sprite();
		bg.initWithFile('bg/' + stage.bg);
		var size = bg.getContentSize();
		bg.attr({
			x: size.width / 2,
			y: size.height / 2
		});
		var nodeGrid = cc.NodeGrid.create();
		nodeGrid.addChild(bg);
		this.addChild(nodeGrid, 0);

		if (stage.effect != '') {
			var particle = new cc.ParticleSystem('particles/' + stage.effect);
			this.addChild(particle, 300);
		}
		
		//characters
		this.characters = [];
		for (var i = 0; i < usersCharacters.length; i++) {
			var usersCharacter = usersCharacters[i];
			var chara = new BattleCharacter(usersCharacter);
			if (i < 4) {
				chara.setPosition(this.padding * 2, 100 + 50 * i);
			} else {
				chara.setVisible(false);
				chara.setPosition(-100, 0);
			}
			
			this.addChild(chara.createNodeGrid(), 200);
			this.characters.push(chara);
		}

		//enemy
		this.createEnemies();

		//cursor
		this.cursor = new BattleCursor();
		this.addChild(this.cursor, 400);
		
		//window
		this.createWindows();
		
		//ui
		var params = {Name: stage.name + ' - ' + stageLevel.name};
		var ui = createUI('ui/Battle/Battle.json', params);
		ui.setPositionY(winSize.height - ui.getContentSize().height);
		ui.getChildByName('MenuButton').addTouchEventListener(this.onMenuButtonClick, this);
		this.addChild(ui, 10);
		
		//mode
		this.modes = {
			attack: new BattleAttackMode(this),
			enemy: new BattleEnemyMode(this),
			showPhase: new BattleShowPhaseMode(this),
			characterAppear: new BattleCharacterAppearMode(this)
		};
		setTimeout(function() {
			self.setMode('showPhase');
		}, 2000);
		
		//evnet
		var touch = cc.EventListener.create({
			event: cc.EventListener.TOUCH_ALL_AT_ONCE,
			swallowTouches: true,
			onTouchesBegan:function (touches, event) {
				self.onTouchesBegan(touches, event);
			}
		});
		cc.eventManager.addListener(touch, this);
		this.scheduleUpdate();
	},
	
	update: function(dt) {
		if (this.modeClass != null) {
			this.modeClass.update(dt);
		}
	},
	
	createEnemies: function() {
		var enemies = this.scene.enemies;
		for (var i = 0; i < this.enemies.length; i++) {
			this.enemies[i].removeFromParent(true);
		}
		this.enemies = [];
		for (var i = 0; i < enemies.length; i++) {
			var enemyData = enemies[i];
			if (enemyData.phase == this.phase) {
				var enemy = new BattleEnemy(enemyData);
				var pos;
				if (enemyData.x != 0) {
					pos = cc.p(enemyData.x, enemyData.y);
				} else {
					pos = cc.p(
						this.padding + Math.random() * (this.fieldW - this.padding),
						this.padding + Math.random() * (this.fieldH - this.padding)
					);
				}
				enemy.setPosition(pos);
				this.addChild(enemy.createNodeGrid(), 100);
				this.enemies.push(enemy);
			}
		}
	},
	
	createWindows: function() {
		var screenW = cc.director.getWinSizeInPixels().width;
		var bg = cc.Sprite.create();
		bg.setTextureRect(cc.rect(0, 0, screenW - 640, 480));
		bg.setColor(cc.color(0, 0, 0));
		bg.setPosition(screenW - bg.getContentSize().width / 2, 240);
		this.addChild(bg, 1999);
		
		for (var i = 0; i < this.characters.length; i++) {
			var window = new BattleWindow(this.characters[i]);
			window.setPosition(screenW - window.getContentSize().width / 2, 420 - 120 * i);
			this.addChild(window, 2000);
		}
	},
	
	onTouchesBegan: function(touches, event) {
		var pos = touches[0].getLocation();
		if (this.modeClass != null) {
			this.modeClass.onClick(pos);
		}
		
		if (this.mode == 'end') {
			var scene = this;
			Communicator.request('users/endGame', null, function(json) {
				scene.oldUsersCharacters = [];
				scene.newUsersCharacters = [];
				scene.gotItems = json.getItems;
				scene.isLastLevel = json.isLastLevel;
				if (json.getItems != null || json.isLastLevel) {
					Configure.updateUsersItems(json.usersItems);
				}
				for (var i = 0; i < json.usersCharacters.length; i++) {
					var row = json.usersCharacters[i];
					scene.oldUsersCharacters.push(Configure.usersCharacters[row.character_id]);
					Configure.usersCharacters[row.character_id] = new UsersCharacter(row);
					scene.newUsersCharacters.push(Configure.usersCharacters[row.character_id]);
				}
				if (json.getUsersCharacters != null) {
					scene.gotUsersCharacters = [];
					for (var i = 0; i < json.getUsersCharacters.length; i++) {
						var row = json.getUsersCharacters[i];
						Configure.usersCharacters[row.character_id] = new UsersCharacter(row);
						scene.gotUsersCharacters.push(Configure.usersCharacters[row.character_id]);
					}
				}
				cc.director.runScene(new BattleResultScene(scene));
			});
		}
	},
	
	setMode: function(mode, params) {
		this.mode = mode;
		if (this.modes[mode] != undefined) {
			this.modeClass = this.modes[mode];
		} else {
			this.modeClass = null;
		}
		if (this.modeClass != null) {
			if (params == undefined) {
				params = null;
			}
			this.modeClass.initialize(params);
		}
	},
	
	endGame: function() {
		this.setMode('endStart');
		this.cursor.removeFromParent(true);
		var scene = this;
		var winSize = cc.director.getWinSizeInPixels();
		
		//クリアアニメーション
		var sec = 1;
		var bg = new cc.Sprite();
		bg.setTextureRect(winSize);
		bg.setPosition(winSize.width / 2, winSize.height / 2);
		bg.setColor(cc.color(0, 0, 0));
		bg.setOpacity(0);
		bg.runAction(new cc.FadeTo(sec, 128));
		this.addChild(bg, 2499);
		
		var sprite = new cc.Sprite('clear.png');
		sprite.setPosition(winSize.width / 2, winSize.height / 2);
		sprite.setScale(0);
		sprite.setOpacity(0);
		sprite.runAction(new cc.Sequence(
			new cc.Spawn(
				new cc.FadeIn(sec),
				new cc.ScaleTo(sec, 1.0),
				new cc.RotateBy(sec, 360 * 5)
			),
			new cc.CallFunc(function() {
				sprite.setRotation(0);
				scene.setMode('end');
			})
		));
		this.addChild(sprite, 2500);
		
		Sound.bgmStop();
		Sound.se('sounds/soft-c02.mp3');
	},
	
	skillEffect: function(chara, color) {
		Sound.se('sounds/status1.wav');
		
		var labelY = 50;
		var  particle = new cc.ParticleSystem('particles/battle_teropbg.plist');
		particle.setPosition(cc.p(640, labelY));
		particle.setScaleY(0.5);
		particle.setAutoRemoveOnFinish(true);
		if (color != undefined) {
			particle.setStartColor(color);
			particle.setEndColor(color);
		}
		this.addChild(particle, 1000);

		particle = new cc.ParticleSystem('particles/skill_bg.plist');
		particle.setPosition(cc.p(640, 240));
		particle.setScaleX(1.5);
		particle.setAutoRemoveOnFinish(true);
		if (color != undefined) {
			particle.setStartColor(color);
			particle.setEndColor(color);
		}
		this.addChild(particle, 1000);

		var label = new cc.LabelTTF(chara.skill.name, 'Arial', 18);
		label.setPosition(1000, 50);
		label.setColor(cc.color(255, 255, 255));
		label.enableStroke(cc.color(0, 0, 0), Configure.mode == 'Android' ? 3 : 1);
		var labelX = 550;
		var actions = [];
		for (var i = 0; i < 10; i++) {
			var pos = cc.p(labelX + 5 * (10 - i) * (10 - i), labelY);
			actions.push(cc.MoveTo.create(0.04, pos));
		}
		var startMove = cc.Sequence.create(actions);
		actions = [];
		for (var i = 0; i < 10; i++) {
			var pos = cc.p(labelX - 10 * i * i, labelY);
			actions.push(cc.MoveTo.create(0.04, pos));
		}
		var endMove = cc.Sequence.create(actions);
		label.runAction(
			cc.Sequence.create(
				cc.Spawn.create(cc.FadeIn.create(0.4), startMove),
				cc.DelayTime.create(0.4),
				cc.Spawn.create(cc.FadeOut.create(0.4), endMove),
				cc.CallFunc.create(this.modeClass.attackMovingStart, this.modeClass),
				cc.RemoveSelf.create(true)
			)
		);
		this.addChild(label, 1100);
	},
	
	effect: function(filename, x, y) {
		var parts = filename.split('.');
		var ext = parts[parts.length - 1];
		if (ext == 'plist') {
			particle = new cc.ParticleSystem('particles/' + filename);
			particle.setPosition(cc.p(x, y));
			this.addChild(particle, this.effectZ);
		} else {
			this.addChild(new Effect(filename, x, y), this.effectZ);
		}
	},
	
	damageEffect: function(chara, damage, color, delay) {
		var label = new cc.LabelBMFont(damage.toString(), "font2.fnt");
		if (color != undefined && color != null) {
			label.setColor(color);
		}
		label.setPosition(chara.getPosition());
		var move = cc.MoveBy.create(1, cc.p(0, 30));
		var fade = cc.FadeOut.create(1);
		var spawn = cc.Spawn.create(move, fade);
		var actions = [];
		if (delay != undefined) {
			actions.push(new cc.DelayTime(delay));
		}
		actions.push(spawn);
		actions.push(new cc.RemoveSelf(true));
		var sequence = new cc.Sequence(actions);
		label.runAction(sequence);
		this.addChild(label, 1000);
	},
	
	lose: function() {
		var self = this;
		var text = "全滅しました。\n宝玉を使ってコンテニューしますか？\n";
		var legal;
		if (Configure.user.stone > 0) {
			text += '(所持している宝玉を使用します)';
			legal = false;
		} else {
			text += '(所持していないため' + Configure.paymentItems[1].price + Configure.coinName + 'で購入します)';
			legal = true;
		}
		var messageBox = new MessageBox({
			type: 'YesNo',
			text: text,
			legal: legal,
			dontClose: true,
			onYesButtonClick: function() {
				if (Configure.user.stone > 0) {
					Payment.useStone('continue', function(json) {
						if (json.result) {
							messageBox.close();
							self.continueFunc();
						}
					});
				} else {
					Payment.start(1, function(json) {
						if (json.result) {
							Payment.useStone('continue', function(json) {
								if (json.result) {
									messageBox.close();
									self.continueFunc();
								}
							});
						}
					});
				}
			},
			onNoButtonClick: function() {
				cc.director.runScene(new cc.TransitionFade(0.25, new StageScene()));
			}
		});
	},
	
	continueFunc: function() {
		for (var i = 0; i < this.characters.length; i++) {
			this.characters[i].revive();
		}
		var params = {
			currentCharaMax: -1
		};
		this.setMode('characterAppear', params);
	},
	
	onMenuButtonClick: function(button, type) {
		if (type == 2) {
			this.retire();
		}
	},
	
	retire: function() {
		var scene = this;
		new MessageBox({
			type: 'YesNo',
			text: 'リタイアします。よろしいですか？(開始時に消費した体力は元に戻りません)',
			onYesButtonClick: function() {
				Communicator.request('users/retireGame', null, function(json) {
					cc.director.runScene(new cc.TransitionFade(0.25, new StageScene()));
				});
			}
		});
	},
	
	getMovePositions: function(chara, pos) {
		var positions = [];
		var maxCount = Configure.fps / 2;
		for (var i = 0; i < maxCount; i++) {
			var x = chara.x + (pos.x - chara.x) / maxCount * (i + 1);
			var y = chara.y + (pos.y - chara.y) / maxCount * (i + 1);
			var row = {x:x, y:y};
			positions.push(row);
		}
		return positions;
	},
	
	showBuffIconAll: function() {
		for (var i = 0; i < this.characters.length; i++) {
			this.characters[i].showBuffIcon();
		}
		for (var i = 0; i < this.enemies.length; i++) {
			this.enemies[i].showBuffIcon();
		}
	},

	getCurrentChara: function(characters, no) {
		if (no == undefined) {
			no = characters;
			characters = this.characters;
		}
		
		if (no >= characters.length) {
			return null;
		}
		var count = 0;
		for (var i = 0; i < no; i++) {
			if (!characters[i].died) {
				if (++count >= this.memberCount) {
					return null;
				}
			}
		}
		
		while (no < characters.length && characters[no].died) {
			no++;
		}
		if (no < characters.length) {
			return no;
		}
		return null;
	},
	
	getCurrentEnemy: function(no) {
		if (no >= this.enemies.length) {
			return null;
		}

		while (no < this.enemies.length && this.enemies[no].died) {
			no++;
		}
		if (no < this.enemies.length) {
			return no;
		}
		return null;
	},
	
	getCurrentCharaMax: function() {
		var count = 0;
		for (var i = 0; i < this.characters.length; i++) {
			if (!this.characters[i].died) {
				if (++count == 4) {
					return i;
				}
			}
		}
		return this.characters.length - 1;
	},
	
	setCurrentChara: function(no) {
		for (var i = 0; i < this.characters.length; i++) {
			var color;
			if (no == i) {
				color = cc.color(255, 255, 0);
			} else {
				color = cc.color(255, 255, 255);
			}
			var panel = this.characters[i].window.getChildByName('Panel_8');
			var label = panel.getChildByName('Name');
			label.setColor(color);
		}
	},
	
	getCharaCount: function() {
		var count = 0;
		for (var i = 0; i < this.characters.length; i++) {
			if (!this.characters[i].died) {
				count++;
			}
		}
		return count;
	},
	
	getEnemyCount: function() {
		var count = 0;
		for (var i = 0; i < this.enemies.length; i++) {
			if (!this.enemies[i].died) {
				count++;
			}
		}
		return count;
	},
	
	getPhaseMax: function() {
		return this.scene.enemies[this.scene.enemies.length - 1].phase;
	}
});

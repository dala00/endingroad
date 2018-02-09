var StageScene = cc.Scene.extend({
	ui: null,
	mainUI: null,
	bg: null,
	maxStageId: null,
	maxLevelId: null,
	currentStageId: 0,
	currentLevel: null,
	party: 0,
	initializing: true,
	
	onEnter: function () {
		this._super();
		var mainUI = new MainUI(this);
		this.mainUI = mainUI;
		
		this.party = Communicator.getItem('party', 1);
		var isTutorial = (Configure.user.stage_id == 1 && Configure.user.level_id < 5);
		
		this.ui = ccs.uiReader.widgetFromJsonFile("ui/StageUi/StageUi.json");
		var stageList = this.ui.getChildByName("StageList");
		var eventList = this.ui.getChildByName('EventList');
		var normalStages = Configure.stages.filter(function(i){return i.id < 10000;});
		var eventStages = Configure.getEventStages();
		var eventCount = eventStages.length;
		if (isTutorial) {
			eventCount = 0;
		}
		if (eventCount == 0) {
			eventList.setVisible(false);
		} else {
			stageList.setContentSize(stageList.getSize().width, 40 * (10 - eventCount));
			eventList.setContentSize(eventList.getSize().width, 40 * eventCount);
			eventList.setPositionY(400 - eventCount * 40);
		}
		
		var allEnd = false;
		var stageLevels = Configure.stageLevels.filter(function(i, no) {return i.stageId == Configure.user.stage_id;});
		if (Configure.user.level_id == stageLevels[stageLevels.length - 1].level) {
			if (Configure.user.stage_id < normalStages[normalStages.length - 1].id) {
				this.maxStageId = Configure.user.stage_id + 1;
				this.maxLevelId = 1;
			} else {
				this.maxStageId = Configure.user.stage_id;
				this.maxLevelId = Configure.user.level_id;
				allEnd = true;
			}
		} else {
			this.maxStageId = Configure.user.stage_id;
			this.maxLevelId = Configure.user.level_id + 1;
		}

		var scene = this;
		var normalMaxStageId = 0;
		for (var i = 0; i < Configure.stages.length; i++) {
			var stage = Configure.stages[i];
			if (stage.id < 10000) {
				if (stage.id <= this.maxStageId) {
					var button = this.createButton(stage.id, stage.name);
					button.getChildByName("Button").addTouchEventListener(this.onStageButtonClick, this);
					stageList.pushBackCustomItem(button);
				}
				if (normalMaxStageId < stage.id) {
					normalMaxStageId = stage.id;
				}
			}
		}
		for (var i = 0; i < eventStages.length; i++) {
			var stage = eventStages[i];
			var button = this.createButton(stage.id, stage.name);
			button.getChildByName("Button").addTouchEventListener(this.onStageButtonClick, this);
			eventList.pushBackCustomItem(button);
		}
		if (allEnd) {
			var text = new ccui.Text("続きは今後のアップデートで\n追加予定です", Configure.font, 12);
			stageList.pushBackCustomItem(text);
		}
		
		var startButton = this.ui.getChildByName('Detail').getChildByName('StartButton');
		startButton.addTouchEventListener(this.onStartButtonClick, this);
		
		var currentStageId = Communicator.getItem('stageId', 1);
		if (currentStageId > this.maxStageId) {
			var eventStageExists = false;
			for (var i = 0; i < eventStages.length; i++) {
				if (eventStages[i].id == currentStageId) {
					eventStageExists = true;
					break;
				}
			}
			if (!eventStageExists) {
				currentStageId = 1;
			}
		}
		this.createLevelButtons(currentStageId);
		this.addChild(this.ui, 1000);


		
		var partyContainer = this.ui.getChildByName('Detail').getChildByName('Partys');
		partyContainer.addEventListener(this.onPartyChange, this);
		for (var i = 0; i < Configure.partyMax; i++) {
			var usersCharacters = Configure.getPartyMembers(true, i + 1);
			var params = {
				PartyName: 'パーティ' + (i + 1)	
			};
			var ui = createUI('ui/StageParty/StageParty.json', params);
			for (var j = 0; j < usersCharacters.length; j++) {
				var usersCharacter = usersCharacters[j];
				var params2 = {
					Name: '' + (j + 1) + ' - ' + usersCharacter.character.name,
					Level: 'LV.' + usersCharacter.level
				};
				var cell = createUI('ui/StagePartyCell/StagePartyCell.json', params2);
				cell.setPosition(15 + 180 * Math.floor(j / 3), 115 - 55 * (j % 3));
				
				var image = new CharacterImage(usersCharacter.character);
				image.setPosition(21, 23);
				cell.addChild(image);
				
				var attr = Configure.attributes.filter(function(i, no) {
					return i.id == usersCharacter.character.attribute;
				})[0];
				var attrImage = new cc.Sprite('attributes/' + attr.image + '.png');
				attrImage.setScale(0.5);
				attrImage.setPosition(46, 33);
				cell.addChild(attrImage);
				
				ui.addChild(cell);
			}
			partyContainer.addPage(ui);
		}
		partyContainer.scrollToPage(this.party - 1);
		this.initializing = false;

		if (Configure.mode == 'Windows') {
			var event = new cc._EventListenerMouse();
			event.onMouseScroll = function(event) {
				var minY = stageList._contentSize.height - stageList._innerContainer.getContentSize().height;
				var h = -minY;
				if (h > 0) {
					var current = stageList._innerContainer.getPositionY() - event.getScrollY();
					var per = (current - minY) * 100 / h;
					stageList.scrollToPercentVertical(per, 0.1, true);
				}
			};
			cc.eventManager.addListener(event, this);
		}
		
		Configure.setKeyEvent(this);
	},
	
	createButton: function(name, text) {
		var button = ccs.uiReader.widgetFromJsonFile("ui/StageButton/StageButton.json");
		button.name = name;
		button.getChildByName("Button").getChildByName("Label").setString(text);
		return button;
	},
	
	createLevelButtons: function(stageId) {
		if (this.currentStageId == stageId) {
			return;
		}
		this.currentStageId = stageId;
		Communicator.setItem('stageId', stageId);
		var currentLevelId = Communicator.getItem('levelId', 1);
		if (stageId == this.maxStageId && currentLevelId > this.maxLevelId) {
			currentLevelId = 1;
		}
		
		var stage = Configure.stages.filter(function(i, no){return i.id == stageId;})[0];
		if (this.bg) {
			this.reorderChild(this.bg, 11);
			this.bg.runAction(new cc.Sequence(
				new cc.FadeOut(0.5),
				new cc.RemoveSelf(true)
			));
		}
		var winSize = cc.director.getWinSizeInPixels();
		this.bg = new cc.Sprite();
		this.bg.initWithFile('bg/' + stage.bg);
		this.bg.setOpacity(196);
		this.bg.setPosition(
				winSize.width - 320,
				(winSize.height - this.mainUI.getHeaderHeight()) / 2
		);
		this.addChild(this.bg, 10);
		
		var levelList = this.ui.getChildByName("LevelList");
		levelList.removeAllChildren();
		var first = true;
		for (var i = 0; i < Configure.stageLevels.length; i++) {
			var level = Configure.stageLevels[i];
			var ok = false;
			if (stageId < 10000) {
				ok = (level.stageId < this.maxStageId || (level.stageId == this.maxStageId && level.level <= this.maxLevelId));
			} else {
				if (level.needCharacter == 0) {
					ok = true;
				} else {
					ok = Configure.findUsersCharacterByBaseId(level.needCharacter);
				}
			}
			if (ok) {
				if (level.stageId == stageId) {
					var button = this.createButton("" + stageId + "_" + level.level, level.name);
					button.getChildByName("Button").addTouchEventListener(this.onLevelButtonClick, this);
					levelList.pushBackCustomItem(button);
					if (level.level == currentLevelId) {
						this.onLevelButtonClick(button.getChildByName("Button"), 2);
						first = false;
					}
				}
			}
		}
	},
	
	onStageButtonClick: function(button, type) {
		if (type == 2) {
			Sound.se('sounds/cursor8.wav');
			this.createLevelButtons(Number(button.parent.name));
		}
	},
	
	onLevelButtonClick: function(button, type) {
		if (type == 2) {
			if (!this.initializing) {
				Sound.se('sounds/cursor8.wav');
			}
			var parts = button.parent.name.split('_');
			var stageId = this.currentStageId;
			var stage = Configure.stages.filter(function(i, no) {
				return stageId == i.id;
			})[0];
			var old = this.currentLevel;
			this.currentLevel = Configure.stageLevels.filter(function(i, no) {
				return stageId == i.stageId && Number(parts[1]) == i.level;
			})[0];
			if (old != this.currentLevel) {
				Communicator.setItem('levelId', this.currentLevel.level);
			}
			var params = {
				Detail: {Title: {
					LabelTitle: stage.name + ' - ' + this.currentLevel.name,
					LabelDetail: this.currentLevel.description,
					HP: this.currentLevel.hp
				}}
			};
			setUIParameters(this.ui, params);
		}
	},
	
	onStartButtonClick: function(button, type) {
		if (type == 2) {
			if (this.currentLevel.hp > Configure.user.maxHp) {
				new MessageBox('体力が不足しています。');
				return;
			}
			
			Sound.se('sounds/decide11.wav', false);
			var usersCharacters = Configure.getPartyMembers();
			if (usersCharacters.length == 0) {
				new MessageBox('パーティーメンバーが存在しません。編成を行って下さい。');
				return;
			}
			if (this.currentLevel.needCharacter != 0) {
				var exist = false;
				for (var i = 0; i < usersCharacters.length; i++) {
					if (usersCharacters[i].character.base_id == this.currentLevel.needCharacter) {
						exist = true;
						break;
					}
				}
				if (!exist) {
					var cid = this.currentLevel.needCharacter;
					var chara = Configure.characters.filter(function(i, no) {return i.id == cid})[0];
					new MessageBox('このクエストは' + chara.name + 'をパーティーに入れている必要があります。');
					return;
				}
			}
			
			var members = [];
			for (var i = 0; i < usersCharacters.length; i++) {
				members.push(usersCharacters[i].character_id);
			}
			var params = {
				character_id: members.join(','),
				stage: this.currentLevel.stageId,
				level: this.currentLevel.level
			};
			var scene = this;
			Communicator.request('users/playGame', params, function(json) {
				if (json.result) {
					Configure.updateUsersCharacters(json.usersCharacters);
					cc.director.runScene(new cc.TransitionRotoZoom(2, new BattleScene(usersCharacters, scene.currentLevel, json.enemies)));
				} else {
					if (json.errorMessage == undefined) {
						var hp = '体力:' + Configure.user.hp + ' → ' + (Configure.user.hp + Configure.user.maxHp);
						new MessageBox({
							type: 'YesNo',
							text: "体力が不足しています。宝玉を使って体力を回復しますか？ (最大体力を超えて回復します)\n" + hp,
							onYesButtonClick: function() {
								if (Configure.user.stone > 0) {
									Communicator.request('users/useStone', {mode: 'heal'}, function(json) {
										if (json.result) {
											scene.onStartButtonClick(button, type);
										} else {
											new MessageBox('エラーが発生しました。');
										}
									});
								} else {
									cc.director.runScene(new cc.TransitionFade(0.25, new ShopScene()));
								}
							}
						});
					} else {
						new MessageBox(json.errorMessage);
					}
				}
			});
		}
	},
	
	onPartyChange: function(layout, type) {
		if (type == ccui.PageView.EVENT_TURNING) {
			var party = layout.getCurPageIndex() + 1;
			if (party != this.party) {
				Communicator.setItem('party', party);
				this.party = party;
			}
		}
	},
	
	onKeyReleased:function (key, event) {
		if (key == cc.KEY.escape) {
			new MessageBox({
				type: 'YesNo',
				text: 'アプリを終了します。',
				onYesButtonClick: function() {
					cc.director.end();
				}
			});
		}
	}
});


var CharacterScene = cc.Scene.extend({
	
	usersCharacter: null,
	
	ctor: function(characterId, isBattle) {
		this._super();
		var layer = new cc.Layer();
		layer.addChild(createBg(), 0);
		
		var chara = Configure.usersCharacters[characterId];
		this.usersCharacter = chara;
		
		var nextExperience = chara.getExperienceForLevel(chara.level + 1);
		var expRest;
		if (nextExperience == 0) {
			expRest = '----';
		} else {
			expRest = 'あと' + (nextExperience - chara.experience);
		}
		
		//ステータス
		var params = {StatusPanel: {
			Rare: chara.character.rare,
			Name: chara.character.name,
			Level: chara.level,
			Experience: chara.experience + ' / ' + expRest,
			Hp: chara.hp,
			Attack: chara.attack,
			Defence: chara.defence
		}};
		if (chara.plus > 0) {
			params.StatusPanel.Name += '  +' + chara.plus;
		}
		var ui = createUI('ui/Character/Character.json', params);
		ui.getChildByName('BackButton').addTouchEventListener(this.onBackButtonClick, this);
		layer.addChild(ui, 10);
		var statusPanel = ui.getChildByName('StatusPanel');
		
		var image = new CharacterImage(chara.character);
		image.setPosition(45, 237);
		statusPanel.addChild(image, 10);
		
		var attr = Configure.attributes.filter(function(i) {return i.id == chara.character.attribute;})[0];
		var attrImage = new cc.Sprite('attributes/' + attr.image + '.png');
		attrImage.setPosition(88, 237);
		attrImage.setScale(0.75);
		statusPanel.addChild(attrImage);

		//スキル
		var skillPanel = ui.getChildByName('SkillPanel');
		var skills = Configure.skills.filter(function(item, index) {
			return item.characterId == chara.character_id && item.level <= chara.level;
		});
		for (var i = 0; i < skills.length; i++) {
			var skill = skills[i];
			var skillEffect = Configure.skillEffects.filter(function(i, no) {
				return i.id == skill.effect;
			})[0];
			var skillParams = {
				Name: skill.name,
				Description: skillEffect == null ? '' : skillEffect.description
			};
			
			if (skill.turn != '') {
				skillParams.Description += '  ' + skill.turn + 'ターン継続';
			}
			skillParams.Description += '  CT:' + skill.ct + 'ターン';
			var skillUi = createUI('ui/CharacterSkill/CharacterSkill.json', skillParams);
			skillUi.setPosition(20, 160 - 70 * i);
			skillPanel.addChild(skillUi, 10);
		}
		
		//進化
		var progressPanel = ui.getChildByName('ProgressPanel');
		if (isBattle == undefined && (chara.character.progress != 0 || (chara.character.plus != 0 && chara.plus < 99))) {
			var enableProgress = true;
			var names = '';
			var numbers = '';
			var lines = chara.character.progressItem.split("\n");
			for (var i = 0; i < lines.length; i++) {
				var line = lines[i];
				var parts = line.split(':');
				var itemId = Number(parts[0]);
				var needNumber = Number(parts[1]);
				var item = Configure.items.filter(function(i) {return i.id == itemId;})[0];
				names += item.name + "\n";
				var number;
				if (Configure.usersItems[itemId] == undefined) {
					number = 0;
				} else {
					number = Configure.usersItems[itemId].number;
				}
				numbers += number + ' / ' + needNumber + "\n";
				if (number < needNumber) {
					enableProgress = false;
				}
			}
			var progressItems = {
				ItemName: names,
				ItemCount: numbers
			};
			if (chara.character.plus != 0) {
				progressItems.ProgressLabel = '強化';
				progressItems.ProgressButton = {Label: '強化する'};
			}
			setUIParameters(progressPanel, progressItems);
			var progressButton = progressPanel.getChildByName('ProgressButton');
			if (!enableProgress) {
				progressButton.setVisible(false);
			} else {
				if (chara.character.progress != 0) {
					progressButton.addTouchEventListener(this.onProgressButtonClick, this);
				} else {
					progressButton.addTouchEventListener(this.onPlusButtonClick, this);
				}
			}
		} else {
			progressPanel.setVisible(false);
		}
		
		this.addChild(layer, 0);

		var listener = cc.EventListener.create({
			event: cc.EventListener.KEYBOARD,
			onKeyReleased:function (key, event) {
				if (key == cc.KEY.escape) {
					cc.director.popScene();
				}
			}
		});
		cc.eventManager.addListener(listener, this);
	},
	
	onProgressButtonClick: function (button, type) {
		if (type == 2) {
			var params = {
				character_id: this.usersCharacter.character.id	
			};
			Communicator.request('usersCharacters/progress', params, function(json) {
				if (json.result) {
					delete Configure.usersCharacters[params.character_id];
					var usersCharacter = new UsersCharacter(json.usersCharacter);
					Configure.usersCharacters[usersCharacter.character_id] = usersCharacter;
					Configure.updateUsersItems(json.usersItems);
					
					for (var i = 1; i <= Configure.partyMax; i++) {
						var member = Communicator.getItem('party' + i, ',,,,,');
						var members = member.split(',');
						for (var j = 0; j < members.length; j++) {
							if (Number(members[j]) == params.character_id) {
								members[j] = usersCharacter.character_id;
								member = members.join(',');
								Communicator.setItem('party' + i, member);
								break;
							}
						}
					}
					
					cc.director.runScene(new cc.TransitionFade(3, new CharacterScene(usersCharacter.character_id), cc.color(255, 255, 255)));
				} else {
					new MessageBox('エラーが発生しました。');
				}
			});
		}
	},
	
	onPlusButtonClick: function(button, type) {
		if (type == 2) {
			var params = {
				character_id: this.usersCharacter.character.id	
			};
			Communicator.request('usersCharacters/plus', params, function(json) {
				if (json.result) {
					var usersCharacter = new UsersCharacter(json.usersCharacter);
					Configure.usersCharacters[usersCharacter.character_id] = usersCharacter;
					Configure.updateUsersItems(json.usersItems);
					cc.director.runScene(new  cc.TransitionFade(3, new CharacterScene(usersCharacter.character_id), cc.color(255, 255, 255)));
				} else {
					new MessageBox('エラーが発生しました。');
				}
			});
		}
	},
	
	onBackButtonClick: function(button, type) {
		if (type == 2) {
			cc.director.popScene();
		}
	}
});

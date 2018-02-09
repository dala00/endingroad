var CharactersScene = cc.Scene.extend({
	partyMemberSelect: -1,
	currentParty: 1,
	partyMembers: null,
	scrollView: null,
	scroll: 0,
	
	ctor: function(partyMemberSelect) {
		this._super();
		if (partyMemberSelect != undefined) {
			this.partyMemberSelect = partyMemberSelect;
		}
		var mainUI = new MainUI(this);
		var layer = mainUI.bgLayer;
		
		var winSize = cc.director.getWinSizeInPixels();
		var list = ccui.ScrollView.create();
		this.scrollView = list;
		list.setDirection(ccui.ScrollView.DIR_VERTICAL);
		list.setBounceEnabled(true);
		var height = winSize.height - mainUI.getHeaderHeight();
		var contentHeight = 160 * Math.ceil(1 + (Object.keys(Configure.usersCharacters).length) / 5);
		if (contentHeight < height) {
			contentHeight = height;
		}
		list.setContentSize(winSize.width, height);
		list.setInnerContainerSize(cc.size(winSize.width, contentHeight));
		
		var panel = ccui.Layout.create();
		panel.setPosition(0, contentHeight - height);
		list.addChild(panel, 0, 12);
		
		layer.addChild(list, 10);

		if (Configure.mode == 'Windows') {
			var event = new cc._EventListenerMouse();
			event.onMouseScroll = function(event) {
				var minY = list._contentSize.height - list._innerContainer.getContentSize().height;
				var h = -minY;
				if (h > 0) {
					var current = list._innerContainer.getPositionY() - event.getScrollY();
					var per = (current - minY) * 100 / h;
					list.scrollToPercentVertical(per, 0.1, true);
				}
			};
			cc.eventManager.addListener(event, this);
		}
		
		Configure.setKeyEvent(this);
	},
	
	onEnter: function() {
		this._super();
		var panel = this.scrollView.getChildByTag(12);
		panel.removeAllChildren(true);
		var height = this.scrollView.getContentSize().height;

		var excepts = [];
		var i = 0;
		if (this.partyMemberSelect >= 0) {
			this.currentParty = Communicator.getItem('party', 1);
			var key = 'party' + this.currentParty;
			var partyData = Communicator.getItem(key, ',,,,,');
			this.partyMembers = partyData.split(',');
			if (this.partyMembers[this.partyMemberSelect] != '') {
				var cell = this.createCell('back', '外す', '', '');
				cell.addTouchEventListener(this.onRemovePartyMemberClick, this);
				cell.setPosition(90, height - 80);
				panel.addChild(cell);
				i++;
			}
			for (var j = 0; j < this.partyMembers.length; j++) {
				if (this.partyMembers[j] != '') {
					excepts[this.partyMembers[j]] = true;
				}
			}
		}

		var usersCharacters = this.sortUsersCharacters();
		for (var j = 0; j < usersCharacters.length; j++) {
			var usersCharacter = usersCharacters[j];
			var characterId = usersCharacter.character_id;
			if (excepts[characterId] == undefined) {
				var cell = this.createCell(
						characterId,
						usersCharacter.character.name,
						'LV.' + usersCharacter.level,
						usersCharacter.plus == 0 ? '' : '+' + usersCharacter.plus
				);
				cell.addTouchEventListener(this.onCharacterClick, this);

				var sprite = new CharacterImage(usersCharacter.character);
				sprite.setPosition(80, 100);
				cell.addChild(sprite);

				var attr = Configure.attributes.filter(function (dt, no) {
					return dt.id == usersCharacter.character.attribute;
				})[0];
				var icon = new cc.Sprite('attributes/' + attr.image + '.png');
				icon.setScale(0.5);
				icon.setPosition(20, cell.getContentSize().height - 20);
				cell.addChild(icon);

				var y = height - Math.ceil((i + 1) / 5) * 160;
				cell.setPosition((i % 5) * 169 + 10 + 80, y + 80);

				panel.addChild(cell);
				i++;
			}
		}

		this.scrollView.scrollToPercentVertical(this.scroll, 0.1, true);
	},
	
	sortUsersCharacters: function() {
		var usersCharacters = [];
		for (var i in Configure.usersCharacters) {
			usersCharacters.push(Configure.usersCharacters[i]);
		}
		var rareNo = {N:0, R:1, SR:2, SSR:3};
		usersCharacters.sort(function(a, b) {
			if (a.character.rare == b.character.rare) {
				return a.character.id - b.character.id;
			}
			return rareNo[b.character.rare] - rareNo[a.character.rare];
		});
		return usersCharacters;
	},

	createCell: function(id, name, level, plus) {
		var button = ccui.Button.create();
		button.setTouchEnabled(true);
		button.setScale9Enabled(true);
		button.loadTextures('pipo-CursorBase002.png', null, null);
		button.setSize(cc.size(160, 150));
		button.setName(id);

		var nameLabel = new cc.LabelTTF(name, Configure.font, 16);
		nameLabel.setColor(cc.color(0, 0, 0));
		nameLabel.setPosition(80, 55);
		button.addChild(nameLabel);

		var levelLabel = new cc.LabelTTF(level, Configure.font, 16);
		levelLabel.setColor(cc.color(0, 0, 0));
		levelLabel.setPosition(80, 30);
		button.addChild(levelLabel);

		var plusLabel = new cc.LabelTTF(plus, Configure.font, 16);
		plusLabel.setColor(cc.color(255, 0, 0));
		plusLabel.setPosition(144, 127);
		plusLabel.setHorizontalAlignment(cc.TEXT_ALIGNMENT_RIGHT);
		button.addChild(plusLabel);
		
		return button;
	},
	
	onCharacterClick: function(button, type) {
		if (type == 2) {
			if (this.partyMemberSelect == -1) {
				if (Configure.mode == 'Windows') {
					var minY = this.scrollView._contentSize.height - this.scrollView._innerContainer.getContentSize().height;
					var h = -minY;
					this.scroll = (this.scrollView._innerContainer.getPositionY() - minY) * 100 / h;
				}
				cc.director.pushScene(new cc.TransitionMoveInR(0.25, new CharacterScene(button.name)));
			} else {
				this.changePartyMember(button.name);
			}
		}
	},
	
	onRemovePartyMemberClick: function(button, type) {
		if (type == 2) {
			this.changePartyMember('');
		}
	},
	
	changePartyMember: function(characterId) {
		var key = 'party' + this.currentParty;
		var members = this.partyMembers;
		members[this.partyMemberSelect] = characterId;
		Communicator.setItem(key, members.join(','));
		cc.director.runScene(new cc.TransitionMoveInL(0.25, new PartyScene()));
	},
	
	onKeyReleased: function(key, event) {
		if (key == cc.KEY.escape) {
			if (this.partyMemberSelect >= 0) {
				cc.director.runScene(new cc.TransitionMoveInL(0.25, new PartyScene()));
			} else {
				cc.director.runScene(new cc.TransitionFade(0.25, new StageScene()));
			}
		}
	}
});

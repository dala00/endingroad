var PartyScene = cc.Scene.extend({
	windows: null,
	party: 1,
	slider: null,
	usersCharacters: null,

	ctor:function () {
		this._super();
		var mainUI = new MainUI(this);
		var self = this;
		var winSize = cc.director.getWinSizeInPixels();
		this.windows = [];
		
		this.party = Communicator.getItem('party', 1);
		this.slider = createUI('ui/PartySelect/PartySelect.json', {Label:this.party});
		this.slider.setPosition(0, winSize.height - mainUI.getHeaderHeight() - this.slider.getContentSize().height);
		this.addChild(this.slider);
		
		var slider = this.slider.getChildByName('Slider');
		slider.setPercent(100 / 9 * (this.party - 1));
		slider.addEventListener(this.onSliderChange, this);

		for (i = 0; i < 6; i++) {
			var window = new cc.Scale9Sprite();
			window.initWithFile('pipo-CursorBase002.png', cc.rect(0, 0, 30, 30), cc.rect(10, 10, 10, 10));
			var size = cc.size(
				142, 
				winSize.height - mainUI.getHeaderHeight() - this.slider.getContentSize().height
			);
			window.setContentSize(size);
			window.setPosition(i * 142 + size.width / 2, size.height / 2);

			var ui = createUI('ui/Party/Party.json');
			var button = ui.getChildByName('ChangeButton');
			button.name = i;
			button.addTouchEventListener(this.onChangeButtonClick, this);
			window.addChild(ui);
			
			mainUI.bgLayer.addChild(window, 0);
			this.windows.push(ui);
		}
		this.loadParty();
		
		var touch = cc.EventListener.create({
			event: cc.EventListener.TOUCH_ALL_AT_ONCE,
			swallowTouches: true,                
			onTouchesEnded:function (touches, event) {
				self.onTouchesEnded(touches, event);
			}
		});
		cc.eventManager.addListener(touch, this);
		
		Configure.setKeyEvent(this);
	},
	
	loadParty: function() {
		var usersCharacters = Configure.getPartyMembers(false);
		this.usersCharacters = usersCharacters;
		for (i = 0; i < 6; i++) {
			var ui = this.windows[i];
			var usersCharacter = usersCharacters[i];

			var params = {};
			ui.removeChildByTag(98);
			ui.removeChildByTag(99);
			if (usersCharacter != null) {
				params = {
					Active: {
						Name: usersCharacter.character.name,
						Level: 'LV.' + usersCharacter.level,
						Plus: '',
					}	
				};
				if (usersCharacter.plus > 0) {
					params.Active.Plus = '+' + usersCharacter.plus;
				}
				setUIParameters(ui, params);
				ui.getChildByName('Empty').setVisible(false);
				ui.getChildByName('Active').setVisible(true);
				
				var image = new CharacterImage(usersCharacter.character);
				image.setPosition(ui.getContentSize().width / 2, ui.getContentSize().height - 40);
				ui.addChild(image, 100, 99);

				var attr = Configure.attributes.filter(function (i, no) {
					return i.id == usersCharacter.character.attribute;
				})[0];
				var icon = new cc.Sprite('attributes/' + attr.image + '.png');
				icon.setScale(0.5);
				icon.setPosition(20, ui.getContentSize().height - 20);
				ui.addChild(icon, 100, 98);
			} else {
				ui.getChildByName('Empty').setVisible(true);
				ui.getChildByName('Active').setVisible(false);
			}
		}
	},
	
	onChangeButtonClick: function(button, type) {
		if (type == 2) {
			cc.director.runScene(cc.TransitionMoveInR.create(0.25, new CharactersScene(button.name)));
		}
	},
	
	onTouchesEnded: function(touches, event) {
		for (var i = 0; i < this.windows.length; i++) {
			var window = this.windows[i];
			var rect = window.getBoundingBoxToWorld();
			var windowPos = window.getPosition();
			var pos = touches[0].getLocation();
			if (rect.x <= pos.x && pos.x <= rect.x + rect.width
				&& rect.y <= pos.y && pos.y <= rect.y + rect.height) {
				var usersCharacter = this.usersCharacters[i];
				if (usersCharacter != null) {
					cc.director.pushScene(cc.TransitionMoveInR.create(0.25, new CharacterScene(usersCharacter.character_id)));
				}
				break;
			}
		}
	},
	
	onSliderChange: function(slider, value) {
		var party = Math.round(slider.getPercent() * 9 / 100) + 1;
		if (party != this.party) {
			this.slider.getChildByName('Label').setString(party);
			this.party = party;
			Communicator.setItem('party', party);
			this.loadParty();
		}
	},

	onKeyReleased:function (key, event) {
		if (key == cc.KEY.escape) {
			cc.director.runScene(new cc.TransitionFade(0.25, new StageScene()));
		}
	}
});

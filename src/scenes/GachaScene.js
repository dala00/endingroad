var GachaScene = cc.Scene.extend({
	mainUI: null,
	ui: null,
	resultLayer: null,
	resultNo: 0,
	resultUsersCharacters: null,
	resultPluses: null,

	onEnter:function () {
		this._super();
		this.mainUI = new MainUI(this);
		
		this.ui = createUI('ui/Gacha/Gacha.json');
		var goldPanel = this.ui.getChildByName('PanelKoko');
		var coinPanel = this.ui.getChildByName('PanelCoin');

		var gold1button = goldPanel.getChildByName('ButtonKoko1');
		gold1button.addTouchEventListener(this.onButtonGold1Click, this);

		var gold10button = goldPanel.getChildByName('ButtonKoko10');
		gold10button.addTouchEventListener(this.onButtonGold10Click, this);

		var coin1button = coinPanel.getChildByName('ButtonCoin1');
		coin1button.addTouchEventListener(this.onButtonCoin1Click, this);

		var coin10button = coinPanel.getChildByName('ButtonCoin10');
		coin10button.addTouchEventListener(this.onButtonCoin10Click, this);

		var pieceButton = coinPanel.getChildByName('ButtonPiece');
		pieceButton.addTouchEventListener(this.onButtonTicketClick, this);

		var ticketButton = coinPanel.getChildByName('ButtonTicket');
		ticketButton.addTouchEventListener(this.onButtonTicketClick, this);
		
		coinPanel.getChildByName('GachaRatioButton').addTouchEventListener(this.onGachaRatioButtonClick, this);
		
		if (Configure.mode == 'Android' && Configure.platform == 'mobage') {
			coinPanel.getChildByName('MobacoinButton').addTouchEventListener(this.onMobacoinButtonClick, this);
			coinPanel.getChildByName('TokushouButton').addTouchEventListener(this.onTokushouButtonClick, this);
		} else if (Configure.mode == 'iOS' && Configure.platform == 'mobage') {
			coinPanel.getChildByName('MobacoinButton').addTouchEventListener(this.onMobacoinButtonClick, this);
			coinPanel.getChildByName('TokushouButton').addTouchEventListener(this.onTokushouButtonClick, this);
		} else {
			coinPanel.getChildByName('MobacoinButton').setVisible(false);
			coinPanel.getChildByName('TokushouButton').setVisible(false);
		}
		
		this.updateCoinGachaArea();
		
		this.addChild(this.ui, 0);
		
		//evnet
		var self = this;
		var touch = cc.EventListener.create({
			event: cc.EventListener.TOUCH_ALL_AT_ONCE,
			swallowTouches: true,                
			onTouchesBegan:function (touches, event) {
				self.onTouchesBegan(touches, event);
			}
		});
		cc.eventManager.addListener(touch, this);
		Configure.setKeyEvent(this);
	},
	
	updateCoinGachaArea: function() {
		var coinPanel = this.ui.getChildByName('PanelCoin');
		if (Configure.user.firstGachaDone) {
			coinPanel.getChildByName('CoinGachaMessage').setVisible(false);
			var label = coinPanel.getChildByName('LabelCoin1');
			if (Configure.getDate() == Configure.user.lastGachaDate) {
				label.setString(Configure.paymentItems[100].price.toString() + Configure.coinName);
			} else {
				var text = '1日1回限定! ' + Configure.paymentItems[102].price + Configure.coinName;
				label.setString(text);
			}
		}
		var pieceCount = Configure.usersItems[2] == undefined ? 0 : Configure.usersItems[2].number;
		var ticketCount = Configure.usersItems[3] == undefined ? 0 : Configure.usersItems[3].number;
		var params = {
			LabelPieceCount: '1回5枚 (所持数 ' + pieceCount + '枚)',	
			LabelTicketCount: '1回1枚 (所持数 ' + ticketCount + '枚)'
		};
		setUIParameters(coinPanel, params);
	},	

	onButtonGold1Click: function(button, type) {
		if (type == 2) {
			var scene = this;
			if (Configure.user.gold < 5000) {
				new MessageBox('ココが不足しています。');
				return;
			}
			Communicator.request('payments/normalGacha', {}, function(json) {
				if (json.usersCharacter != null) {
					var usersCharacter = new UsersCharacter(json.usersCharacter);
					Configure.usersCharacters[usersCharacter.character_id] = usersCharacter;
					scene.showResult(json.usersCharacter.character_id);
					scene.mainUI.updateHeader();
				} else if (json.paymentError != undefined) {
					new MessageBox(json.paymentError);
				}
			});
		}
	},

	onButtonGold10Click: function(button, type) {
		if (type == 2) {
			var scene = this;
			if (Configure.user.gold < 50000) {
				new MessageBox('ココが不足しています。');
				return;
			}
			Communicator.request('payments/normalGacha10', {}, function(json) {
				if (json.usersCharacters != null) {
					scene.resultPluses = {};
					for (var i = 0; i < json.usersCharacters.length; i++) {
						var usersCharacter = json.usersCharacters[i];
						if (scene.resultPluses[usersCharacter.character_id] == undefined) {
							scene.resultPluses[usersCharacter.character_id] = 1;
						} else {
							scene.resultPluses[usersCharacter.character_id]++;
						}
					}
					Configure.replaceUsersCharacters(json.usersCharacters);
					scene.resultNo = 0;
					scene.resultUsersCharacters = json.usersCharacters;
					scene.showResult10();
					scene.mainUI.updateHeader();
				} else if (json.paymentError != undefined) {
					new MessageBox(json.paymentError);
				}
			});
		}
	},
	
	onButtonTicketClick: function(button, type) {
		if (type == 2) {
			var scene = this;
			var items = {
				ButtonPiece: {item_id:2, number:5},
				ButtonTicket: {item_id:3, number:1}
			};
			var item = items[button.name];
			if (Configure.usersItems[item.item_id] != undefined && Configure.usersItems[item.item_id].number >= item.number) {
				var params = {item_id: item.item_id};
				Communicator.request('payments/ticketGacha', params, function(json) {
					if (json.paymentError != undefined) {
						new MessageBox(json.paymentError);
					} else {
						var usersCharacter = new UsersCharacter(json.usersCharacter);
						Configure.usersCharacters[usersCharacter.character_id] = usersCharacter;
						Configure.updateUsersItems(json.usersItems);
						scene.showResult(json.gachaCharacterId);
						scene.updateCoinGachaArea();
					}
				});
			} else {
				new MessageBox('アイテムが不足しています。');
			}
		}
	},

	onButtonCoin1Click: function(button, type) {
		if (type == 2) {
			var scene = this;
			if (Configure.user.firstGachaDone == 1) {
				var id = 100;
				if (Configure.getDate() != Configure.user.lastGachaDate) {
					id = 102;
				}
				Payment.start(id, function(json) {
					var usersCharacter = new UsersCharacter(json.usersCharacter);
					Configure.usersCharacters[usersCharacter.character_id] = usersCharacter;
					scene.showResult(json.gachaCharacterId);
					scene.updateCoinGachaArea();
				});
			} else {
				Payment.start(101, function(json) {
					if (json.result) {
						scene.resultPluses = {};
						for (var i = 0; i < json.usersCharacters.length; i++) {
							var usersCharacter = json.usersCharacters[i];
							if (scene.resultPluses[usersCharacter.character_id] == undefined) {
								scene.resultPluses[usersCharacter.character_id] = 1;
							} else {
								scene.resultPluses[usersCharacter.character_id]++;
							}
						}
						Configure.replaceUsersCharacters(json.usersCharacters);
						scene.resultNo = 0;
						scene.resultUsersCharacters = json.usersCharacters;
						scene.showResult10();
						scene.mainUI.updateHeader();
						scene.updateCoinGachaArea();
					}
				});
			}
		}
	},

	onButtonCoin10Click: function(button, type) {
		if (type == 2) {
			if (Configure.user.firstGachaDone == 0) {
				new MessageBox('まずは1回300' + Configure.coinName + 'の初回10連ガチャがおすすめです。');
				return;
			}
			var scene = this;
			Payment.start(110, function(json) {
				if (json.result) {
					scene.resultPluses = {};
					for (var i = 0; i < json.usersCharacters.length; i++) {
						var usersCharacter = json.usersCharacters[i];
						if (scene.resultPluses[usersCharacter.character_id] == undefined) {
							scene.resultPluses[usersCharacter.character_id] = 1;
						} else {
							scene.resultPluses[usersCharacter.character_id]++;
						}
					}
					Configure.replaceUsersCharacters(json.usersCharacters);
					scene.resultNo = 0;
					scene.resultUsersCharacters = json.usersCharacters;
					scene.showResult10();
					scene.mainUI.updateHeader();
				}
			});
		}
	},
	
	showResult: function(characterId) {
		var layer = new cc.Layer();
		var chara = Configure.characters.filter(function(i, no) {return i.id == characterId;})[0];

		var particle = new cc.ParticleSystem('particles/gacha_result.plist');
		particle.setPosition(cc.p(420, 240));
		particle.setAutoRemoveOnFinish(true);
		layer.addChild(particle, 0);

		var params = {
			Name: chara.name,
			Rare: chara.rare
		};
		var ui = createUI('ui/GachaResult/GachaResult.json', params);
		ui.setPosition(320, 140);
		var usersCharacter = Configure.usersCharacters[characterId];
		if (usersCharacter.plus > 0) {
			var labelPlus = ui.getChildByName('LabelPlus');
			var labelPlused = ui.getChildByName('LabelPlused');
			labelPlus.setVisible(true);
			labelPlus.setString('+' + (usersCharacter.plus - 1) + ' >> +' + usersCharacter.plus);
			labelPlused.setVisible(true);
		} else {
			ui.getChildByName('LabelPlus').setVisible(false);
			ui.getChildByName('LabelPlused').setVisible(false);
		}
		
		var image = new CharacterImage(chara);
		image.setPosition(100, 130);
		ui.addChild(image);
		
		layer.addChild(ui, 10);
		this.addChild(layer, 100);
		this.resultLayer = layer;
	},

	onTouchesBegan: function(touches, event) {
		if (this.resultLayer != null) {
			if (this.resultUsersCharacters == null) {
				this.resultLayer.removeFromParent(true);
			} else {
				if (this.resultNo < 9) {
					this.resultNo++;
					this.showResult10();
				} else {
					this.resultUsersCharacters = null;
					this.resultLayer.removeFromParent(true);
				}
			}
		}
	},
	
	showResult10: function() {
		if (this.resultNo == 0) {
			this.resultLayer = new cc.Layer();
			var winSize = cc.director.getWinSizeInPixels();
	
			var particle = new cc.ParticleSystem('particles/gacha_result.plist');
			particle.setPosition(cc.p(winSize.width / 2, winSize.height / 2));
			particle.setAutoRemoveOnFinish(true);
			this.resultLayer.addChild(particle, 0);
	
			var ui = createUI('ui/GachaResult/GachaResult.json');
			ui.setPosition(320, 140);
	
			this.resultLayer.addChild(ui, 10, 25);
			this.addChild(this.resultLayer, 100);
		}
		
		var ui = this.resultLayer.getChildByTag(25);
		var characterId = this.resultUsersCharacters[this.resultNo].character_id;
		var chara = Configure.characters.filter(function(i, no) {return i.id == characterId;})[0];
		var params = {
			Name: chara.name,
			Rare: chara.rare
		};
		setUIParameters(ui, params);
		var usersCharacter = Configure.usersCharacters[characterId];
		var oldPlus = usersCharacter.plus - this.resultPluses[usersCharacter.character_id];
		if (oldPlus >= 0) {
			var labelPlus = ui.getChildByName('LabelPlus');
			var labelPlused = ui.getChildByName('LabelPlused');
			labelPlus.setVisible(true);
			labelPlus.setString('+' + oldPlus + ' >> +' + (oldPlus + 1));
			labelPlused.setVisible(true);
		} else {
			ui.getChildByName('LabelPlus').setVisible(false);
			ui.getChildByName('LabelPlused').setVisible(false);
		}
		this.resultPluses[usersCharacter.character_id]--;

		ui.removeChildByTag(11, true);
		var image = new CharacterImage(chara);
		image.setPosition(100, 130);
		ui.addChild(image, 0, 11);
	},
	
	onGachaRatioButtonClick: function(button, type) {
		if (type == 2) {
			var scene = this;
			var params = {Panel_1:{	
				SSR: Configure.gachaRatio.SSR + '%',
				SR: Configure.gachaRatio.SR + '%',
				R: Configure.gachaRatio.R + '%',
			}};
			var ui = createUI('ui/GachaRatio/GachaRatio.json', params);
			var panel = ui.getChildByName('Panel_1');

			var list = panel.getChildByName('CardList');

			var rares = ['SSR', 'SR', 'R'];
			var tag = 1;
			for (var i = 0; i < rares.length; i++) {
				var label = new ccui.Text();
				label.setFontSize(26);
				label.setFontName(Configure.font);
				label.setColor(cc.color(255, 255, 0));
				label.setString(rares[i]);
				label.tag = tag++;
				list.pushBackCustomItem(label);
				for (var j = 0; j < Configure.characters.length; j++) {
					var chara = Configure.characters[j];
					if (chara.rare == rares[i] && !chara.noGacha) {
						var label = new ccui.Text();
						label.setFontSize(16);
						label.setFontName(Configure.font);
						label.setString(chara.name);
						label.tag = tag++;
						list.pushBackCustomItem(label);
					}
				}
			}
			
			panel.getChildByName('CloseButton').addTouchEventListener(function(button, type) {
				if (type == 2) {
					scene.removeChild(ui, true);
					cc.eventManager.removeListener(cc.EventMouse);
				}
			});

			this.addChild(ui, 100);
			
			if (Configure.mode == 'Windows') {
				var event = new cc._EventListenerMouse();
				event.onMouseScroll = function(event) {
					var minY = list._contentSize.height - list._innerContainer.getContentSize().height;
					var h = -minY;
					var current = list._innerContainer.getPositionY() - event.getScrollY();
					var per = (current - minY) * 100 / h;
					list.scrollToPercentVertical(per, 0.1, true);
				};
				cc.eventManager.addListener(event, this);
			}
		}
	},
	
	onMobacoinButtonClick: function(button, type) {
		if (type == 2) {
			if (Configure.mode == 'Android') {
				jsb.reflection.callStaticMethod(Configure.activity, 'showBankUi', '()V');
			} else if (Configure.mode == 'iOS') {
				jsb.reflection.callStaticMethod(Configure.activity, 'showBankUi');
			}
		}
	},
	
	onTokushouButtonClick: function(button, type) {
		if (type == 2) {
			if (Configure.mode == 'Android') {
				jsb.reflection.callStaticMethod(Configure.activity, 'openLegal', '()V');
			} else if (Configure.mode == 'iOS') {
				jsb.reflection.callStaticMethod(Configure.activity, 'openLegal');
			}
		}
	},

	onKeyReleased:function (key, event) {
		if (key == cc.KEY.escape) {
			cc.director.runScene(new cc.TransitionFade(0.25, new StageScene()));
		}
	}
});

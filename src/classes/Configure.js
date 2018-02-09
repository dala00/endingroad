var Configure = {
	version: '1.0.0',
	fps: 60,
	partyMax: 10,
	baseUrl: '',
	activity: '',
	mode: 'debug',
	platform: 'mobage',
	//platform: 'debug',
	font: 'Arial',
	coinName: 'モバコイン',
	user: null,
	usersCharacters: null,
	usersItems: null,
	
	attributes: null,
	levels: null,
	skills: null,
	stages: null,
	stageLevels: null,
	enemies: null,
	characters: null,
	items: null,
	paymentItems: null,
	news: null,
	newsChecked: null,
	messages: null,
	messageChecked: null,
	
	loadingUI: null,
	loadingId: null,
	
	loadDataCallback: null,
	loadDataFirst: true,
	
	initialize: function() {
		this.baseUrl = 'http://yahoobattle.example.com/';
		
		this.mode = cc.sys.os;
		if (this.mode == 'OS X' || this.mode == 'Linux') {
			this.mode = 'Windows';
		}
		if (window.document != undefined) {
			if (location.host.indexOf('mbga') != -1) {
				this.platform = 'yahoo';
				if (location.host.indexOf('') != -1) {
					gRelease = true;
				}
			} else {
				this.platform = 'debug';
			}
		}
		if (gRelease) {
			this.baseUrl = 'http://endingroad.example.com/';
		}
		
		if (this.mode == 'Android') {
			if (this.platform == 'mobage') {
				this.activity = 'org/cocos2dx/javascript/AppActivity';
			}
		} else if (this.mode == 'iOS') {
			this.activity = 'MobageHelper';
			this.coinName = 'ジェム';
		}
		
		if (cc.sys.os == 'OS X') {
			this.font = 'ヒラギノ角ゴ ProN W3';
		} else {
			this.font = 'メイリオ';
		}
	},
	
	loadCommonData: function(json) {
		if (json.maintenance) {
			cc.director.runScene(new MaintenanceScene(json.message));
			return;
		}
		if (json.version > this.version) {
			cc.director.runScene(new MaintenanceScene('新しいバージョンがリリースされています。更新を行って下さい。'));
			return;
		}
		
		if (json.userFound) {
			this.user = json.user;
			var mainUI = cc.director.getRunningScene().getChildByName('MainUI');
			if (mainUI != null) {
				mainUI.initHp();
				mainUI.updateHeader();
			}
		}
	},
	
	loadData: function(callback) {
		if (this.loadDataFirst) {
			if (this.loadDataCallback == null) {
				this.fps = Math.floor(1 / cc.director.getAnimationInterval());
				
				if (this.mode == 'Android' && this.platform == 'mobage') {
					this.loadDataCallback = callback;
					jsb.reflection.callStaticMethod(this.activity, 'initializeMobage', '(Z)V', gRelease);
					return;
				} else if (this.mode == 'iOS' && this.platform == 'mobage') {
					this.loadDataCallback = callback;
					jsb.reflection.callStaticMethod(this.activity, 'initializeMobage:', gRelease);
					return;
				}
			} else {
				if (callback == 'GOOGLE_ANDROID_MARKET') {
					this.coinName = 'ジェム';
				}
				callback = this.loadDataCallback;
				this.loadDataFirst = false;
				this.loadDataCallback = null;
			}
		}
	
		Communicator.request('menu/getMasterData', null, function(json) {
			if (!json.userFound) {
				callback();
				return;
			}
			var now = (new Date()).getTime();
			Configure.stages = json.stages;
			Configure.paymentItems = json.paymentItems;
			Configure.gachaRatio = json.gachaRatio;
			Configure.news = json.news;
			Configure.newsChecked = now;
			delete json.news;
			Configure.messages = json.messages;
			Configure.messageChecked = now;
			delete json.messages;
			Configure.usersCharacters = {};
			for (var i = 0; i < json.usersCharacters.length; i++) {
				var row = json.usersCharacters[i];
				Configure.usersCharacters[row.character_id] = new UsersCharacter(row);
			}
			Configure.usersItems = [];
			for (var i = 0; i < json.usersItems.length; i++) {
				var row = json.usersItems[i];
				Configure.usersItems[row.item_id] = row;
			}
			
			var resources = [];
			for (var i = 0; i < Configure.characters.length; i++) {
				var path = 'characters/' + Configure.characters[i].image + '.png';
				if (resources.indexOf(path) == -1) {
					resources.push(path);
				}
			}
			for (var i = 0; i < Configure.stages.length; i++) {
				var path = 'bg/' + Configure.stages[i].bg;
				if (resources.indexOf(path) == -1) {
					resources.push(path);
				}
			}
			if (Configure.mode == 'Windows') {
				cc.loader.load(resources, function(err) {
					callback();
				});
			} else {
				cc.LoaderScene.preload(resources, function () {
					callback();
				}, this);
			}
		});
	},
	
	convertToIdedObject: function(rows) {
		var result = {};
		for (var i = 0; i < rows.length; i++) {
			result[rows[i].id] = rows[i];
		}
		return result;
	},
	
	setKeyEvent: function(node) {
		var listener = cc.EventListener.create({
			event: cc.EventListener.KEYBOARD,
			onKeyReleased:function (key, event) {
				node.onKeyReleased(key, event);
			}
		});
		cc.eventManager.addListener(listener, node);
	},
	
	getPartyMembers: function(fix, party) {
		if (fix == undefined) {
			fix = true;
		}
		if (party == undefined) {
			party = Communicator.getItem('party', 1);
		}
		var memberData = Communicator.getItem('party' + party, ',,,,,');
		var members = memberData.split(',');
		var usersCharacters = [];
		for (var i = 0; i < members.length; i++) {
			if (members[i] != '') {
				if (this.usersCharacters[members[i]] != undefined) {
					usersCharacters.push(this.usersCharacters[members[i]]);
				} else {
					if (fix == false) {
						usersCharacters.push(null);
					}
				}
			} else {
				if (fix == false) {
					usersCharacters.push(null);
				}
			}
		}
		return usersCharacters;
	},
	
	updateUsersCharacters: function(usersCharacters) {
		for (var i = 0; i < usersCharacters.length; i++) {
			var row = usersCharacters[i];
			this.usersCharacters[row.character_id].update(row);
		}
	},
	
	replaceUsersCharacters: function(usersCharacters) {
		for (var i = 0; i < usersCharacters.length; i++) {
			var row = new UsersCharacter(usersCharacters[i]);
			this.usersCharacters[row.character_id] = row;
		}
	},
	
	updateUsersItems: function(usersItems) {
		for (var i = 0; i < usersItems.length; i++) {
			this.usersItems[usersItems[i].item_id] = usersItems[i];
		}
	},
	
	findUsersCharacterByBaseId: function(id) {
		for (var i in this.usersCharacters) {
			var usersCharacter = this.usersCharacters[i];
			if (usersCharacter.character.base_id == id) return true;
		}
		return false;
	},
	
	loading: function(id, force) {
		if (this.loadingUI != null && force == undefined) {
			return;
		}
		if (id == undefined) {
			id = null;
		}
		this.loadingId = id;
		this.loadingUI = createUI('ui/Loading/Loading.json');
		var image = this.loadingUI.getChildByName('Loading');
		image.runAction(new cc.RepeatForever(new cc.RotateBy(1, 180)));
		cc.director.getRunningScene().addChild(this.loadingUI, 1000);
	},
	
	loadingEnd: function(id) {
		if (id == undefined) {
			id = null;
		}
		if (id == this.loadingId) {
			cc.director.getRunningScene().removeChild(this.loadingUI, true);
			this.loadingUI = null;
		}
	},
	
	getEventStages: function() {
		var time = this.getDateTime();
		var stages = this.stages.filter(function(i) {
			var match = false;
			if (i.id >= 10000) {
				match = true;
				if (i.start_time != null && i.start_time > time) {
					match = false;
				}
				if (i.end_time != null && i.end_time < time) {
					match = false;
				}
			}
			return match;
		});
		return stages;
	},

	getDate: function() {
		var now = new Date();
		var year = now.getFullYear().toString();
		var month = (now.getMonth() + 1).toString();
		var day = now.getDate().toString();
		if (month.length == 1) {
			month = '0' + month;
		}
		if (day.length == 1) {
			day = '0' + day;
		}
		return year + '-' + month + '-' + day;		
	},

	getSimpleDate: function() {
		var now = new Date();
		var month = (now.getMonth() + 1).toString();
		var day = now.getDate().toString();
		return month + '/' + day;		
	},
	
	getTime: function() {
		var now = new Date();
		var hour = now.getHours().toString();
		var min = now.getMinutes().toString();
		var sec = now.getSeconds().toString();
		if (hour.length == 1) {
			hour = '0' + hour;
		}
		if (min.length == 1) {
			min = '0' + min;
		}
		if (sec.length == 1) {
			sec = '0' + sec;
		}
		return hour + ':' + min + ':' + sec;
	},
	
	getDateTime: function() {
		return this.getDate() + ' ' + this.getTime();
	},
	
	br: function(str) {
		return str.replace(/KAIGYO/g, "\n");
	},
	
	maintenanceFromNative: function(jsonString) {
		var json = JSON.parse(jsonString);
		cc.director.runScene(new MaintenanceScene(json.message));
	},
	
	error: function(jsonString) {
		Configure.loadingEnd('payment');
		var message = 'エラーが発生しました。再度実行するか、時間を開けてからお試し下さい。';
		if (jsonString != undefined) {
			var json = JSON.parse(jsonString);
			if (json.paymentError != undefined) {
				message = json.paymentError;
			}
		}
		new MessageBox(message);
	},
	
	timeout: function() {
		new MessageBox({
			type: 'Ok',
			text: '認証が途切れたためタイトルに戻り再ログインを行います。',
			onOkButtonClick: function() {
				cc.director.runScene(new TitleScene());
			}
		});
	},
	
	debug: function(debugstr, scene) {
		if (scene == undefined) {
			scene = cc.director.getRunningScene();
		}
		var label = scene.getChildByName('DebugLabel');
		if (label == null) {
			label = new cc.LabelTTF('', 'Arial', 10);
			label.setColor(cc.color(255, 255, 255));
			label.enableStroke(cc.color(0, 0, 0), 1);
			label.setHorizontalAlignment(cc.TEXT_ALIGNMENT_LEFT);
			label.setVerticalAlignment(cc.VERTICAL_TEXT_ALIGNMENT_BOTTOM);
			label.setPosition(0, 70);
			label.setAnchorPoint(0, 0);
			label.setName('DebugLabel');
			scene.addChild(label, 50000);
		}
		var str = label.getString();
		if (typeof debugstr == 'object') {
			debugstr = JSON.stringify(debugstr);
		}
		str += debugstr + "\n";
		label.setString(str);
	}
};

Configure.initialize();

var BattleWindow = cc.Scale9Sprite.extend({
	ui: null,
	hp: null,
	skillName: null,
	limit: null,
	chara: null,
	isSkillSelectEnabled: true,

	ctor: function(chara) {
		this._super();
		this.chara = chara;
		this.initWithFile('pipo-WindowBase001.png', cc.rect(0, 0, 30, 30), cc.rect(10, 10, 10, 10));
		this.setContentSize(cc.director.getWinSizeInPixels().width - 640, 120);

		this.ui = ccs.uiReader.widgetFromJsonFile("ui/BattleWindow/BattleWindow.json");
		this.ui.getChildByName('Name').setString(chara.name + ' LV.' + chara.usersCharacter.level);
		this.hp = this.ui.getChildByName('Hp');
		this.updateHp();
		this.skillName = this.ui.getChildByName('SkillName');
		this.skillName.setString('');
		this.limit = this.ui.getChildByName('LimitButton');
		this.limit.setVisible(false);
		this.limit.addTouchEventListener(this.onLimitButtonClick, this);
		chara.window = this;
		
		for (var i = 0; i < chara.skills.length; i++) {
			var button = this.ui.getChildByName('SkillButton' + i);
			button.addTouchEventListener(this.onSkillButtonClick, this);
			this.ui.getChildByName('CT' + i).setVisible(false);
		}
		for (var i = chara.skills.length; i < 3; i++) {
			this.ui.getChildByName('SkillButton' + i).setVisible(false);
			this.ui.getChildByName('CT' + i).setVisible(false);
		}
		this.ui.getChildByName('DetailButton').addTouchEventListener(this.onDetailButtonClick, this);
		
		this.addChild(this.ui, 1);
		
		var image = new CharacterImage(chara.character);
		if (chara.character.scale != 0) {
			image.setScale(chara.character.scale);
		}
		image.setPosition(28, 94);
		this.addChild(image, 2);
	},
	
	updateHp: function() {
		this.hp.setString('' + this.chara.hp + ' / ' + this.chara.maxHp);
	},
	
	showLimitButton: function(show) {
		this.limit.setVisible(show);
	},
	
	enableSkillButton: function(no, show) {
		var button = this.ui.getChildByName('SkillButton' + no);
		button.setOpacity(show ? 255 : 64);
		button.setEnabled(show);
		this.ui.getChildByName('CT' + no).setVisible(!show);
	},
	
	updateCT: function() {
		for (var i = 0; i < this.chara.skills.length; i++) {
			var skill = this.chara.skills[i];
			this.ui.getChildByName('CT' + i).setString(this.chara.ct[skill.id]);
		}
	},
	
	setSkillSelectEnabled: function(enabled) {
		this.isSkillSelectEnabled = enabled;
	},
	
	onLimitButtonClick: function(button, type) {
		if (type == 2) {
			if (this.isSkillSelectEnabled) {
				var skill = this.chara.selectSkill('limit');
				this.skillName.setString(skill == null ? '' : skill.name);
			}
		}
	},
	
	onSkillButtonClick: function(button, type) {
		if (type == 2) {
			if (this.isSkillSelectEnabled) {
				var no = Number(button.name.replace('SkillButton', ''));
				var skill = this.chara.selectSkill(no);
				this.skillName.setString(skill == null ? '' : skill.name);
			}
		}
	},
	
	onDetailButtonClick: function(button, type) {
		if (type == 2) {
			cc.director.pushScene(cc.TransitionMoveInR.create(0.25, new CharacterScene(this.chara.usersCharacter.character_id, true)));
		}
	}
});

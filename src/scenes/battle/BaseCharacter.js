var BaseCharacter = cc.Node.extend({
	sprite: null,
	name: '',
	attr: '',
	hp: 0,
	maxHp: 0,
	attack: 0,
	defence: 0,
	limit: 0,
	died: false,
	direction: -1,
	skills: null,
	skill: null,
	buffs: null,
	buffIconNo: -1,
	
	image: '',
	imageWidth: 32,
	imageHeight: 32,
	imageScale: 1.0,
	imageCol: null,
	imageRow: null,
	animationCount: 0,
	nodeGrid: null,
	label: null,
	
	fadeInCount: 0,
	
	ctor: function() {
		this._super();
		this.sprite = new cc.Sprite();
		this.addChild(this.sprite);
		this.buffs = [];
		this.sprite.setOpacity(0);
		this.scheduleUpdate();
	},
	
	update: function (dt) {
		if (this.fadeInCount < Configure.fps) {
			this.sprite.setOpacity(255 * this.fadeInCount / Configure.fps);
			this.fadeInCount++;
		} else {
			this.sprite.setOpacity(255);
			this.unscheduleUpdate();
		}
	},
	
	createLabel: function() {
		this.label = ccs.uiReader.widgetFromJsonFile("ui/BattleLabel/BattleLabel.json");
		var size = this.label.getContentSize();
		this.addChild(this.label, 500);
		
		var name = this.label.getChildByName('Name');
		name.setString(this.name);
		//release環境では動作する
		name.enableOutline(cc.color(0, 0, 0), 2);
		
		var image = this.label.getChildByName('Attribute');
		image.setPositionX(-name.width / 2 - 6);
		var attr = this.attr;
		var attribute = Configure.attributes.filter(function(i, index) {return i.id == attr;})[0];
		image.loadTexture('attributes/' + attribute.image + '.png');
		
		if (this.imageHeight != 32 && this.sprite.getScale() == 1) {
			var size = this.label.getContentSize();
			var offset = (this.imageHeight - 32) / 2;
			var children = this.label.getChildren();
			for (var i = 0; i < children.length; i++) {
				var child = children[i];
				if (child.name == 'Attribute' || child.name == 'Name') {
					child.setPositionY(child.getPositionY() - offset);
				} else {
					child.setPositionY(child.getPositionY() + offset);
				}
			}
		}
		this.label.getChildByName('Limit').setScaleX(0);
	},
	
	createNodeGrid: function() {
		this.nodeGrid = new cc.NodeGrid();
		this.nodeGrid.addChild(this);
		return this.nodeGrid;
	},
	
	initializeAnimation: function(image) {
		this.image = image;
		this.setDirection(0);
	},
	
	calcDamage: function(defencer, attackSkill) {
		var damage = this.attack - defencer.defence / 2;
		var ratio = random(95, 105) / 100;
		
		if (attackSkill != undefined) {
			ratio += attackSkill.value;
		}
		
		//attribute
		var attr = this.attr;
		var attackAttr = Configure.attributes.filter(function(i, index) {return i.id == attr;})[0];
		if (attackAttr.win == defencer.attr) {
			ratio += 0.5;
		} else if (attackAttr.lose == defencer.attr) {
			ratio -= 0.25;
		}
		
		//skill
		if (this.skill != null) {
			if (this.skill.effect == 'attackUp') {
				ratio += this.skill.value;
			}
		}

		//attcker buff
		for (var i = 0; i < this.buffs.length; i++) {
			var buff = this.buffs[i];
			if (this.isAttackUpBuff(buff.effect)) {
				ratio += buff.value;
			}
			if (buff.effect == 'attackDownAll') {
				ratio -= buff.value;
			}
		}

		//defencer buff
		for (var i = 0; i < defencer.buffs.length; i++) {
			var buff = defencer.buffs[i];
			if (buff.effect == 'defenceUpAll') {
				ratio -= buff.value;
			}
			if (buff.effect == 'defenceDownAll') {
				ratio += buff.value;
			}
		}
		
		damage = Math.floor(damage * ratio);
		if (damage <= 0) {
			damage = 1;
		}
		return damage;
	},
	
	calcHeal: function(member) {
		var heal = this.attack * this.skill.value;
		return heal;
	},
	
	damage: function(damage) {
		this.hp -= damage;
		if (this.hp <= 0) {
			this.hp = 0;
			this.died = true;
		}
		this.updateHpGauge();
		this.cure('sleep');
		return this.hp;
	},
	
	heal: function(heal) {
		this.hp += heal;
		if (this.hp > this.maxHp) {
			this.hp = this.maxHp;
		}
		this.updateHpGauge();
		return this.hp;
	},
	
	cure: function(effect) {
		var old = this.buffs;
		this.buffs = [];
		for (var i = 0; i < old.length; i++) {
			var buff = old[i];
			var del = false;
			if (effect == undefined) {
				var skillEffect = Configure.skillEffects.filter(function (i, no) {
					return i.id == buff.effect;
				})[0];
				if (skillEffect.type == 'debuff') {
					del = true;
				}
			} else {
				if (buff.effect == effect) {
					del = true;
				}
			}
			if (!del) {
				this.buffs.push(buff);
			}
		}
	},
	
	isAttackUpBuff: function(effect) {
		var buffs = ['attackUpAll', 'fireUpAll', 'waterUpAll', 'groundUpAll',
		    'lightUpAll', 'darkUpAll', 'magicUpAll'];
		for (var i = 0; i < buffs.length; i++) {
			if (buffs[i] == effect) return true;
		}
		return false;
	},
	
	isUsingBuffSkill: function() {
		if (this.skill != null) {
			var effect = this.skill.effect;
			var skillEffect = Configure.skillEffects.filter(function(i, no) {
				return i.id == effect;
			})[0];
			return skillEffect.type == 'buff';
		}
		return false;
	},
	
	isUsingDebuffSkill: function() {
		if (this.skill != null) {
			var effect = this.skill.effect;
			var skillEffect = Configure.skillEffects.filter(function(i, no) {
				return i.id == effect;
			})[0];
			return skillEffect.type == 'debuff';
		}
		return false;
	},
	
	isUsingAttackSkill: function() {
		if (this.skill != null) {
			var effects = [
               'fire', 'water', 'ground', 'light', 'darkAttack', 'magic',
               'fireAll', 'waterAll', 'groundAll', 'lightAll', 'darkAttackAll', 'magicAll'
			];
			for (var i = 0; i < effects.length; i++) {
				if (effects[i] == this.skill.effect) {
					return true;
				}
			}
		}
		return false;
	},
	
	isSkillForMember: function() {
		if (this.skill != null) {
			if (this.isUsingBuffSkill) {
				return true;
			}
			var effects = ['heal'];
			for (var i = 0; i < effects.length; i++) {
				if (effects[i] == this.skill.effect) {
					return true;
				}
			}
		}
		return false;
	},
	
	isActionDisable: function() {
		for (var i = 0; i < this.buffs.length; i++) {
			var buff = this.buffs[i];
			var skillEffect = Configure.skillEffects.filter(function (i, no) {return i.id == buff.effect;})[0];
			if (skillEffect.actionDisable) {
				return true;
			}
		}
		return false;
	},
	
	selectLimitSkill: function(name) {
		var skillEffect = Configure.skillEffects.filter(function (i, no) {return i.id == 'attackUp';})[0];
		this.skill = {
			id: 'limit',
			name: name,
			effect: 'attackUp',
			value: 1.0,
			effectImage: skillEffect.image
		};
	},
	
	addBuff: function(chara, force) {
		if (this.isAttackUpBuff(chara.skill.effect)) {
			var attrBuff = this.attr + 'UpAll';
			if (chara.skill.effect != 'attackUpAll' && chara.skill.effect != attrBuff) {
				return false;
			}
		}
		if (force == undefined && chara.skill.ratio != '') {
			if (random(0, 99) >= chara.skill.ratio) {
				return false;
			}
		}
		var buff = {
			effect: chara.skill.effect,
			value: chara.skill.value,
			turnLeft: chara.skill.turn,
			user: chara
		};
		this.buffs.push(buff);
		return true;
	},
	
	buffExists: function(effect) {
		for (var i = 0; i < this.buffs.length; i++) {
			if (this.buffs[i].effect == effect) return true;
		}
		return false;
	},
	
	progressBuffTurn: function() {
		var damages = [];
		var old = this.buffs;
		this.buffs = [];
		for (var i = 0; i < old.length; i++) {
			var buff = old[i];
			if (--buff.turnLeft > 0) {
				this.buffs.push(buff);
			} else {
				if (buff.effect == 'hide') {
					this.sprite.runAction(new cc.FadeTo(0.5, 255));
				}
			}
			if (buff.effect == 'poison') {
				var damage = Math.floor(buff.user.attack * buff.value);
				this.damage(damage);
				var row = {
					damage: damage,
					color: cc.color(127, 0, 127)
				};
				damages.push(row);
			}
		}
		
		return damages;
	},
	
	isHit: function(target) {
		var ratio = 1.0;
		for (var i = 0; i < this.buffs.length; i++) {
			var buff = this.buffs[i];
			if (buff.effect == 'dark') {
				ratio -= buff.value;
			}
		}
		ratio *= 100;
		return (random(0, 100) <= ratio);
	},
	
	showBuffIcon: function(start) {
		if (this.buffs.length > 0) {
			var execute = false;
			if (start == undefined) {
				if (this.buffIconNo == -1) {
					execute = true;
				}
			} else {
				execute = true;
			}
			if (execute) {
				if (++this.buffIconNo >= this.buffs.length) {
					this.buffIconNo = 0;
				}
				var buff = this.buffs[this.buffIconNo];
				var icons = {
					attackUpAll: ['icon002.png', 180],
					fireUpAll: ['icon002.png', 180],
					waterUpAll: ['icon002.png', 180],
					groundUpAll: ['icon002.png', 180],
					lightUpAll: ['icon002.png', 180],
					darkUpAll: ['icon002.png', 180],
					magicUpAll: ['icon002.png', 180],
					attackDownAll: ['icon002.png', 183],
					defenceUpAll: ['icon010.png', 180],
					defenceDownAll: ['icon010.png', 183],
					dark: [45],
					poison: [36],
					skillDisable: [39],
					sleep: [50],
					paralyze: [123],
					hide: ['icon010.png']
				};
				var sprite = this.createBuffIcon(icons[buff.effect][0]);
				var scale = sprite.getScale();
				for (var i = 1; i < icons[buff.effect].length; i++) {
					var child = this.createBuffIcon(icons[buff.effect][i]);
					child.setPosition(16 * i + 8, 8);
					child.setScale(child.getScale() / scale);
					sprite.addChild(child);
				}
				sprite.setPosition(16, -16);
				this.addChild(sprite);
				sprite.runAction(
					new cc.Sequence(
						new cc.JumpBy(0.5, cc.p(0, 0), 5, 1),
						new cc.DelayTime(0.5),
						new cc.CallFunc(this.showBuffIcon, this),
						new cc.RemoveSelf(true)
					)
				);
			}
		} else {
			this.buffIconNo = -1;
		}
	},
	
	createBuffIcon: function(image) {
		var sprite;
		if (typeof image == 'string') {
			sprite = new cc.Sprite('icons/' + image);
			var scale = 16 / 20;
			sprite.setScale(scale);
		} else {
			var rect = cc.rect(
				(image % 30) * 32,
				Math.floor(image / 30) * 32,
				32, 32
			)
			sprite = new cc.Sprite('icons/pipo-emotion.png', rect);
			sprite.setScale(0.5);
		}
		return sprite;
	},
	
	isWithin: function(attacker) {
		var dx = this.x - attacker.x;
		var dy = this.y - attacker.y;
		var length = this.getRadius() + attacker.getRadius();
		return (length * length >= (dx * dx) + (dy * dy));
	},
	
	addLimit: function(add) {
		var old = this.limit;
		this.limit += add;
		if (this.limit > 100) {
			this.limit = 100;
		}
		if (old < 100 && this.limit == 100) {
			var particle = new cc.ParticleSystem('particles/limit.plist');
			particle.setPosition(0, 0);
			this.addChild(particle, 100, 12);
		}
		this.updateLimitGauge();
		return this.limit;
	},
	
	getAbsorbPosition: function(absorber) {
		var dx = this.x - absorber.x;
		var dy = this.y - absorber.y;
		var distance = absorber.skill.value;
		var pos;
		if (dx * dx + dy * dy < distance * distance) {
			pos = absorber.getPosition();
		} else {
			var dx = absorber.x - this.x;
			var dy = absorber.y - this.y;
			var rad = Math.atan2(dy, dx);
			var x = this.x + Math.floor(distance * Math.cos(rad));
			var y = this.y + Math.floor(distance * Math.sin(rad));
			var pos = cc.p(x, y);
		}
		return pos;
	},
	
	setDirection: function(dir) {
		if (this.imageRow !== null) {
			dir = this.imageRow;
		} else if (this.imageCol !== null) {
			dir = this.imageCol;
		}
			
		if (dir != this.direction) {
			this.direction = dir;
			var filename = 'characters/' + this.image + '.png';
			var frames = [];
			var animation = new cc.Animation();
			
			if (this.imageRow != null) {
				var y = this.imageRow * this.imageHeight;
				for (var i = 0; i < this.animationCount; i++) {
					var rect = cc.rect(i * this.imageWidth, y, this.imageWidth, this.imageHeight);
					var frame = new cc.SpriteFrame(filename, rect);
					animation.addSpriteFrame(frame);
				}
			} else if (this.imageCol != null) {
				var x = this.imageCol * this.imageWidth;
				for (var i = 0; i < this.animationCount; i++) {
					var rect = cc.rect(x, i * this.imageHeight, this.imageWidth, this.imageHeight);
					var frame = new cc.SpriteFrame(filename, rect);
					animation.addSpriteFrame(frame);
				}
			} else {
				for (var i = 0; i < 3; i++) {
					var rect = cc.rect(i * this.imageWidth, dir * this.imageHeight, this.imageWidth, this.imageHeight);
					frames[i] = new cc.SpriteFrame(filename, rect);
				}
				animation.addSpriteFrame(frames[1]);
				animation.addSpriteFrame(frames[0]);
				animation.addSpriteFrame(frames[1]);
				animation.addSpriteFrame(frames[2]);
			}
			animation.setDelayPerUnit(0.5);
			var action = cc.RepeatForever.create(cc.Animate.create(animation));
			this.sprite.stopAllActions();
			this.sprite.runAction(action);
		}
	},
	
	setDirectionByPosition: function(pos) {
		if (Math.abs(pos.x - this.x) > Math.abs(pos.y - this.y)) {
			this.setDirection(pos.x > this.x ? 2 : 1);
		} else {
			this.setDirection(pos.y > this.y ? 3 : 0);
		}
	},

	updateHpGauge: function() {
		var hp = this.label.getChildByName('Hp');
		hp.setScaleX(this.hp / this.maxHp);
	},

	updateLimitGauge: function() {
		var limit = this.label.getChildByName('Limit');
		limit.setScaleX(this.limit / 100);
	},
	
	revive: function() {
		this.hp = this.maxHp;
		this.limit = 0;
		this.died = false;
		this.buffs = [];
		this.skill = null;
		this.buffIconNo = -1;
		this.updateHpGauge();
		this.updateLimitGauge();
	},
	
	getRadius: function() {
		var radius = (this.imageWidth + this.imageHeight) / 4;
		radius *= this.imageScale;
		radius += 2;
		return Math.floor(radius);
	},
	
	disappear: function() {
		this.runAction(new cc.Sequence(
			new cc.FadeOut(0.5),
			new cc.Hide()
		));
		if (Configure.mode != 'Windows') {
			this.nodeGrid.runAction(new cc.Sequence(
				new cc.ShakyTiles3D(1, cc.size(16, 16), 4, false),
				new cc.StopGrid()
			));
		}
		Sound.se('sounds/bigshot1.wav');
	}
});

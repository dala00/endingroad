function UsersCharacter(rawdata) {
	this.update(rawdata);
}

UsersCharacter.prototype = {
	character: null,
	level: 1,
	hp: 0,
	attack: 0,
	defence: 0,
		
	update: function(rawdata) {
		for (var i in rawdata) {
			this[i] = rawdata[i];
		}
		this.level = this.getLevel(rawdata.experience);
		this.character = Configure.characters.filter(function(i, no){return i.id == rawdata.character_id;})[0];
		this.hp = this.calcStatus(this.character.minHp, this.character.maxHp);
		this.attack = this.calcStatus(this.character.minAttack, this.character.maxAttack);
		this.defence = this.calcStatus(this.character.minDefence, this.character.maxDefence);
		if (this.plus > 0) {
			this.hp += 10 * this.plus;
			this.attack += 2 * this.plus;
			this.defence += 2 * this.plus;
		}
	},

	getLevel: function(experience) {
		for (var i = 0; i < Configure.levels.length; i++) {
			var row = Configure.levels[i];
			if (row.experience > experience) {
				return row.id - 1;
			}
		}
		return Configure.levels[Configure.levels.length - 1].id;
	},
	
	getExperienceForLevel: function(level) {
		for (var i = 0; i < Configure.levels.length; i++) {
			var row = Configure.levels[i];
			if (row.id == level) {
				return row.experience;
			}
		}
		return 0;
	},
	
	calcStatus: function(minValue, maxValue) {
		var power = minValue;
		power += Math.floor((maxValue - minValue) * (this.level - 1) / 99);
		return power;
	}
};

var Sound = {
	enabled: true,
	currentBgm: null,
	releaseWhenStop: false,
	
	initialize: function() {
		this.enabled = Communicator.getItem('soundEnabled', '1') == '1';
	},
	
	bgm: function(resource, releaseWhenStop, force) {
		if (cc.sys.browserType == 'ie' || Configure.mode == 'iOS') {
			resource = resource.replace('.ogg', '.mp3');
		}

		if (Configure.mode == 'Windows') {
			releaseWhenStop = false;
		}
		if (resource == this.currentBgm && force == undefined) return;
		if (this.enabled) {
			if (force == undefined) {
				this.bgmStop();
			}
			cc.audioEngine.playMusic(this.getPath(resource), true);
		}
		this.currentBgm = resource;
		this.releaseWhenStop = releaseWhenStop;
	},
	
	bgmStop: function() {
		if (this.currentBgm != null) {
			cc.audioEngine.stopMusic(this.releaseWhenStop);
		}
	},
	
	se: function(resource) {
		if (this.enabled) {
			cc.audioEngine.playEffect(this.getPath(resource), false);
		}
	},
	
	setEnabled: function(enabled) {
		this.enabled = enabled;
		Communicator.setItem('soundEnabled', enabled ? '1' : '0');
		if (enabled) {
			this.bgm(this.currentBgm, this.releaseWhenStop, true);
		} else {
			if (cc.audioEngine.isMusicPlaying()) {
				cc.audioEngine.pauseMusic();
			}
		}
	},
	
	getEnabled: function() {
		return this.enabled;
	},
	
	getPath: function(path) {
		path = cc.loader.resPath + '/' + path;
		return path;
	}
};

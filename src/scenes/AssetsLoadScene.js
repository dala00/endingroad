var AssetsLoadScene = cc.Scene.extend({
	percent: 0,
	percentLabel: null,
	dbgLabel: null,
	gauge: null,

	onEnter: function() {
		this._super();
		
		if (cc.sys.os != 'Android' && cc.sys.os != 'iOS') {
			if (location.host == '127.0.0.1:8000' || location.host == 'cocosbattle.example.com') {
				this.runNextScene();
			} else {
				cc.LoaderScene.preload(g_resources, function () {
					cc.director.runScene(new TitleScene());
				}, true);
			}
			return;
		}
		
		var label = new cc.LabelTTF('', 'Arial', 20);
		label.setColor(cc.color(255, 255, 255));
		label.setPosition(cc.winSize.width / 2, cc.winSize.height / 3);
		label.setHorizontalAlignment(cc.TEXT_ALIGNMENT_CENTER);
		this.addChild(label, 1);
		this.percentLabel = label;
		
		this.loadAssets();
	},
	
	runNextScene: function() {
		var scene = this;
        cc.loader.loadJs(["src/assets.js"], function(){
            cc.loader.loadJs(jsAssets, function(){
            	cc.LoaderScene.preload(g_resources, function () {
            		cc.director.runScene(new TitleScene());
            	}, true);
			});
		});
	},
	
	loadAssets: function() {
		var storagePath = jsb.fileUtils ? jsb.fileUtils.getWritablePath() : "/";
		var manifestFilename = '';
		if (cc.sys.os == 'Android') {
			manifestFilename = gRelease ? 'project.manifest' : 'project_dev.manifest';
		} else if (cc.sys.os == 'iOS') {
			manifestFilename = gRelease ? 'project_ios.manifest' : 'project_ios_dev.manifest';
		}
		var manager = new jsb.AssetsManager(manifestFilename, storagePath);
		manager.retain();
		
		if (!manager.getLocalManifest().isLoaded()) {
			cc.log("Fail to update assets, step skipped.");
			this.showError(1);
		} else {
			var failedCount = 0;
			var scene = this;
			var listener = new jsb.EventListenerAssetsManager(manager, function(event) {
				switch (event.getEventCode())
				{
				case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
					cc.log("No local manifest file found, skip assets update.");
					scene.showError(2);
					break;
				case jsb.EventAssetsManager.UPDATE_PROGRESSION:
					scene.percent = event.getPercent();
					var filePercent = event.getPercentByFile();
					cc.log("Download percent : " + scene.percent + " | File percent : " + filePercent);
					scene.updateProgress();
					break;
				case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
				case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST:
					cc.log("Fail to download manifest file, update skipped.");
					scene.showError(3);
					break;
				case jsb.EventAssetsManager.ALREADY_UP_TO_DATE:
					manager.release();
					scene.runNextScene();
					break;
				case jsb.EventAssetsManager.UPDATE_FINISHED:
					cc.log("Update finished.");
					var searchPaths = manager.getLocalManifest().getSearchPaths();
					cc.sys.localStorage.setItem("appSearchPaths", JSON.stringify(searchPaths));
					jsb.fileUtils.setSearchPaths(searchPaths);
					manager.release();
					scene.runNextScene();
					break;
				case jsb.EventAssetsManager.UPDATE_FAILED:
					cc.log("Update failed. " + event.getMessage());
					if (++failedCount < 5) {
						manager.downloadFailedAssets();
					} else {
						scene.showError('4,' + event.getMessage());
					}
					break;
				case jsb.EventAssetsManager.ERROR_UPDATING:
					cc.log("Asset update error: " + event.getAssetId() + ", " + event.getMessage());
					scene.showError("5," + event.getAssetId() + ", " + event.getMessage());
					break;
				case jsb.EventAssetsManager.ERROR_DECOMPRESS:
					cc.log(event.getMessage());
					scene.showError(event.getMessage());
					break;
				default:
					break;
				}
			});
			cc.eventManager.addListener(listener, 1);
			manager.update();
//			this.schedule(this.updateProgress, 0.5);
		}
	},
	
	updateProgress: function() {
		if (this.gauge == null) {
			var rect = cc.rect(0, 0, cc.winSize.width / 2, 30);
			var pos = cc.p(cc.winSize.width / 2 - rect.width / 2, cc.winSize.height / 3 - 60);
			var gaugeBg = new cc.Sprite();
			gaugeBg.setColor(cc.color(128, 128, 128));
			gaugeBg.setTextureRect(rect);
			gaugeBg.setAnchorPoint(0, 0);
			gaugeBg.setPosition(pos);
			this.addChild(gaugeBg, 2);

			this.gauge = new cc.Sprite();
			this.gauge.setColor(cc.color(0, 0, 255));
			this.gauge.setTextureRect(rect);
			this.gauge.setAnchorPoint(0, 0);
			this.gauge.setPosition(pos);
			this.gauge.setScaleX(0);
			this.addChild(this.gauge, 3);
		}
		this.percentLabel.setString('Downloading... ' + Math.floor(this.percent) + ' %');
		this.gauge.setScaleX(this.percent / 100);
	},
	
	showError: function(error) {
		var message = "エラーが発生しました。時間をあけてからお試し下さい。\n";
		message += '(ERROR:' + error + ')';
		this.percentLabel.setString(message);
	}
});

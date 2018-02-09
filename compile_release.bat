move src\release.js src\release_false.js
move src\release_true.js src\release.js
call cocos compile -p android -m release
move src\release.js src\release_true.js
move src\release_false.js src\release.js

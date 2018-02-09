move project.json project.native.json
move project.web.json project.json
call cocos compile -p web -m release
move project.json project.web.json
move project.native.json project.json

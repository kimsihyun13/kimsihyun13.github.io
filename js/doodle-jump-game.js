const GAME_CONFIG = {
  width: 375,
  height: 500,
  gravity: 700,
  jumpPower: 450,
  moveSpeed: 200,
  platformSpacing: 70
};

const ASSETS = {
  background:"https://cdn-game-mcp.gambo.ai/c3fddd74-f57b-4263-b4c9-2eaf874961c7/images/refined_notebook_grid_background.png",
  player:"https://cdn-game-mcp.gambo.ai/63eb673b-c1c0-4c91-9b56-f4c500793223/images/small_doodle_creature_idle.png",
  normalPlatform:"https://cdn-game-mcp.gambo.ai/938f4e00-e912-4bf6-a33f-9af5d5e4ca90/images/uniform_doodle_normal_platform.png",
  breakingPlatform:"https://cdn-game-mcp.gambo.ai/162dd194-6dd7-43fc-b3eb-1eda40f2d9cc/images/cracked_doodle_platform.png",
  movingPlatform:"https://cdn-game-mcp.gambo.ai/e581265e-35e5-4653-9610-cad191a00286/images/uniform_doodle_moving_platform.png",
  springPlatform:"https://cdn-game-mcp.gambo.ai/d8682bc8-0cf9-45e4-a33d-867532ffc196/images/purple_doodle_spring_platform.png",
  springPlatformCompressed:"https://cdn-game-mcp.gambo.ai/852863f2-0907-452b-8566-1357ec339e61/images/purple_spring_platform_compressed.png"
};

class DoodleJumpScene extends Phaser.Scene{

constructor(){
super({key:'DoodleJumpScene'})
}

preload(){
for(let key in ASSETS){
this.load.image(key,ASSETS[key])
}
}

create(){

this.gameOver=false
this.score=0
this.highestY=0
this.lastPlatformY=GAME_CONFIG.height-50

// 배경
this.add.image(
GAME_CONFIG.width/2,
GAME_CONFIG.height/2,
"background"
)
.setDisplaySize(GAME_CONFIG.width,GAME_CONFIG.height)
.setScrollFactor(0)

// 그룹
this.platforms=this.add.group()

// 플레이어
this.createPlayer()

// 시작 발판
this.createPlatform(GAME_CONFIG.width/2,GAME_CONFIG.height-50,'normal')

for(let i=1;i<=6;i++){
const y=GAME_CONFIG.height-50-(i*GAME_CONFIG.platformSpacing)
const x=Phaser.Math.Between(60,GAME_CONFIG.width-60)
this.createPlatform(x,y,'normal')
this.lastPlatformY=y
}

// 키 입력
this.cursors=this.input.keyboard.createCursorKeys()

// 충돌
this.physics.add.overlap(this.player,this.platforms,this.platformCollision,null,this)

}

createPlayer(){

this.player=this.physics.add.sprite(
GAME_CONFIG.width/2,
GAME_CONFIG.height-150,
'player'
)

this.player.setScale(0.1)
this.player.setOrigin(0.5,1)
this.player.body.setGravityY(GAME_CONFIG.gravity)

}

createPlatform(x,y,type){

const map={
normal:'normalPlatform',
breaking:'breakingPlatform',
moving:'movingPlatform',
spring:'springPlatform'
}

const platform=this.physics.add.sprite(x,y,map[type])

platform.setScale(0.15)
platform.body.setAllowGravity(false)
platform.body.setImmovable(true)

platform.platformType=type
platform.hasBeenStepped=false

if(type==='moving'){
platform.body.setVelocityX(80)
}

this.platforms.add(platform)

}

platformCollision(player,platform){

if(player.body.velocity.y>0 && player.y<platform.y){

switch(platform.platformType){

case 'normal':
case 'moving':
this.jump()
break

case 'breaking':

if(!platform.hasBeenStepped){

platform.hasBeenStepped=true
this.jump()

this.time.delayedCall(100,()=>{
platform.destroy()
})

}

break

case 'spring':

player.body.setVelocityY(-GAME_CONFIG.jumpPower*1.6)

platform.setTexture('springPlatformCompressed')

this.time.delayedCall(200,()=>{
if(platform.active){
platform.setTexture('springPlatform')
}
})

break

}

}

}

jump(){
this.player.body.setVelocityY(-GAME_CONFIG.jumpPower)
}

update(){

if(this.gameOver) return

this.updateMovement()
this.updateCamera()
this.generatePlatforms()
this.updatePlatforms()
this.checkFall()

// 바닥 닿으면 죽음
if(this.player.y>=GAME_CONFIG.height-5){
this.triggerGameOver()
}

}

updateMovement(){

if(this.cursors.left.isDown){
this.player.body.setVelocityX(-GAME_CONFIG.moveSpeed)
}
else if(this.cursors.right.isDown){
this.player.body.setVelocityX(GAME_CONFIG.moveSpeed)
}
else{
this.player.body.setVelocityX(0)
}

// 좌우 순간이동
if(this.player.x<0) this.player.x=GAME_CONFIG.width
if(this.player.x>GAME_CONFIG.width) this.player.x=0

}

updateCamera(){

if(this.player.y < this.cameras.main.scrollY + GAME_CONFIG.height/2){
this.cameras.main.scrollY = this.player.y - GAME_CONFIG.height/2
}

}

generatePlatforms(){

while(this.lastPlatformY > this.cameras.main.scrollY - 100){

this.lastPlatformY -= GAME_CONFIG.platformSpacing

const x = Phaser.Math.Between(50,GAME_CONFIG.width-50)

const type = this.getPlatformType()

this.createPlatform(x,this.lastPlatformY,type)

}

}

getPlatformType(){

const r=Phaser.Math.Between(1,100)

if(r<60) return 'normal'
if(r<80) return 'breaking'
if(r<95) return 'moving'
return 'spring'

}

updatePlatforms(){

this.platforms.children.each(p=>{

if(p.platformType==='moving'){

if(p.x<30) p.body.setVelocityX(80)
if(p.x>GAME_CONFIG.width-30) p.body.setVelocityX(-80)

}

})

}

checkFall(){

if(this.player.y > this.cameras.main.scrollY + GAME_CONFIG.height + GAME_CONFIG.platformSpacing*7){
this.triggerGameOver()
}

}

triggerGameOver(){

if(this.gameOver) return

this.gameOver=true

const centerX = GAME_CONFIG.width/2
const centerY = this.cameras.main.scrollY + GAME_CONFIG.height/2

this.add.rectangle(
centerX,
centerY,
GAME_CONFIG.width,
GAME_CONFIG.height,
0x000000,
0.6
)

this.add.text(
centerX,
centerY-40,
"GAME OVER",
{
fontSize:"36px",
fill:"#ff4444",
stroke:"#ffffff",
strokeThickness:6
}
).setOrigin(0.5)

const restartButton = this.add.text(
centerX,
centerY+40,
"다시 시작",
{
fontSize:"24px",
backgroundColor:"#ffffff",
color:"#000000",
padding:{x:20,y:10}
}
)
.setOrigin(0.5)
.setInteractive()

restartButton.on("pointerdown",()=>{
this.scene.restart()
})

}

}

const gameConfig={
type:Phaser.AUTO,
width:GAME_CONFIG.width,
height:GAME_CONFIG.height,
parent:'game-canvas',
physics:{
default:'arcade',
arcade:{
gravity:{y:0},
debug:false
}
},
scale:{
mode:Phaser.Scale.FIT,
autoCenter:Phaser.Scale.CENTER_BOTH
},
scene:[DoodleJumpScene]
}

new Phaser.Game(gameConfig)
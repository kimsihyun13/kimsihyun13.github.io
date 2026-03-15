// Doodle Jump Game - Fixed & Upgraded

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
  playerJetpack:"https://cdn-game-mcp.gambo.ai/c3a399d2-83a8-48fd-8fcd-7ac5a93ef388/images/small_doodle_creature_jetpack.png",
  playerSpringShoes:"https://cdn-game-mcp.gambo.ai/f00540f7-f953-4ec6-9518-8c9e01efb287/images/small_doodle_creature_spring_shoes.png",
  playerPropellerHat:"https://cdn-game-mcp.gambo.ai/caf9467a-16c0-4d6f-8cac-49abe74f4e56/images/small_doodle_creature_propeller_hat_fixed.png",
  normalPlatform:"https://cdn-game-mcp.gambo.ai/938f4e00-e912-4bf6-a33f-9af5d5e4ca90/images/uniform_doodle_normal_platform.png",
  breakingPlatform:"https://cdn-game-mcp.gambo.ai/162dd194-6dd7-43fc-b3eb-1eda40f2d9cc/images/cracked_doodle_platform.png",
  movingPlatform:"https://cdn-game-mcp.gambo.ai/e581265e-35e5-4653-9610-cad191a00286/images/uniform_doodle_moving_platform.png",
  springPlatform:"https://cdn-game-mcp.gambo.ai/d8682bc8-0cf9-45e4-a33d-867532ffc196/images/purple_doodle_spring_platform.png",
  springPlatformCompressed:"https://cdn-game-mcp.gambo.ai/852863f2-0907-452b-8566-1357ec339e61/images/purple_spring_platform_compressed.png",
  jetpackPowerup:"https://cdn-game-mcp.gambo.ai/e206031a-9852-48fe-ac21-ea70c2a6e0ca/images/jetpack_powerup.png",
  springShoesPowerup:"https://cdn-game-mcp.gambo.ai/8c7d60f3-bb2c-441c-8813-b533f497e547/images/spring_shoes_powerup.png",
  propellerHatPowerup:"https://cdn-game-mcp.gambo.ai/1c1907fc-d9c9-4771-9b76-9f773508dee8/images/propeller_hat_powerup.png",
  enemy:"https://cdn-game-mcp.gambo.ai/c61509b8-d133-4a47-a226-527b21fe3b0d/images/enemy_monster.png",
  bullet:"https://cdn-game-mcp.gambo.ai/8a4161b7-32bb-446f-83d8-b9e73ec326d4/images/ultra_tiny_bullet_dot.png"
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
this.lastPlatformY=GAME_CONFIG.height-100

this.createBackground()

this.platforms=this.add.group()
this.enemies=this.add.group()
this.powerups=this.add.group()
this.bullets=this.add.group()

this.createPlayer()
this.createInitialPlatforms()

this.cursors=this.input.keyboard.createCursorKeys()
this.spaceKey=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)

this.setupTouchControls()
this.setupCollisions()
this.createUI()

this.cameras.main.startFollow(this.player,true,0.1,0.1)

this.player.body.setVelocityY(-GAME_CONFIG.jumpPower)

}

createBackground(){

this.background=this.add.tileSprite(
GAME_CONFIG.width/2,
GAME_CONFIG.height/2,
GAME_CONFIG.width,
GAME_CONFIG.height,
'background'
).setScrollFactor(0)

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

this.player.facingDirection='right'
this.player.lastShootTime=0

}

createInitialPlatforms(){

this.createPlatform(GAME_CONFIG.width/2,GAME_CONFIG.height-50,'normal')

for(let i=1;i<=6;i++){

const x=Phaser.Math.Between(60,GAME_CONFIG.width-60)
const y=GAME_CONFIG.height-50-(i*GAME_CONFIG.platformSpacing)

this.createPlatform(x,y,this.getRandomPlatformType())

this.lastPlatformY=y

}

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
platform.setOrigin(0.5,0.5)

platform.body.setAllowGravity(false)
platform.body.setImmovable(true)

platform.platformType=type
platform.hasBeenStepped=false

if(type==='moving'){
platform.direction=Phaser.Math.Between(0,1)?-1:1
platform.body.setVelocityX(platform.direction*80)
}

this.platforms.add(platform)

}

getRandomPlatformType(){

const r=Phaser.Math.Between(1,100)

if(r<=60) return 'normal'
if(r<=80) return 'breaking'
if(r<=95) return 'moving'
return 'spring'

}

setupTouchControls(){

this.touchLeft=false
this.touchRight=false

this.input.on('pointerdown',(p)=>{

if(p.x<GAME_CONFIG.width/2){
this.touchLeft=true
}else{
this.touchRight=true
}

this.shoot()

})

this.input.on('pointerup',()=>{
this.touchLeft=false
this.touchRight=false
})

}

setupCollisions(){

this.physics.add.overlap(this.player,this.platforms,(player,platform)=>{

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

this.tweens.add({
targets:platform,
alpha:0,
duration:200,
onComplete:()=>platform.destroy()
})

})

}

break

case 'spring':

this.player.body.setVelocityY(-GAME_CONFIG.jumpPower*1.6)

platform.setTexture('springPlatformCompressed')

this.time.delayedCall(200,()=>{
if(platform.active){
platform.setTexture('springPlatform')
}
})

break

}

}

})

}

jump(){
this.player.body.setVelocityY(-GAME_CONFIG.jumpPower)
}

shoot(){

const now=this.time.now
if(now-this.player.lastShootTime<300) return

this.player.lastShootTime=now

const bullet=this.physics.add.sprite(
this.player.x,
this.player.y-30,
'bullet'
)

bullet.setScale(0.1)

if(this.player.facingDirection==='left'){
bullet.body.setVelocity(-200,-350)
}else{
bullet.body.setVelocity(200,-350)
}

bullet.body.setGravityY(200)

this.bullets.add(bullet)

}

createUI(){

this.scoreText=this.add.text(10,10,'점수:0',{
fontSize:'18px',
fill:'#000',
stroke:'#fff',
strokeThickness:3
}).setScrollFactor(0)

}

showGameOver(){

const ui=this.add.container(0,0).setScrollFactor(0).setDepth(200)

const overlay=this.add.rectangle(
GAME_CONFIG.width/2,
GAME_CONFIG.height/2,
GAME_CONFIG.width,
GAME_CONFIG.height,
0x000000,
0.7
)

const title=this.add.text(
GAME_CONFIG.width/2,
GAME_CONFIG.height/2-60,
"GAME OVER",
{fontSize:'32px',fill:'#ff3333'}
).setOrigin(0.5)

const score=this.add.text(
GAME_CONFIG.width/2,
GAME_CONFIG.height/2,
`점수 ${this.score}`,
{fontSize:'24px',fill:'#fff'}
).setOrigin(0.5)

const restart=this.add.text(
GAME_CONFIG.width/2,
GAME_CONFIG.height/2+60,
"클릭하여 재시작",
{fontSize:'20px',fill:'#fff'}
).setOrigin(0.5)

ui.add([overlay,title,score,restart])

this.tweens.add({
targets:restart,
alpha:0.4,
yoyo:true,
repeat:-1,
duration:500
})

this.input.once('pointerdown',()=>{
this.scene.restart()
})

}

update(){

if(this.gameOver) return

this.updateMovement()
this.generatePlatforms()
this.updateScore()
this.updatePlatforms()
this.cleanup()
this.checkFall()

}

updateMovement(){

if(this.cursors.left.isDown || this.touchLeft){

this.player.body.setVelocityX(-GAME_CONFIG.moveSpeed)
this.player.setFlipX(true)
this.player.facingDirection='left'

}
else if(this.cursors.right.isDown || this.touchRight){

this.player.body.setVelocityX(GAME_CONFIG.moveSpeed)
this.player.setFlipX(false)
this.player.facingDirection='right'

}
else{

this.player.body.setVelocityX(0)

}

if(this.player.x<0) this.player.x=GAME_CONFIG.width
if(this.player.x>GAME_CONFIG.width) this.player.x=0

if(Phaser.Input.Keyboard.JustDown(this.spaceKey)){
this.shoot()
}

}

generatePlatforms(){

const threshold=this.cameras.main.scrollY-200

while(this.lastPlatformY>threshold){

this.lastPlatformY-=GAME_CONFIG.platformSpacing

const x=Phaser.Math.Between(60,GAME_CONFIG.width-60)

this.createPlatform(x,this.lastPlatformY,this.getRandomPlatformType())

}

}

updatePlatforms(){

this.platforms.children.entries.forEach(p=>{

if(p.platformType==='moving'){

const half=(p.width*p.scaleX)/2

if(p.x<=half) p.body.setVelocityX(80)
if(p.x>=GAME_CONFIG.width-half) p.body.setVelocityX(-80)

}

})

}

updateScore(){

const height=Math.floor((GAME_CONFIG.height-this.player.y)/10)

if(height>this.highestY){

this.highestY=height
this.score+=10

}

this.scoreText.setText(`점수:${this.score}`)

}

cleanup(){

const limit=this.cameras.main.scrollY+GAME_CONFIG.height+300

this.platforms.children.each(p=>{
if(p.y>limit)p.destroy()
})

}

checkFall(){

const fallLimit = this.lastPlatformY + GAME_CONFIG.platformSpacing * 7

if(this.player.y > fallLimit){

this.gameOver=true
this.showGameOver()

}

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
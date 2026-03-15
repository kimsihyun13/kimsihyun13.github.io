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
  springPlatformCompressed:"https://cdn-game-mcp.gambo.ai/852863f2-0907-452b-8566-1357ec339e61/images/purple_spring_platform_compressed.png",
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
this.lastPlatformY=GAME_CONFIG.height-50

this.platforms=this.add.group()
this.bullets=this.add.group()

this.createPlayer()

this.createPlatform(GAME_CONFIG.width/2,GAME_CONFIG.height-50,'normal')

for(let i=1;i<=6;i++){
const y=GAME_CONFIG.height-50-(i*GAME_CONFIG.platformSpacing)
const x=Phaser.Math.Between(60,GAME_CONFIG.width-60)
this.createPlatform(x,y,'normal')
this.lastPlatformY=y
}

this.cursors=this.input.keyboard.createCursorKeys()
this.spaceKey=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)

this.physics.add.overlap(this.player,this.platforms,this.platformCollision,null,this)

this.scoreText=this.add.text(10,10,'점수:0',{fontSize:'18px',fill:'#000',stroke:'#fff',strokeThickness:3}).setScrollFactor(0)

}

createPlayer(){

this.player=this.physics.add.sprite(GAME_CONFIG.width/2,GAME_CONFIG.height-150,'player')

this.player.setScale(0.1)
this.player.setOrigin(0.5,1)
this.player.body.setGravityY(GAME_CONFIG.gravity)

this.player.facingDirection='right'

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
this.updateScore()
this.checkFall()

}

updateMovement(){

if(this.cursors.left.isDown){
this.player.body.setVelocityX(-GAME_CONFIG.moveSpeed)
this.player.setFlipX(true)
this.player.facingDirection='left'
}
else if(this.cursors.right.isDown){
this.player.body.setVelocityX(GAME_CONFIG.moveSpeed)
this.player.setFlipX(false)
this.player.facingDirection='right'
}
else{
this.player.body.setVelocityX(0)
}

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

updateScore(){

const height=Math.floor((GAME_CONFIG.height-this.player.y)/10)

if(height>this.highestY){

this.highestY=height
this.score+=10

}

this.scoreText.setText("점수:"+this.score)

}

checkFall(){

if(this.player.y > this.cameras.main.scrollY + GAME_CONFIG.height + GAME_CONFIG.platformSpacing*7){

this.gameOver=true

this.add.text(
GAME_CONFIG.width/2,
this.cameras.main.scrollY+GAME_CONFIG.height/2,
"GAME OVER",
{fontSize:'32px',fill:'#ff0000'}
).setOrigin(0.5)

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
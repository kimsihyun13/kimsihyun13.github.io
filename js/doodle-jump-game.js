const GAME_CONFIG = {
  width: 375,
  height: 500,
  gravity: 900,
  jumpPower: 520,
  moveSpeed: 260,
  platformSpacing: 80
};

const ASSETS = {
  background: "https://cdn-game-mcp.gambo.ai/c3fddd74-f57b-4263-b4c9-2eaf874961c7/images/refined_notebook_grid_background.png",
  player: "https://cdn-game-mcp.gambo.ai/63eb673b-c1c0-4c91-9b56-f4c500793223/images/small_doodle_creature_idle.png",
  normalPlatform: "https://cdn-game-mcp.gambo.ai/938f4e00-e912-4bf6-a33f-9af5d5e4ca90/images/uniform_doodle_normal_platform.png",
  enemy: "https://cdn-game-mcp.gambo.ai/c61509b8-d133-4a47-a226-527b21fe3b0d/images/enemy_monster.png"
};

class DoodleJumpScene extends Phaser.Scene {

constructor(){
super({key:"DoodleJumpScene"});
}

preload(){

for(let key in ASSETS){
this.load.image(key,ASSETS[key]);
}

}

create(){

this.gameOver=false;
this.score=0;

this.add.image(0,0,"background").setOrigin(0);

this.platforms=this.physics.add.group();
this.enemies=this.physics.add.group();

this.player=this.physics.add.sprite(200,420,"player");
this.player.setScale(0.12);
this.player.body.setGravityY(GAME_CONFIG.gravity);

this.cursors=this.input.keyboard.createCursorKeys();

this.lastPlatformY = GAME_CONFIG.height - 50;

this.createStartPlatforms();

this.cameras.main.startFollow(this.player,true,0.05,0.05);

this.createUI();

this.physics.add.collider(this.player,this.platforms,this.platformJump,null,this);

}

createStartPlatforms(){

for(let i=0;i<8;i++){

let x = Phaser.Math.Between(50, GAME_CONFIG.width-50);
let y = this.lastPlatformY - (i * GAME_CONFIG.platformSpacing);

this.createPlatform(x,y);

}

}

createPlatform(x,y){

let platform = this.physics.add.sprite(x,y,"normalPlatform");

platform.setScale(0.18);
platform.body.setAllowGravity(false);
platform.setImmovable(true);

this.platforms.add(platform);

if(Phaser.Math.Between(1,100) < 10){
this.createEnemy(x,y-50);
}

}

createEnemy(x,y){

let enemy = this.physics.add.sprite(x,y,"enemy");

enemy.setScale(0.07);
enemy.body.setAllowGravity(false);
enemy.setVelocityX(Phaser.Math.Between(-80,80));

this.enemies.add(enemy);

}

createUI(){

this.scoreText=this.add.text(10,10,"점수:0",{
fontSize:"18px",
fill:"#000"
}).setScrollFactor(0);

}

platformJump(player,platform){

if(player.body.velocity.y > 0){
player.setVelocityY(-GAME_CONFIG.jumpPower);
}

}

generatePlatforms(){

let cameraTop = this.cameras.main.scrollY;

while(this.lastPlatformY > cameraTop - 700){

this.lastPlatformY -= GAME_CONFIG.platformSpacing;

let x = Phaser.Math.Between(50, GAME_CONFIG.width-50);

this.createPlatform(x,this.lastPlatformY);

}

}

cleanupPlatforms(){

this.platforms.children.each(p=>{

if(p.y > this.cameras.main.scrollY + GAME_CONFIG.height + 100){
p.destroy();
}

});

}

update(){

if(this.gameOver) return;

this.generatePlatforms();

this.cleanupPlatforms();

if(this.cursors.left.isDown){

this.player.setVelocityX(-GAME_CONFIG.moveSpeed);

}
else if(this.cursors.right.isDown){

this.player.setVelocityX(GAME_CONFIG.moveSpeed);

}
else{

this.player.setVelocityX(0);

}

if(this.player.y < this.cameras.main.scrollY + 200){

this.cameras.main.scrollY = this.player.y - 200;

this.score = Math.floor(-this.cameras.main.scrollY);

this.scoreText.setText("점수: " + this.score);

}

if(this.player.y > this.cameras.main.scrollY + GAME_CONFIG.height + 200){

this.gameOver=true;

this.showGameOver();

}

}

showGameOver(){

let w = GAME_CONFIG.width;
let h = GAME_CONFIG.height;

this.add.rectangle(w/2,h/2,w,h,0x000000,0.6).setScrollFactor(0);

this.add.text(w/2,h/2-40,"GAME OVER",{
fontSize:"32px",
fill:"#ff4444"
}).setOrigin(0.5).setScrollFactor(0);

this.add.text(w/2,h/2,"점수: "+this.score,{
fontSize:"20px",
fill:"#ffffff"
}).setOrigin(0.5).setScrollFactor(0);

this.add.text(w/2,h/2+40,"클릭하면 다시 시작",{
fontSize:"18px",
fill:"#ffffff"
}).setOrigin(0.5).setScrollFactor(0);

this.input.once("pointerdown",()=>{
this.scene.restart();
});

}

}

const config = {

type: Phaser.AUTO,
width: GAME_CONFIG.width,
height: GAME_CONFIG.height,
parent:"game-canvas",

physics:{
default:"arcade",
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

};

new Phaser.Game(config);
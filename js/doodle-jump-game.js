// Doodle Jump Game - Improved Version

const GAME_CONFIG = {
  width: 375,
  height: 500,
  gravity: 700,
  jumpPower: 450,
  moveSpeed: 200,
  platformSpacing: 70
};

const ASSETS = {
  background: "https://cdn-game-mcp.gambo.ai/c3fddd74-f57b-4263-b4c9-2eaf874961c7/images/refined_notebook_grid_background.png",
  player: "https://cdn-game-mcp.gambo.ai/63eb673b-c1c0-4c91-9b56-f4c500793223/images/small_doodle_creature_idle.png",
  normalPlatform: "https://cdn-game-mcp.gambo.ai/938f4e00-e912-4bf6-a33f-9af5d5e4ca90/images/uniform_doodle_normal_platform.png",
  enemy: "https://cdn-game-mcp.gambo.ai/c61509b8-d133-4a47-a226-527b21fe3b0d/images/enemy_monster.png",
  bullet: "https://cdn-game-mcp.gambo.ai/8a4161b7-32bb-446f-83d8-b9e73ec326d4/images/ultra_tiny_bullet_dot.png"
};

class DoodleJumpScene extends Phaser.Scene {

  constructor(){
    super({key:"DoodleJumpScene"});
  }

  preload(){

    this.load.image("background",ASSETS.background);
    this.load.image("player",ASSETS.player);
    this.load.image("platform",ASSETS.normalPlatform);
    this.load.image("enemy",ASSETS.enemy);
    this.load.image("bullet",ASSETS.bullet);

  }

  create(){

    this.gameOver=false;
    this.score=0;
    this.highScore=localStorage.getItem("doodle_highscore")||0;

    this.add.image(0,0,"background").setOrigin(0);

    this.platforms=this.physics.add.group();
    this.enemies=this.physics.add.group();
    this.bullets=this.physics.add.group();

    this.player=this.physics.add.sprite(200,400,"player");

    this.player.setScale(0.1);

    this.player.body.setGravityY(GAME_CONFIG.gravity);

    this.cursors=this.input.keyboard.createCursorKeys();

    this.createPlatform(200,480);

    this.createUI();

    this.startScreen();

    this.setupCollisions();

  }

  startScreen(){

    this.startOverlay=this.add.rectangle(
      GAME_CONFIG.width/2,
      GAME_CONFIG.height/2,
      GAME_CONFIG.width,
      GAME_CONFIG.height,
      0x000000,
      0.6
    );

    this.startText=this.add.text(
      GAME_CONFIG.width/2,
      GAME_CONFIG.height/2,
      "클릭하여 시작",
      {fontSize:"28px",fill:"#ffffff"}
    ).setOrigin(0.5);

    this.physics.pause();

    this.input.once("pointerdown",()=>{

      this.startOverlay.destroy();
      this.startText.destroy();

      this.physics.resume();

      this.player.setVelocityY(-GAME_CONFIG.jumpPower);

    });

  }

  createPlatform(x,y){

    const platform=this.physics.add.sprite(x,y,"platform");

    platform.setScale(0.15);

    platform.body.setImmovable(true);
    platform.body.setAllowGravity(false);

    this.platforms.add(platform);

    if(Phaser.Math.Between(1,100)<10){

      this.createEnemy(x,y-60);

    }

  }

  createEnemy(x,y){

    const enemy=this.physics.add.sprite(x,y,"enemy");

    enemy.setScale(0.06);

    enemy.body.setAllowGravity(false);

    enemy.direction=Phaser.Math.Between(0,1)?-1:1;

    enemy.body.setVelocityX(enemy.direction*60);

    this.enemies.add(enemy);

  }

  createUI(){

    this.scoreText=this.add.text(10,10,"점수:0",{
      fontSize:"18px",
      fill:"#000",
      stroke:"#fff",
      strokeThickness:3
    }).setScrollFactor(0);

    this.highScoreText=this.add.text(10,35,`최고점:${this.highScore}`,{
      fontSize:"14px",
      fill:"#000",
      stroke:"#fff",
      strokeThickness:2
    }).setScrollFactor(0);

  }

  setupCollisions(){

    this.physics.add.overlap(this.player,this.platforms,(player,platform)=>{

      if(player.body.velocity.y>0 && player.y<platform.y){

        this.jump();

      }

    });

    this.physics.add.overlap(this.player,this.enemies,(player,enemy)=>{

      if(player.body.velocity.y>0 && player.y<enemy.y){

        this.cameras.main.shake(100,0.01);

        if(navigator.vibrate) navigator.vibrate(50);

        enemy.destroy();

        this.score+=100;

        this.jump();

      }else{

        this.triggerGameOver();

      }

    });

  }

  jump(){

    this.player.setVelocityY(-GAME_CONFIG.jumpPower);

  }

  shoot(){

    const bullet=this.physics.add.sprite(this.player.x,this.player.y-30,"bullet");

    bullet.setVelocityY(-400);

    this.bullets.add(bullet);

  }

  triggerGameOver(){

    this.gameOver=true;

    this.tweens.add({

      targets:this.player,
      angle:360,
      duration:800

    });

    if(this.score>this.highScore){

      localStorage.setItem("doodle_highscore",this.score);

    }

    this.time.delayedCall(800,()=>{

      this.showGameOver();

    });

  }

  showGameOver(){

    const overlay=this.add.rectangle(
      GAME_CONFIG.width/2,
      GAME_CONFIG.height/2,
      GAME_CONFIG.width,
      GAME_CONFIG.height,
      0x000000,
      0.7
    );

    this.add.text(
      GAME_CONFIG.width/2,
      GAME_CONFIG.height/2-40,
      "GAME OVER",
      {fontSize:"32px",fill:"#ff3333"}
    ).setOrigin(0.5);

    this.add.text(
      GAME_CONFIG.width/2,
      GAME_CONFIG.height/2,
      `점수:${this.score}`,
      {fontSize:"22px",fill:"#ffffff"}
    ).setOrigin(0.5);

    this.add.text(
      GAME_CONFIG.width/2,
      GAME_CONFIG.height/2+40,
      "클릭하여 재시작",
      {fontSize:"18px",fill:"#ffffff"}
    ).setOrigin(0.5);

    this.input.once("pointerdown",()=>{

      this.scene.restart();

    });

  }

  update(){

    if(this.gameOver) return;

    if(this.cursors.left.isDown){

      this.player.setVelocityX(-GAME_CONFIG.moveSpeed);

    }
    else if(this.cursors.right.isDown){

      this.player.setVelocityX(GAME_CONFIG.moveSpeed);

    }
    else{

      this.player.setVelocityX(0);

    }

    if(this.player.y>GAME_CONFIG.height+100){

      this.triggerGameOver();

    }

    this.scoreText.setText(`점수:${this.score}`);

  }

}

const gameConfig={

  type:Phaser.AUTO,

  width:GAME_CONFIG.width,

  height:GAME_CONFIG.height,

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

new Phaser.Game(gameConfig);
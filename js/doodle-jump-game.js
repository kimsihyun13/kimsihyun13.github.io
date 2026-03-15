// Doodle Jump Game - Single File Version
// 시현이의 사이트용 게임

// ========== 게임 설정 ==========
const GAME_CONFIG = {
  width: 375,
  height: 500,
  gravity: 700,
  jumpPower: 450,
  moveSpeed: 200,
  platformSpacing: 70
};

// ========== 이미지 URL ==========
const ASSETS = {
  background: "https://cdn-game-mcp.gambo.ai/c3fddd74-f57b-4263-b4c9-2eaf874961c7/images/refined_notebook_grid_background.png",
  player: "https://cdn-game-mcp.gambo.ai/63eb673b-c1c0-4c91-9b56-f4c500793223/images/small_doodle_creature_idle.png",
  playerJetpack: "https://cdn-game-mcp.gambo.ai/c3a399d2-83a8-48fd-8fcd-7ac5a93ef388/images/small_doodle_creature_jetpack.png",
  playerSpringShoes: "https://cdn-game-mcp.gambo.ai/f00540f7-f953-4ec6-9518-8c9e01efb287/images/small_doodle_creature_spring_shoes.png",
  playerPropellerHat: "https://cdn-game-mcp.gambo.ai/caf9467a-16c0-4d6f-8cac-49abe74f4e56/images/small_doodle_creature_propeller_hat_fixed.png",
  normalPlatform: "https://cdn-game-mcp.gambo.ai/938f4e00-e912-4bf6-a33f-9af5d5e4ca90/images/uniform_doodle_normal_platform.png",
  breakingPlatform: "https://cdn-game-mcp.gambo.ai/162dd194-6dd7-43fc-b3eb-1eda40f2d9cc/images/cracked_doodle_platform.png",
  movingPlatform: "https://cdn-game-mcp.gambo.ai/e581265e-35e5-4653-9610-cad191a00286/images/uniform_doodle_moving_platform.png",
  springPlatform: "https://cdn-game-mcp.gambo.ai/d8682bc8-0cf9-45e4-a33d-867532ffc196/images/purple_doodle_spring_platform.png",
  springPlatformCompressed: "https://cdn-game-mcp.gambo.ai/852863f2-0907-452b-8566-1357ec339e61/images/purple_spring_platform_compressed.png",
  jetpackPowerup: "https://cdn-game-mcp.gambo.ai/e206031a-9852-48fe-ac21-ea70c2a6e0ca/images/jetpack_powerup.png",
  springShoesPowerup: "https://cdn-game-mcp.gambo.ai/8c7d60f3-bb2c-441c-8813-b533f497e547/images/spring_shoes_powerup.png",
  propellerHatPowerup: "https://cdn-game-mcp.gambo.ai/1c1907fc-d9c9-4771-9b76-9f773508dee8/images/propeller_hat_powerup.png",
  enemy: "https://cdn-game-mcp.gambo.ai/c61509b8-d133-4a47-a226-527b21fe3b0d/images/enemy_monster.png",
  bullet: "https://cdn-game-mcp.gambo.ai/8a4161b7-32bb-446f-83d8-b9e73ec326d4/images/ultra_tiny_bullet_dot.png"
};

// ========== 메인 게임 씬 ==========
class DoodleJumpScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DoodleJumpScene' });
  }

  preload() {
    // 로딩 프로그레스 바
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 4, height / 2 - 15, width / 2, 30);
    
    const loadingText = this.add.text(width / 2, height / 2 - 40, '로딩중...', {
      fontSize: '16px',
      fill: '#ffffff'
    }).setOrigin(0.5);

    this.load.on('progress', (value) => {
      progressBar.clear();
      progressBar.fillStyle(0x4CAF50, 1);
      progressBar.fillRect(width / 4 + 5, height / 2 - 10, (width / 2 - 10) * value, 20);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });

    // 이미지 로드
    this.load.image('background', ASSETS.background);
    this.load.image('player', ASSETS.player);
    this.load.image('player_jetpack', ASSETS.playerJetpack);
    this.load.image('player_spring_shoes', ASSETS.playerSpringShoes);
    this.load.image('player_propeller_hat', ASSETS.playerPropellerHat);
    this.load.image('normal_platform', ASSETS.normalPlatform);
    this.load.image('breaking_platform', ASSETS.breakingPlatform);
    this.load.image('moving_platform', ASSETS.movingPlatform);
    this.load.image('spring_platform', ASSETS.springPlatform);
    this.load.image('spring_platform_compressed', ASSETS.springPlatformCompressed);
    this.load.image('jetpack_powerup', ASSETS.jetpackPowerup);
    this.load.image('spring_shoes_powerup', ASSETS.springShoesPowerup);
    this.load.image('propeller_hat_powerup', ASSETS.propellerHatPowerup);
    this.load.image('enemy', ASSETS.enemy);
    this.load.image('bullet', ASSETS.bullet);
  }

  create() {
    // 게임 상태
    this.gameOver = false;
    this.score = 0;
    this.highestY = 0;
    this.lastPlatformY = GAME_CONFIG.height - 100;

    // 배경
    this.createBackground();

    // 그룹 생성
    this.platforms = this.add.group();
    this.enemies = this.add.group();
    this.powerups = this.add.group();
    this.bullets = this.add.group();

    // 플레이어 생성
    this.createPlayer();

    // 초기 플랫폼 생성
    this.createInitialPlatforms();

    // 입력 설정
    this.cursors = this.input.keyboard.createCursorKeys();
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // 터치 컨트롤
    this.setupTouchControls();

    // 충돌 설정
    this.setupCollisions();

    // UI
    this.createUI();

    // 카메라 설정
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // 게임 시작
    this.player.body.setVelocityY(-GAME_CONFIG.jumpPower);
  }

  createBackground() {
    this.backgroundTiles = [];
    const bgHeight = 1024;
    
    for (let y = -5; y < 3; y++) {
      const bg = this.add.image(0, y * bgHeight, 'background');
      bg.setOrigin(0, 0);
      bg.setDepth(-100);
      this.backgroundTiles.push(bg);
    }
  }

  createPlayer() {
    this.player = this.physics.add.sprite(GAME_CONFIG.width / 2, GAME_CONFIG.height - 150, 'player');
    this.player.setScale(0.1);
    this.player.setOrigin(0.5, 1);
    this.player.body.setGravityY(GAME_CONFIG.gravity);
    this.player.body.setSize(this.player.width * 0.7, this.player.height * 0.7);
    
    // 플레이어 상태
    this.player.facingDirection = 'right';
    this.player.canShoot = true;
    this.player.lastShootTime = 0;
    
    // 파워업 상태
    this.player.hasJetpack = false;
    this.player.hasSpringShoes = false;
    this.player.hasPropellerHat = false;
    this.player.jetpackEndTime = 0;
    this.player.springShoesEndTime = 0;
    this.player.propellerHatEndTime = 0;
  }

  createInitialPlatforms() {
    // 시작 플랫폼
    this.createPlatform(GAME_CONFIG.width / 2, GAME_CONFIG.height - 50, 'normal');
    
    // 추가 플랫폼
    for (let i = 1; i <= 6; i++) {
      const x = Phaser.Math.Between(60, GAME_CONFIG.width - 60);
      const y = GAME_CONFIG.height - 50 - (i * GAME_CONFIG.platformSpacing);
      this.createPlatform(x, y, this.getRandomPlatformType());
      this.lastPlatformY = y;
    }
  }

  createPlatform(x, y, type) {
    const textureMap = {
      'normal': 'normal_platform',
      'breaking': 'breaking_platform',
      'moving': 'moving_platform',
      'spring': 'spring_platform'
    };

    const platform = this.physics.add.sprite(x, y, textureMap[type]);
    platform.setScale(0.15);
    platform.setOrigin(0.5, 0.5);
    platform.body.setImmovable(true);
    platform.body.setAllowGravity(false);
    platform.platformType = type;
    platform.hasBeenStepped = false;

    if (type === 'moving') {
      platform.direction = Phaser.Math.Between(0, 1) ? -1 : 1;
      platform.body.setVelocityX(platform.direction * 80);
    }

    this.platforms.add(platform);

    // 가끔 파워업 생성
    if (Phaser.Math.Between(1, 100) <= 5) {
      this.createPowerup(x, y - 50);
    }

    // 가끔 적 생성
    if (Phaser.Math.Between(1, 100) <= 8) {
      this.createEnemy(Phaser.Math.Between(60, GAME_CONFIG.width - 60), y - 80);
    }

    return platform;
  }

  createPowerup(x, y) {
    const types = ['jetpack_powerup', 'spring_shoes_powerup', 'propeller_hat_powerup'];
    const type = types[Phaser.Math.Between(0, 2)];
    
    const powerup = this.physics.add.sprite(x, y, type);
    powerup.setScale(0.08);
    powerup.body.setAllowGravity(false);
    powerup.body.setImmovable(true);
    powerup.powerupType = type;
    
    // 떠다니는 애니메이션
    this.tweens.add({
      targets: powerup,
      y: y - 10,
      duration: 1000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });
    
    this.powerups.add(powerup);
  }

  createEnemy(x, y) {
    const enemy = this.physics.add.sprite(x, y, 'enemy');
    enemy.setScale(0.06);
    enemy.body.setAllowGravity(false);
    enemy.body.setImmovable(true);
    enemy.isDead = false;
    this.enemies.add(enemy);
  }

  getRandomPlatformType() {
    const rand = Phaser.Math.Between(1, 100);
    if (rand <= 60) return 'normal';
    if (rand <= 80) return 'breaking';
    if (rand <= 95) return 'moving';
    return 'spring';
  }

  setupTouchControls() {
    this.touchLeft = false;
    this.touchRight = false;
    
    this.input.on('pointerdown', (pointer) => {
      if (pointer.x < GAME_CONFIG.width / 2) {
        this.touchLeft = true;
      } else {
        this.touchRight = true;
      }
      // 터치로 발사
      this.shoot();
    });
    
    this.input.on('pointerup', () => {
      this.touchLeft = false;
      this.touchRight = false;
    });
  }

  setupCollisions() {
    // 플레이어-플랫폼 충돌
    this.physics.add.overlap(this.player, this.platforms, (player, platform) => {
      if (player.body.velocity.y > 0 && player.y < platform.y) {
        this.handlePlatformCollision(platform);
      }
    });

    // 플레이어-적 충돌
    this.physics.add.overlap(this.player, this.enemies, (player, enemy) => {
      if (enemy.isDead) return;
      
      if (player.body.velocity.y > 0 && player.y < enemy.y) {
        // 적 밟기
        enemy.isDead = true;
        this.tweens.add({
          targets: enemy,
          alpha: 0,
          scaleX: 0.1,
          scaleY: 0.03,
          duration: 200,
          onComplete: () => enemy.destroy()
        });
        this.score += 100;
        this.jump();
      } else {
        // 적에게 충돌
        this.gameOver = true;
        this.showGameOver();
      }
    });

    // 플레이어-파워업 충돌
    this.physics.add.overlap(this.player, this.powerups, (player, powerup) => {
      this.collectPowerup(powerup);
    });

    // 총알-적 충돌
    this.physics.add.overlap(this.bullets, this.enemies, (bullet, enemy) => {
      if (enemy.isDead) return;
      
      enemy.isDead = true;
      bullet.destroy();
      this.score += 150;
      
      this.tweens.add({
        targets: enemy,
        alpha: 0,
        scaleX: 0.1,
        scaleY: 0.1,
        duration: 200,
        onComplete: () => enemy.destroy()
      });
    });
  }

  handlePlatformCollision(platform) {
    switch (platform.platformType) {
      case 'normal':
      case 'moving':
        this.jump();
        break;
      case 'breaking':
        if (!platform.hasBeenStepped) {
          platform.hasBeenStepped = true;
          this.jump();
          this.time.delayedCall(100, () => {
            this.tweens.add({
              targets: platform,
              alpha: 0,
              duration: 200,
              onComplete: () => platform.destroy()
            });
          });
        }
        break;
      case 'spring':
        this.jump(-GAME_CONFIG.jumpPower * 1.5);
        platform.setTexture('spring_platform_compressed');
        this.time.delayedCall(200, () => {
          if (platform.active) platform.setTexture('spring_platform');
        });
        break;
    }
  }

  collectPowerup(powerup) {
    const now = this.time.now;
    
    switch (powerup.powerupType) {
      case 'jetpack_powerup':
        this.player.hasJetpack = true;
        this.player.jetpackEndTime = now + 3000;
        this.player.setTexture('player_jetpack');
        break;
      case 'spring_shoes_powerup':
        this.player.hasSpringShoes = true;
        this.player.springShoesEndTime = now + 10000;
        this.player.setTexture('player_spring_shoes');
        break;
      case 'propeller_hat_powerup':
        this.player.hasPropellerHat = true;
        this.player.propellerHatEndTime = now + 4000;
        this.player.setTexture('player_propeller_hat');
        break;
    }
    
    this.score += 200;
    
    this.tweens.add({
      targets: powerup,
      alpha: 0,
      scaleX: 0.15,
      scaleY: 0.15,
      duration: 200,
      onComplete: () => powerup.destroy()
    });
  }

  jump(velocity = null) {
    let jumpVel = velocity || -GAME_CONFIG.jumpPower;
    if (this.player.hasSpringShoes) {
      jumpVel *= 1.3;
    }
    this.player.body.setVelocityY(jumpVel);
  }

  shoot() {
    const now = this.time.now;
    if (now - this.player.lastShootTime < 300) return;
    
    this.player.lastShootTime = now;
    
    const bullet = this.physics.add.sprite(this.player.x, this.player.y - 30, 'bullet');
    bullet.setScale(0.1);
    bullet.body.setVelocityY(-400);
    bullet.body.setGravityY(200);
    this.bullets.add(bullet);
    
    this.time.delayedCall(2000, () => {
      if (bullet.active) bullet.destroy();
    });
  }

  createUI() {
    this.scoreText = this.add.text(10, 10, '점수: 0', {
      fontSize: '18px',
      fill: '#000000',
      stroke: '#ffffff',
      strokeThickness: 3
    }).setScrollFactor(0).setDepth(100);

    this.heightText = this.add.text(10, 35, '높이: 0m', {
      fontSize: '14px',
      fill: '#000000',
      stroke: '#ffffff',
      strokeThickness: 2
    }).setScrollFactor(0).setDepth(100);
  }

  showGameOver() {
    // 반투명 오버레이
    const overlay = this.add.rectangle(
      GAME_CONFIG.width / 2, 
      this.cameras.main.scrollY + GAME_CONFIG.height / 2, 
      GAME_CONFIG.width, 
      GAME_CONFIG.height, 
      0x000000, 0.7
    ).setDepth(200);

    // 게임 오버 텍스트
    this.add.text(
      GAME_CONFIG.width / 2, 
      this.cameras.main.scrollY + GAME_CONFIG.height / 2 - 60, 
      'GAME OVER', {
        fontSize: '32px',
        fill: '#ff3333',
        stroke: '#ffffff',
        strokeThickness: 6
      }
    ).setOrigin(0.5).setDepth(201);

    // 최종 점수
    this.add.text(
      GAME_CONFIG.width / 2, 
      this.cameras.main.scrollY + GAME_CONFIG.height / 2, 
      `점수: ${this.score}`, {
        fontSize: '24px',
        fill: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4
      }
    ).setOrigin(0.5).setDepth(201);

    // 재시작 안내
    const restartText = this.add.text(
      GAME_CONFIG.width / 2, 
      this.cameras.main.scrollY + GAME_CONFIG.height / 2 + 60, 
      '클릭하여 재시작', {
        fontSize: '20px',
        fill: '#ffffff',
        stroke: '#333333',
        strokeThickness: 3
      }
    ).setOrigin(0.5).setDepth(201);

    // 깜빡임 애니메이션
    this.tweens.add({
      targets: restartText,
      alpha: 0.5,
      duration: 500,
      yoyo: true,
      repeat: -1
    });

    // 재시작 클릭
    this.input.once('pointerdown', () => {
      this.scene.restart();
    });
  }

  update() {
    if (this.gameOver) return;

    // 파워업 상태 업데이트
    this.updatePowerupStates();

    // 플레이어 이동
    this.updatePlayerMovement();

    // 플랫폼 생성
    this.generatePlatforms();

    // 배경 업데이트
    this.updateBackground();

    // 높이/점수 업데이트
    this.updateScore();

    // 플랫폼 업데이트
    this.updatePlatforms();

    // 화면 밖 오브젝트 정리
    this.cleanupOffScreen();

    // 추락 체크
    this.checkFallOff();
  }

  updatePowerupStates() {
    const now = this.time.now;
    
    if (this.player.hasJetpack && now > this.player.jetpackEndTime) {
      this.player.hasJetpack = false;
      this.player.setTexture('player');
    }
    
    if (this.player.hasSpringShoes && now > this.player.springShoesEndTime) {
      this.player.hasSpringShoes = false;
      if (!this.player.hasJetpack && !this.player.hasPropellerHat) {
        this.player.setTexture('player');
      }
    }
    
    if (this.player.hasPropellerHat && now > this.player.propellerHatEndTime) {
      this.player.hasPropellerHat = false;
      this.player.setTexture('player');
    }
    
    // 프로펠러 모자 효과
    if (this.player.hasPropellerHat) {
      this.player.body.setVelocityY(-400);
    }
    
    // 제트팩 효과
    if (this.player.hasJetpack && (this.cursors.up.isDown || this.spaceKey.isDown)) {
      this.player.body.setVelocityY(-300);
    }
  }

  updatePlayerMovement() {
    // 좌우 이동
    if (this.cursors.left.isDown || this.touchLeft) {
      this.player.body.setVelocityX(-GAME_CONFIG.moveSpeed);
      this.player.facingDirection = 'left';
      this.player.setFlipX(true);
    } else if (this.cursors.right.isDown || this.touchRight) {
      this.player.body.setVelocityX(GAME_CONFIG.moveSpeed);
      this.player.facingDirection = 'right';
      this.player.setFlipX(false);
    } else {
      this.player.body.setVelocityX(0);
    }

    // 화면 경계
    if (this.player.x < 20) {
      this.player.x = 20;
    } else if (this.player.x > GAME_CONFIG.width - 20) {
      this.player.x = GAME_CONFIG.width - 20;
    }

    // 스페이스바 발사
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey) && !this.player.hasJetpack) {
      this.shoot();
    }
  }

  generatePlatforms() {
    const generateThreshold = this.cameras.main.scrollY - 200;
    
    while (this.lastPlatformY > generateThreshold) {
      this.lastPlatformY -= GAME_CONFIG.platformSpacing;
      const x = Phaser.Math.Between(60, GAME_CONFIG.width - 60);
      this.createPlatform(x, this.lastPlatformY, this.getRandomPlatformType());
    }
  }

  updateBackground() {
    const cameraTop = this.cameras.main.scrollY;
    const bgHeight = 1024;
    
    this.backgroundTiles.forEach(bg => {
      if (bg.y > cameraTop + GAME_CONFIG.height + bgHeight) {
        bg.y -= bgHeight * this.backgroundTiles.length;
      }
    });
  }

  updateScore() {
    const currentHeight = Math.max(0, Math.floor((GAME_CONFIG.height - this.player.y) / 10));
    if (currentHeight > this.highestY) {
      this.highestY = currentHeight;
      this.score += 10;
    }
    
    this.scoreText.setText(`점수: ${this.score}`);
    this.heightText.setText(`높이: ${this.highestY}m`);
  }

  updatePlatforms() {
    this.platforms.children.entries.forEach(platform => {
      if (platform.platformType === 'moving') {
        const halfWidth = (platform.width * platform.scaleX) / 2;
        if (platform.x <= halfWidth + 10) {
          platform.body.setVelocityX(80);
        } else if (platform.x >= GAME_CONFIG.width - halfWidth - 10) {
          platform.body.setVelocityX(-80);
        }
      }
    });
  }

  cleanupOffScreen() {
    const cleanupY = this.cameras.main.scrollY + GAME_CONFIG.height + 300;
    
    this.platforms.children.entries.forEach(p => {
      if (p.y > cleanupY) p.destroy();
    });
    
    this.enemies.children.entries.forEach(e => {
      if (e.y > cleanupY) e.destroy();
    });
    
    this.powerups.children.entries.forEach(p => {
      if (p.y > cleanupY) p.destroy();
    });
    
    this.bullets.children.entries.forEach(b => {
      if (b.y < this.cameras.main.scrollY - 100 || b.y > cleanupY) b.destroy();
    });
  }

  checkFallOff() {
    if (this.player.y > this.cameras.main.scrollY + GAME_CONFIG.height + 100) {
      this.gameOver = true;
      this.showGameOver();
    }
  }
}

// ========== 게임 초기화 ==========
const gameConfig = {
  type: Phaser.AUTO,
  width: GAME_CONFIG.width,
  height: GAME_CONFIG.height,
  parent: 'game-canvas',
  backgroundColor: '#f5f5dc',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [DoodleJumpScene]
};

// 게임 시작
const game = new Phaser.Game(gameConfig);

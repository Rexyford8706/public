// main.js - Crate Survival: Zombie Siege

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game State
const game = {
    running: true,
    round: 1,
    points: 0,
    zombiesKilled: 0,
    paused: false,
    upgradeMenuOpen: false,
    crateDropped: false,
    bossRound: false,
    lastTime: 0
};

// Player
const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 15,
    speed: 4,
    health: 100,
    maxHealth: 100,
    angle: 0,
    keys: {},
    invulnerable: 0
};

// Weapon System
const weapons = {
    pistol: {
        name: "Starter Pistol",
        damage: 25,
        magazine: 19,
        maxMagazine: 19,
        fireRate: 250,
        reloadTime: 1500,
        color: '#888',
        projectileSpeed: 12,
        automatic: false,
        burst: 1,
        rarity: 1
    },
    semiRifle: {
        name: "Semi-Auto Rifle",
        damage: 45,
        magazine: 25,
        maxMagazine: 25,
        fireRate: 200,
        reloadTime: 1800,
        color: '#4a4',
        projectileSpeed: 15,
        automatic: false,
        burst: 1,
        rarity: 2
    },
    burstRifle: {
        name: "Burst Rifle",
        damage: 30,
        magazine: 25,
        maxMagazine: 25,
        fireRate: 400,
        reloadTime: 2000,
        color: '#48f',
        projectileSpeed: 14,
        automatic: false,
        burst: 3,
        rarity: 3
    },
    assaultRifle: {
        name: "Assault Rifle",
        damage: 35,
        magazine: 30,
        maxMagazine: 30,
        fireRate: 100,
        reloadTime: 2200,
        color: '#f80',
        projectileSpeed: 13,
        automatic: true,
        burst: 1,
        rarity: 4
    },
    rpg: {
        name: "RPG",
        damage: 150,
        magazine: 1,
        maxMagazine: 1,
        fireRate: 800,
        reloadTime: 3000,
        color: '#f00',
        projectileSpeed: 8,
        automatic: false,
        burst: 1,
        explosive: true,
        explosionRadius: 100,
        rarity: 5
    }
};

let currentWeapon = { ...weapons.pistol };
let currentMagazine = currentWeapon.magazine;
let lastShot = 0;
let reloading = false;
let reloadStart = 0;

// Shooting state for hold-to-fire
let isShooting = false;

// Axe system
let axe = null;
const AXE_DURATION = 500; // 0.5 seconds
const AXE_COOLDOWN = 3000; // 3 seconds between uses
let lastAxeUse = 0;

// Weapon Upgrades
const weaponUpgrades = {
    damage: 1,
    reloadSpeed: 1,
    magazineBonus: 0,
    fireRate: 1
};

// Projectiles
let projectiles = [];

// Zombies
let zombies = [];
const zombieTypes = {
    normal: { health: 50, speed: 1.5, damage: 10, color: '#2d5016', points: 10, radius: 18, hitboxRadius: 22 },
    fast: { health: 25, speed: 3, damage: 8, color: '#8b0000', points: 15, radius: 10, hitboxRadius: 12, oneTap: true },
    tank: { health: 150, speed: 0.8, damage: 20, color: '#4a0080', points: 30, radius: 18, hitboxRadius: 22 },
    horse: { health: 100, speed: 2.5, damage: 15, color: '#654321', points: 40, radius: 20, hitboxRadius: 24, isHorse: true, riderType: null },
    ranged: { health: 40, speed: 1.2, damage: 12, color: '#2d2d2d', points: 20, radius: 11, hitboxRadius: 14, ranged: true, projectileSpeed: 6 },
    exploder: { health: 60, speed: 2.2, damage: 25, color: '#ff4400', points: 25, radius: 13, hitboxRadius: 16, exploder: true, explosionRadius: 80 },
    crawler: { health: 35, speed: 2, damage: 8, color: '#1a3300', points: 15, radius: 8, hitboxRadius: 10, crawler: true },
    armored: { health: 30, armor: 50, speed: 1, damage: 12, color: '#666', points: 35, radius: 14, hitboxRadius: 18, armored: true, unarmoredColor: '#2d5016' }
};

// Bosses
const bossTypes = {
    giantTank: {
        name: "Giant Tank Boss",
        health: 800,
        speed: 0.5,
        damage: 30,
        color: '#4a0080',
        radius: 35,
        hitboxRadius: 40,
        points: 200,
        isBoss: true
    },
    mutantHorse: {
        name: "Mutant Horse Rider",
        health: 500,
        speed: 3.5,
        damage: 25,
        color: '#8b0000',
        radius: 30,
        hitboxRadius: 35,
        points: 250,
        isBoss: true,
        isHorse: true
    },
    spitterBoss: {
        name: "Spitter Boss",
        health: 400,
        speed: 1.5,
        damage: 20,
        color: '#2d5016',
        radius: 28,
        hitboxRadius: 32,
        points: 300,
        isBoss: true,
        ranged: true,
        rapidFire: true,
        projectileSpeed: 10
    }
};

// Crate
let crate = null;

// Medkit
let medkit = null;

// Particles
let particles = [];

// Camera shake
let shake = 0;

// Wave management
let zombiesToSpawn = 0;
let spawnTimer = 0;
let waveInProgress = false;

// Input handling
document.addEventListener('keydown', (e) => {
    player.keys[e.key.toLowerCase()] = true;
    
    if (e.code === 'Space') {
        isShooting = true;
        e.preventDefault();
    }
    
    if (e.key.toLowerCase() === 'r' && !reloading && currentMagazine < getMaxMagazine()) {
        startReload();
    }
    
    if (e.key.toLowerCase() === 'u') {
        toggleUpgradeMenu();
    }
    
    if (e.key.toLowerCase() === 'e' && crate && !game.upgradeMenuOpen) {
        openCrate();
    }
    
    if (e.key.toLowerCase() === 'e' && medkit && !game.upgradeMenuOpen) {
        openMedkit();
    }
    
    if (e.key.toLowerCase() === 'f' && !game.upgradeMenuOpen && game.running && !axe) {
        useAxe();
    }
});

document.addEventListener('keyup', (e) => {
    player.keys[e.key.toLowerCase()] = false;
    
    if (e.code === 'Space') {
        isShooting = false;
    }
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    player.angle = Math.atan2(mouseY - player.y, mouseX - player.x);
});

canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0 && !game.upgradeMenuOpen && game.running && !axe) {
        isShooting = true;
    }
});

canvas.addEventListener('mouseup', (e) => {
    if (e.button === 0) {
        isShooting = false;
    }
});

canvas.addEventListener('mouseleave', () => {
    isShooting = false;
});

document.getElementById('restartBtn').addEventListener('click', restartGame);

// Upgrade buttons
document.getElementById('upgradeDamage').addEventListener('click', () => buyUpgrade('damage', 100, 0.05));
document.getElementById('upgradeReload').addEventListener('click', () => buyUpgrade('reload', 80, 0.1));
document.getElementById('upgradeMag').addEventListener('click', () => buyUpgrade('mag', 60, 2));
document.getElementById('upgradeFireRate').addEventListener('click', () => buyUpgrade('fireRate', 90, 0.05));
document.getElementById('closeUpgrade').addEventListener('click', toggleUpgradeMenu);

function getMaxMagazine() {
    return currentWeapon.maxMagazine + weaponUpgrades.magazineBonus;
}

function buyUpgrade(type, cost, value) {
    if (game.points >= cost) {
        game.points -= cost;
        
        switch(type) {
            case 'damage':
                weaponUpgrades.damage += value;
                break;
            case 'reload':
                weaponUpgrades.reloadSpeed += value;
                break;
            case 'mag':
                weaponUpgrades.magazineBonus += value;
                currentMagazine += value;
                break;
            case 'fireRate':
                weaponUpgrades.fireRate -= value;
                break;
        }
        
        updateUI();
        updateUpgradeMenu();
    }
}

function toggleUpgradeMenu() {
    game.upgradeMenuOpen = !game.upgradeMenuOpen;
    document.getElementById('upgradeMenu').style.display = game.upgradeMenuOpen ? 'block' : 'none';
    if (game.upgradeMenuOpen) {
        isShooting = false;
        updateUpgradeMenu();
    }
}

function updateUpgradeMenu() {
    document.getElementById('upgradePoints').textContent = game.points;
    
    // Update button text with current prices and values
    document.getElementById('upgradeDamage').textContent = `Damage (+5%) - 100 pts (Current: ${Math.round((weaponUpgrades.damage - 1) * 100)}%)`;
    document.getElementById('upgradeReload').textContent = `Reload Speed (+10%) - 80 pts`;
    document.getElementById('upgradeMag').textContent = `Magazine Size (+2) - 60 pts (Current: +${weaponUpgrades.magazineBonus})`;
    document.getElementById('upgradeFireRate').textContent = `Fire Rate (+5%) - 90 pts`;
}

function startReload() {
    if (reloading || currentMagazine >= getMaxMagazine()) return;
    reloading = true;
    reloadStart = Date.now();
    document.getElementById('reloadStatus').textContent = 'RELOADING...';
}

function finishReload() {
    reloading = false;
    currentMagazine = getMaxMagazine();
    document.getElementById('reloadStatus').textContent = '';
    updateUI();
}

function useAxe() {
    const now = Date.now();
    if (now - lastAxeUse < AXE_COOLDOWN) return;
    
    lastAxeUse = now;
    axe = {
        startTime: now,
        angle: 0,
        radius: 20, // Close to player
        damage: weapons.pistol.damage / 3 * weaponUpgrades.damage,
        hitZombies: new Set()
    };
    
    // Stop shooting when axe is active
    isShooting = false;
}

function updateAxe() {
    if (!axe) return;
    
    const now = Date.now();
    const elapsed = now - axe.startTime;
    
    if (elapsed >= AXE_DURATION) {
        axe = null;
        return;
    }
    
    // Spin the axe (2 full rotations in 0.5 seconds)
    axe.angle = (elapsed / AXE_DURATION) * Math.PI * 4;
    
    // Calculate axe position
    const axeX = player.x + Math.cos(axe.angle) * axe.radius;
    const axeY = player.y + Math.sin(axe.angle) * axe.radius;
    
    // Check collisions with zombies
    zombies.forEach((zombie, index) => {
        if (axe.hitZombies.has(zombie.id)) return;
        
        const dx = zombie.x - axeX;
        const dy = zombie.y - axeY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < zombie.radius + 20) { // 20 is axe hit radius
            // Push zombie away strongly
            const pushAngle = Math.atan2(dy, dx);
            const pushForce = 150;
            zombie.x += Math.cos(pushAngle) * pushForce;
            zombie.y += Math.sin(pushAngle) * pushForce;
            
            // Damage zombie
            damageZombie(zombie, axe.damage, index);
            
            // Mark as hit so we don't hit same zombie multiple times per spin
            axe.hitZombies.add(zombie.id);
        }
    });
}

function drawAxe() {
    if (!axe) return;
    
    const axeX = player.x + Math.cos(axe.angle) * axe.radius;
    const axeY = player.y + Math.sin(axe.angle) * axe.radius;
    
    ctx.save();
    ctx.translate(axeX, axeY);
    ctx.rotate(axe.angle + Math.PI / 4);
    
    // Simple small axe design (the original one)
    // Handle
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(-2, -12, 4, 20);
    
    // Axe head
    ctx.fillStyle = '#c0c0c0';
    ctx.beginPath();
    ctx.moveTo(-2, -12);
    ctx.lineTo(2, -12);
    ctx.lineTo(6, -8);
    ctx.quadraticCurveTo(8, -4, 6, 0);
    ctx.lineTo(2, -4);
    ctx.lineTo(-2, -4);
    ctx.closePath();
    ctx.fill();
    
    // Blade edge
    ctx.fillStyle = '#e0e0e0';
    ctx.beginPath();
    ctx.moveTo(6, -8);
    ctx.quadraticCurveTo(8, -4, 6, 0);
    ctx.lineTo(4, -2);
    ctx.quadraticCurveTo(6, -4, 4, -6);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
}

function updateShooting() {
    // Can't shoot while axe is spinning
    if (axe || !isShooting || reloading || game.upgradeMenuOpen || !game.running) return;
    
    const now = Date.now();
    const fireRate = currentWeapon.fireRate * weaponUpgrades.fireRate;
    
    if (now - lastShot < fireRate) return;
    
    if (currentMagazine <= 0) {
        startReload();
        return;
    }
    
    lastShot = now;
    
    const burstCount = currentWeapon.burst || 1;
    
    for (let i = 0; i < burstCount; i++) {
        setTimeout(() => {
            if (currentMagazine > 0 && isShooting && !axe) { // Extra check for axe
                createProjectile();
                currentMagazine--;
                updateUI();
                
                if (currentMagazine === 0) {
                    startReload();
                }
            }
        }, i * 50);
    }
}

function createProjectile() {
    const spread = currentWeapon.burst > 1 ? (Math.random() - 0.5) * 0.1 : 0;
    const angle = player.angle + spread;
    
    projectiles.push({
        x: player.x + Math.cos(angle) * 20,
        y: player.y + Math.sin(angle) * 20,
        vx: Math.cos(angle) * currentWeapon.projectileSpeed,
        vy: Math.sin(angle) * currentWeapon.projectileSpeed,
        damage: currentWeapon.damage * weaponUpgrades.damage,
        color: currentWeapon.color,
        explosive: currentWeapon.explosive || false,
        explosionRadius: currentWeapon.explosionRadius || 0,
        isPlayer: true
    });
    
    // Recoil effect
    shake = 2;
}

function spawnZombie(type, isBoss = false) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.max(canvas.width, canvas.height) / 2 + 50;
    
    let zombieData;
    if (isBoss) {
        zombieData = bossTypes[type];
    } else {
        zombieData = zombieTypes[type];
    }
    
    const zombie = {
        x: player.x + Math.cos(angle) * distance,
        y: player.y + Math.sin(angle) * distance,
        ...zombieData,
        maxHealth: zombieData.health,
        armor: zombieData.armor || 0,
        maxArmor: zombieData.armor || 0,
        vx: 0,
        vy: 0,
        attackCooldown: 0,
        id: Math.random()
    };
    
    // Assign rider type for horses
    if (zombie.isHorse && !isBoss) {
        zombie.riderType = Math.random() < 0.5 ? 'normal' : 'ranged';
    }
    
    zombies.push(zombie);
}

function startWave() {
    waveInProgress = true;
    game.bossRound = game.round % 10 === 0;
    
    if (game.bossRound) {
        document.getElementById('bossWarning').style.display = 'block';
        setTimeout(() => {
            document.getElementById('bossWarning').style.display = 'none';
        }, 3000);
        
        // Spawn boss
        const bossTypesList = ['giantTank', 'mutantHorse', 'spitterBoss'];
        const randomBoss = bossTypesList[Math.floor(Math.random() * bossTypesList.length)];
        spawnZombie(randomBoss, true);
        
        // Spawn some normal zombies with boss
        zombiesToSpawn = 5 + Math.floor(game.round / 5);
    } else {
        // Normal wave
        zombiesToSpawn = 5 + Math.floor(game.round * 1.5);
        
        // Add special zombies in later rounds
        if (game.round > 3) {
            const specialCount = Math.floor(game.round / 3);
            for (let i = 0; i < specialCount; i++) {
                const types = ['fast', 'tank'];
                if (game.round > 5) types.push('horse', 'ranged');
                if (game.round > 8) types.push('exploder', 'crawler', 'armored');
                const type = types[Math.floor(Math.random() * types.length)];
                setTimeout(() => spawnZombie(type), Math.random() * 5000);
            }
        }
    }
    
    updateUI();
}

function dropCrate() {
    game.crateDropped = true;
    crate = {
        x: 100 + Math.random() * (canvas.width - 200),
        y: 100 + Math.random() * (canvas.height - 200),
        radius: 25,
        opened: false
    };
    
    document.getElementById('crateNotification').style.display = 'block';
    setTimeout(() => {
        document.getElementById('crateNotification').style.display = 'none';
    }, 3000);
}

function dropMedkit() {
    medkit = {
        x: 100 + Math.random() * (canvas.width - 200),
        y: 100 + Math.random() * (canvas.height - 200),
        radius: 20,
        opened: false
    };
}

function openCrate() {
    if (!crate || crate.opened) return;
    
    const dx = player.x - crate.x;
    const dy = player.y - crate.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < 50) {
        crate.opened = true;
        
        // Determine weapon by rarity
        const roll = Math.random() * 100;
        let newWeapon;
        
        if (roll < 40) {
            newWeapon = weapons.semiRifle;
        } else if (roll < 65) {
            newWeapon = weapons.burstRifle;
        } else if (roll < 85) {
            newWeapon = weapons.assaultRifle;
        } else {
            newWeapon = weapons.rpg;
        }
        
        currentWeapon = { ...newWeapon };
        currentMagazine = getMaxMagazine();
        reloading = false;
        
        // Visual effect
        for (let i = 0; i < 20; i++) {
            particles.push({
                x: crate.x,
                y: crate.y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 60,
                color: '#ffff00',
                size: 4
            });
        }
        
        setTimeout(() => {
            crate = null;
            game.crateDropped = false;
        }, 1000);
        
        updateUI();
    }
}

function openMedkit() {
    if (!medkit || medkit.opened) return;
    
    const dx = player.x - medkit.x;
    const dy = player.y - medkit.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < 50) {
        medkit.opened = true;
        
        // Heal to max
        player.health = player.maxHealth;
        
        // Visual effect (green cross particles)
        for (let i = 0; i < 15; i++) {
            particles.push({
                x: medkit.x,
                y: medkit.y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 60,
                color: '#00ff00',
                size: 5
            });
        }
        
        setTimeout(() => {
            medkit = null;
        }, 1000);
        
        updateUI();
    }
}

function updateZombies() {
    zombies.forEach((zombie, index) => {
        // Calculate distance to player
        const dx = player.x - zombie.x;
        const dy = player.y - zombie.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Horse with ranged rider stops at distance to shoot
        let shouldMove = true;
        if (zombie.isHorse && zombie.riderType === 'ranged' && dist < 250 && dist > 150) {
            shouldMove = false;
        }
        
        // Movement
        if (shouldMove) {
            if (!zombie.ranged || dist > 200) {
                const speed = zombie.speed * (1 + game.round * 0.05);
                zombie.vx = (dx / dist) * speed;
                zombie.vy = (dy / dist) * speed;
                
                if (zombie.crawler) {
                    zombie.vx *= 1.3;
                    zombie.vy *= 1.3;
                }
                
                zombie.x += zombie.vx;
                zombie.y += zombie.vy;
            } else if (zombie.ranged) {
                // Ranged zombies maintain distance
                if (dist < 150) {
                    zombie.x -= (dx / dist) * zombie.speed * 0.5;
                    zombie.y -= (dy / dist) * zombie.speed * 0.5;
                }
            }
        }
        
        // Keep minimum distance from player to prevent invincibility glitch
        const minDistance = player.radius + zombie.hitboxRadius + 5;
        if (dist < minDistance) {
            const pushAngle = Math.atan2(dy, dx);
            zombie.x = player.x - Math.cos(pushAngle) * minDistance;
            zombie.y = player.y - Math.sin(pushAngle) * minDistance;
        }
        
        // Bounds check
        zombie.x = Math.max(zombie.radius, Math.min(canvas.width - zombie.radius, zombie.x));
        zombie.y = Math.max(zombie.radius, Math.min(canvas.height - zombie.radius, zombie.y));
        
        // Attack
        if (dist < zombie.hitboxRadius + player.radius && zombie.attackCooldown <= 0) {
            if (!zombie.exploder) {
                damagePlayer(zombie.damage);
                zombie.attackCooldown = 60;
            } else {
                // Exploder explodes
                createExplosion(zombie.x, zombie.y, zombie.explosionRadius, zombie.damage);
                zombies.splice(index, 1);
                return;
            }
        }
        
        // Ranged attack (including horse riders)
        const canShoot = (zombie.ranged || (zombie.isHorse && zombie.riderType === 'ranged'));
        if (canShoot && dist < 400 && zombie.attackCooldown <= 0) {
            const angle = Math.atan2(dy, dx);
            const accuracy = zombie.isBoss ? 0.9 : 0.7;
            
            if (Math.random() < accuracy) {
                projectiles.push({
                    x: zombie.x,
                    y: zombie.y,
                    vx: Math.cos(angle) * (zombie.projectileSpeed || 6),
                    vy: Math.sin(angle) * (zombie.projectileSpeed || 6),
                    damage: zombie.damage,
                    color: '#8b0000',
                    isPlayer: false
                });
            }
            
            zombie.attackCooldown = zombie.rapidFire ? 30 : 90;
        }
        
        if (zombie.attackCooldown > 0) zombie.attackCooldown--;
        
        // Horse rider melee (only if normal rider)
        if (zombie.isHorse && zombie.riderType === 'normal' && dist < zombie.hitboxRadius + player.radius + 10 && zombie.attackCooldown <= 0) {
            damagePlayer(zombie.damage * 1.5);
            zombie.attackCooldown = 45;
        }
    });
}

function createExplosion(x, y, radius, damage) {
    shake = 10;
    
    // Damage nearby zombies
    zombies.forEach(zombie => {
        const dx = zombie.x - x;
        const dy = zombie.y - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < radius) {
            const dmg = damage * (1 - dist / radius);
            damageZombie(zombie, dmg, zombies.indexOf(zombie));
        }
    });
    
    // Damage player if in radius
    const dx = player.x - x;
    const dy = player.y - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < radius) {
        damagePlayer(damage * 0.5 * (1 - dist / radius));
    }
    
    // Visual effect
    for (let i = 0; i < 30; i++) {
        const angle = (Math.PI * 2 * i) / 30;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * 8,
            vy: Math.sin(angle) * 8,
            life: 40,
            color: '#ff6600',
            size: 6
        });
    }
}

function damagePlayer(amount) {
    if (player.invulnerable > 0) return;
    
    player.health -= amount;
    player.invulnerable = 30;
    shake = 5;
    
    if (player.health <= 0) {
        gameOver();
    }
    
    updateUI();
}

function damageZombie(zombie, damage, index) {
    // Handle one-tap for fast zombies
    if (zombie.oneTap && damage >= 25) {
        damage = zombie.health + zombie.armor; // Instakill
    }
    
    // Handle armor
    if (zombie.armor > 0) {
        zombie.armor -= damage;
        if (zombie.armor < 0) {
            zombie.health += zombie.armor;
            zombie.armor = 0;
            // Armor broke - reveal regular zombie color
            if (zombie.unarmoredColor) {
                zombie.color = zombie.unarmoredColor;
            }
        }
        return;
    }
    
    zombie.health -= damage;
    
    if (zombie.health <= 0) {
        // Zombie death
        game.points += zombie.points;
        game.zombiesKilled++;
        
        // Create blood particles
        for (let i = 0; i < 10; i++) {
            particles.push({
                x: zombie.x,
                y: zombie.y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 30,
                color: '#8b0000',
                size: 3
            });
        }
        
        zombies.splice(index, 1);
        updateUI();
    }
}

function updateProjectiles() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const proj = projectiles[i];
        proj.x += proj.vx;
        proj.y += proj.vy;
        
        // Check bounds
        if (proj.x < 0 || proj.x > canvas.width || proj.y < 0 || proj.y > canvas.height) {
            projectiles.splice(i, 1);
            continue;
        }
        
        if (proj.isPlayer) {
            // Check zombie hits using hitboxRadius
            for (let j = zombies.length - 1; j >= 0; j--) {
                const zombie = zombies[j];
                const dx = proj.x - zombie.x;
                const dy = proj.y - zombie.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < zombie.hitboxRadius + 5) {
                    if (proj.explosive) {
                        createExplosion(proj.x, proj.y, proj.explosionRadius, proj.damage);
                    } else {
                        damageZombie(zombie, proj.damage, j);
                    }
                    
                    if (!proj.explosive) {
                        projectiles.splice(i, 1);
                        break;
                    }
                }
            }
        } else {
            // Enemy projectile hitting player
            const dx = proj.x - player.x;
            const dy = proj.y - player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < player.radius + 5) {
                damagePlayer(proj.damage);
                projectiles.splice(i, 1);
            }
        }
    }
}

function updatePlayer() {
    // Movement
    let dx = 0;
    let dy = 0;
    
    if (player.keys['w'] || player.keys['arrowup']) dy = -1;
    if (player.keys['s'] || player.keys['arrowdown']) dy = 1;
    if (player.keys['a'] || player.keys['arrowleft']) dx = -1;
    if (player.keys['d'] || player.keys['arrowright']) dx = 1;
    
    if (dx !== 0 || dy !== 0) {
        const len = Math.sqrt(dx * dx + dy * dy);
        dx /= len;
        dy /= len;
        
        player.x += dx * player.speed;
        player.y += dy * player.speed;
        
        // Bounds
        player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
        player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));
    }
    
    if (player.invulnerable > 0) player.invulnerable--;
    
    // Reload check
    if (reloading) {
        const reloadDuration = currentWeapon.reloadTime / (1 + weaponUpgrades.reloadSpeed - 1);
        if (Date.now() - reloadStart >= reloadDuration) {
            finishReload();
        }
    }
    
    // Auto reload when empty
    if (currentMagazine === 0 && !reloading) {
        startReload();
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function updateWave() {
    if (!waveInProgress) {
        if (zombies.length === 0) {
            startWave();
        }
        return;
    }
    
    // Spawn zombies
    if (zombiesToSpawn > 0) {
        spawnTimer++;
        if (spawnTimer > 60) {
            const types = ['normal'];
            if (game.round > 2) types.push('fast');
            if (game.round > 4) types.push('tank');
            if (game.round > 6) types.push('horse', 'ranged');
            if (game.round > 8) types.push('exploder', 'crawler', 'armored');
            
            const type = types[Math.floor(Math.random() * types.length)];
            spawnZombie(type);
            zombiesToSpawn--;
            spawnTimer = 0;
        }
    } else if (zombies.length === 0) {
        // Wave complete
        waveInProgress = false;
        game.round++;
        
        // Drop crate every 5 rounds
        if ((game.round - 1) % 5 === 0) {
            dropCrate();
            dropMedkit(); // Drop medkit with crate
        }
        
        // Heal player slightly
        player.health = Math.min(player.maxHealth, player.health + 10);
        
        updateUI();
    }
}

function draw() {
    // Clear with shake effect
    const shakeX = (Math.random() - 0.5) * shake;
    const shakeY = (Math.random() - 0.5) * shake;
    shake *= 0.9;
    
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.save();
    ctx.translate(shakeX, shakeY);
    
    // Draw grid floor
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    
    // Draw medkit
    if (medkit) {
        // White box with red cross
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(medkit.x - medkit.radius, medkit.y - medkit.radius, medkit.radius * 2, medkit.radius * 2);
        
        // Red cross
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(medkit.x - 4, medkit.y - 12, 8, 24);
        ctx.fillRect(medkit.x - 12, medkit.y - 4, 24, 8);
        
        // Border
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;
        ctx.strokeRect(medkit.x - medkit.radius, medkit.y - medkit.radius, medkit.radius * 2, medkit.radius * 2);
        
        // Label
        if (!medkit.opened) {
            ctx.fillStyle = '#00ff00';
            ctx.font = '12px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText('MEDKIT [E]', medkit.x, medkit.y - 28);
        }
    }
    
    // Draw crate
    if (crate) {
        ctx.fillStyle = crate.opened ? '#444' : '#8b4513';
        ctx.fillRect(crate.x - crate.radius, crate.y - crate.radius, crate.radius * 2, crate.radius * 2);
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 3;
        ctx.strokeRect(crate.x - crate.radius, crate.y - crate.radius, crate.radius * 2, crate.radius * 2);
        
        // Crate label
        if (!crate.opened) {
            ctx.fillStyle = '#ffff00';
            ctx.font = '12px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText('CRATE [E]', crate.x, crate.y - 30);
        }
        
        // Glow effect
        if (!crate.opened) {
            ctx.shadowColor = '#ffff00';
            ctx.shadowBlur = 20;
            ctx.strokeRect(crate.x - crate.radius, crate.y - crate.radius, crate.radius * 2, crate.radius * 2);
            ctx.shadowBlur = 0;
        }
    }
    
    // Draw particles
    particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / 30;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    });
    
    // Draw projectiles
    projectiles.forEach(proj => {
        ctx.fillStyle = proj.color;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Trail
        ctx.strokeStyle = proj.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(proj.x, proj.y);
        ctx.lineTo(proj.x - proj.vx * 2, proj.y - proj.vy * 2);
        ctx.stroke();
    });
    
    // Draw zombies
    zombies.forEach(zombie => {
        ctx.save();
        ctx.translate(zombie.x, zombie.y);
        
        // Armor indicator
        if (zombie.armor > 0) {
            ctx.strokeStyle = '#888';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, zombie.radius + 5, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Body
        ctx.fillStyle = zombie.color;
        ctx.beginPath();
        if (zombie.crawler) {
            ctx.ellipse(0, 5, zombie.radius, zombie.radius * 0.6, 0, 0, Math.PI * 2);
        } else {
            ctx.arc(0, 0, zombie.radius, 0, Math.PI * 2);
        }
        ctx.fill();
        
        // Horse with rider
        if (zombie.isHorse) {
            // Horse body
            ctx.fillStyle = '#3d2817';
            ctx.fillRect(-15, -5, 30, 10);
            ctx.fillRect(-10, -15, 5, 20);
            ctx.fillRect(5, -15, 5, 20);
            
            // Rider
            if (zombie.riderType === 'normal') {
                // Normal zombie rider (green)
                ctx.fillStyle = '#2d5016';
                ctx.beginPath();
                ctx.arc(0, -20, 8, 0, Math.PI * 2);
                ctx.fill();
            } else if (zombie.riderType === 'ranged') {
                // Ranged zombie rider (dark gray)
                ctx.fillStyle = '#2d2d2d';
                ctx.beginPath();
                ctx.arc(0, -20, 8, 0, Math.PI * 2);
                ctx.fill();
                // Little gun indicator
                ctx.fillStyle = '#666';
                ctx.fillRect(5, -22, 8, 4);
            }
        }
        
        // Health bar for bosses and tanks
        if (zombie.isBoss || zombie.maxHealth > 100) {
            const barWidth = 40;
            const healthPct = zombie.health / zombie.maxHealth;
            ctx.fillStyle = '#330000';
            ctx.fillRect(-barWidth/2, -zombie.radius - 15, barWidth, 6);
            ctx.fillStyle = healthPct > 0.5 ? '#00ff00' : healthPct > 0.25 ? '#ffff00' : '#ff0000';
            ctx.fillRect(-barWidth/2, -zombie.radius - 15, barWidth * healthPct, 6);
        }
        
        // Boss name
        if (zombie.isBoss) {
            ctx.fillStyle = '#ff0000';
            ctx.font = 'bold 14px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText(zombie.name, 0, -zombie.radius - 25);
        }
        
        ctx.restore();
    });
    
    // Draw Axe (behind player)
    drawAxe();
    
    // Draw player
    ctx.save();
    ctx.translate(player.x, player.y);
    
    // Invulnerability flash
    if (player.invulnerable > 0 && Math.floor(Date.now() / 50) % 2 === 0) {
        ctx.globalAlpha = 0.5;
    }
    
    // Body
    ctx.fillStyle = '#4488ff';
    ctx.beginPath();
    ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Gun (don't draw if axe is active)
    if (!axe) {
        ctx.rotate(player.angle);
        ctx.fillStyle = currentWeapon.color;
        ctx.fillRect(10, -4, 20, 8);
    }
    
    // Reload indicator
    if (reloading) {
        const progress = (Date.now() - reloadStart) / (currentWeapon.reloadTime / weaponUpgrades.reloadSpeed);
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, player.radius + 8, -Math.PI/2, -Math.PI/2 + Math.PI * 2 * Math.min(1, progress));
        ctx.stroke();
    }
    
    ctx.restore();
    
    ctx.restore();
}

function updateUI() {
    document.getElementById('round').textContent = game.round;
    document.getElementById('points').textContent = game.points;
    document.getElementById('zombieCount').textContent = zombies.length + zombiesToSpawn;
    document.getElementById('healthBar').style.width = (player.health / player.maxHealth * 100) + '%';
    document.getElementById('currentWeapon').textContent = 'Weapon: ' + currentWeapon.name;
    document.getElementById('ammo').textContent = `Ammo: ${currentMagazine}/${getMaxMagazine()}`;
    
    const roundsUntilCrate = 5 - ((game.round - 1) % 5);
    document.getElementById('crateTimer').textContent = roundsUntilCrate;
}

function gameOver() {
    game.running = false;
    isShooting = false;
    document.getElementById('finalRound').textContent = game.round;
    document.getElementById('finalPoints').textContent = game.points;
    document.getElementById('finalKills').textContent = game.zombiesKilled;
    document.getElementById('gameOver').style.display = 'block';
}

function restartGame() {
    // Reset game state
    game.running = true;
    game.round = 1;
    game.points = 0;
    game.zombiesKilled = 0;
    game.crateDropped = false;
    isShooting = false;
    axe = null;
    medkit = null;
    
    // Reset player
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    player.health = player.maxHealth;
    player.invulnerable = 0;
    
    // Reset weapons
    currentWeapon = { ...weapons.pistol };
    currentMagazine = currentWeapon.magazine;
    reloading = false;
    
    // Reset upgrades
    weaponUpgrades.damage = 1;
    weaponUpgrades.reloadSpeed = 1;
    weaponUpgrades.magazineBonus = 0;
    weaponUpgrades.fireRate = 1;
    
    // Clear entities
    zombies = [];
    projectiles = [];
    particles = [];
    crate = null;
    
    document.getElementById('gameOver').style.display = 'none';
    updateUI();
    startWave();
}

function gameLoop() {
    if (!game.running || game.upgradeMenuOpen) {
        requestAnimationFrame(gameLoop);
        return;
    }
    
    updatePlayer();
    updateZombies();
    updateProjectiles();
    updateParticles();
    updateWave();
    updateShooting(); // Continuous shooting while holding
    updateAxe();
    
    draw();
    
    requestAnimationFrame(gameLoop);
}

// Start game
updateUI();
startWave();
gameLoop();

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
    lastTime: 0,
    zombieBookOpen: false
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
    shotgun: {
        name: "Shotgun",
        damage: 12.5,
        magazine: 7,
        maxMagazine: 7,
        fireRate: 600,
        reloadTime: 2500,
        color: '#8b4513',
        projectileSpeed: 10,
        automatic: false,
        burst: 1,
        pellets: 12,
        spread: 0.4,
        pierce: true,
        knockback: 7.5,
        canShootWhileReloading: true,
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
        selfDamage: false,
        rarity: 5
    }
};

let currentWeapon = { ...weapons.pistol };
let currentMagazine = currentWeapon.magazine;
let lastShot = 0;
let reloading = false;
let reloadStart = 0;

// Shooting state
let isShooting = false;
let isHolding = false;

// Axe system
let axe = null;
const AXE_DURATION = 500;
const AXE_COOLDOWN = 3000;
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
    normal: { health: 50, speed: 1.5, damage: 10, color: '#2d5016', points: 10, radius: 18, hitboxRadius: 22, desc: 'Standard enemy with average speed and health.' },
    fast: { health: 25, speed: 3, damage: 8, color: '#8b0000', points: 15, radius: 10, hitboxRadius: 12, oneTap: true, desc: 'Low health but very quick. Dies in one hit from pistol.' },
    tank: { health: 150, speed: 0.8, damage: 20, color: '#4a0080', points: 30, radius: 18, hitboxRadius: 22, desc: 'Very high health and slow. Dangerous if it gets close.' },
    horse: { health: 100, speed: 2.5, damage: 15, color: '#654321', points: 40, radius: 20, hitboxRadius: 24, isHorse: true, riderType: null, desc: 'Zombie riding a horse. Much faster than normal zombies.' },
    ranged: { health: 40, speed: 1.2, damage: 12, color: '#2d2d2d', points: 20, radius: 11, hitboxRadius: 14, ranged: true, projectileSpeed: 6, desc: 'Throws flesh chunks from a distance. Can miss if you move.' },
    exploder: { health: 60, speed: 2.2, damage: 25, color: '#ff4400', points: 25, radius: 13, hitboxRadius: 16, exploder: true, explosionRadius: 80, desc: 'Explodes when close to player, damaging nearby enemies.' },
    crawler: { health: 35, speed: 2, damage: 8, color: '#1a3300', points: 15, radius: 8, hitboxRadius: 10, crawler: true, desc: 'Crawls on ground. Harder to hit due to low profile.' },
    armored: { health: 30, armor: 50, speed: 1, damage: 12, color: '#666', points: 35, radius: 14, hitboxRadius: 18, armored: true, unarmoredColor: '#2d5016', desc: 'Wears metal armor. Must break armor before damaging zombie inside.' }
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
        isBoss: true,
        desc: 'Extremely high health and very slow. Takes many bullets to defeat.'
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
        isHorse: true,
        desc: 'Huge zombie riding a mutated horse. Very fast and chases players.'
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
        projectileSpeed: 10,
        desc: 'Stronger ranged zombie that throws large flesh chunks rapidly.'
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
        isHolding = true;
        if (currentWeapon.automatic) {
            isShooting = true;
        }
        e.preventDefault();
    }
    
    if (e.key.toLowerCase() === 'r' && !reloading && currentMagazine < getMaxMagazine()) {
        startReload();
    }
    
    if (e.key.toLowerCase() === 'u') {
        toggleUpgradeMenu();
    }
    
    if (e.key.toLowerCase() === 'e' && crate && !game.upgradeMenuOpen && !game.zombieBookOpen) {
        openCrate();
    }
    
    if (e.key.toLowerCase() === 'e' && medkit && !game.upgradeMenuOpen && !game.zombieBookOpen) {
        openMedkit();
    }
    
    if (e.key.toLowerCase() === 'f' && !game.upgradeMenuOpen && !game.zombieBookOpen && game.running && !axe) {
        useAxe();
    }
    
    if (e.key.toLowerCase() === 'b') {
        toggleZombieBook();
    }
});

document.addEventListener('keyup', (e) => {
    player.keys[e.key.toLowerCase()] = false;
    
    if (e.code === 'Space') {
        isHolding = false;
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
    if (e.button === 0 && !game.upgradeMenuOpen && !game.zombieBookOpen && game.running && !axe) {
        isHolding = true;
        shoot();
    }
});

canvas.addEventListener('mouseup', (e) => {
    if (e.button === 0) {
        isHolding = false;
        isShooting = false;
    }
});

canvas.addEventListener('mouseleave', () => {
    isHolding = false;
    isShooting = false;
});

document.getElementById('restartBtn').addEventListener('click', restartGame);
document.getElementById('zombieBookBtn').addEventListener('click', toggleZombieBook);

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
        isHolding = false;
        updateUpgradeMenu();
    }
}

function toggleZombieBook() {
    game.zombieBookOpen = !game.zombieBookOpen;
    const book = document.getElementById('zombieBook');
    if (book) {
        book.style.display = game.zombieBookOpen ? 'block' : 'none';
    } else {
        createZombieBook();
    }
    if (game.zombieBookOpen) {
        isShooting = false;
        isHolding = false;
    }
}

function createZombieBook() {
    const book = document.createElement('div');
    book.id = 'zombieBook';
    
    let html = '<h2>📖 ZOMBIE BESTIARY 📖</h2>';
    html += '<button class="close-book" onclick="toggleZombieBook()">Close [B]</button>';
    
    html += '<h3>Regular Zombies</h3>';
    html += '<div class="grid-2">';
    
    Object.entries(zombieTypes).forEach(([key, z]) => {
        const armorClass = z.armored ? 'armored' : '';
        const crawlerClass = z.crawler ? 'crawler' : '';
        
        html += `
            <div class="zombie-entry">
                <div class="zombie-header">
                    <div class="zombie-color ${armorClass} ${crawlerClass}" style="background: ${z.color};"></div>
                    <div>
                        <div class="zombie-name">${key.charAt(0).toUpperCase() + key.slice(1)} Zombie</div>
                        <div class="zombie-hp">HP: ${z.health}${z.armor ? '+' + z.armor + ' Armor' : ''}</div>
                    </div>
                </div>
                <div class="zombie-desc">${z.desc}</div>
                ${z.oneTap ? '<div class="zombie-warning">⚠️ One-shot kill</div>' : ''}
                ${z.ranged ? '<div class="zombie-warning">⚠️ Ranged attack</div>' : ''}
                ${z.exploder ? '<div class="zombie-warning">⚠️ Explodes on contact</div>' : ''}
            </div>
        `;
    });
    
    html += '</div>';
    
    html += '<h3>Boss Zombies</h3>';
    html += '<div class="grid-1">';
    
    Object.entries(bossTypes).forEach(([key, z]) => {
        html += `
            <div class="zombie-entry boss-entry">
                <div class="zombie-header">
                    <div class="zombie-color" style="background: ${z.color};"></div>
                    <div>
                        <div class="zombie-name">${z.name}</div>
                        <div class="zombie-hp">HP: ${z.health} | Points: ${z.points}</div>
                    </div>
                </div>
                <div class="zombie-desc">${z.desc}</div>
                ${z.ranged ? '<div class="zombie-warning">⚠️ Rapid ranged attacks</div>' : ''}
                ${z.isHorse ? '<div class="zombie-warning">⚠️ Extremely fast movement</div>' : ''}
            </div>
        `;
    });
    
    html += '</div>';
    
    book.innerHTML = html;
    document.getElementById('gameContainer').appendChild(book);
}

function updateUpgradeMenu() {
    document.getElementById('upgradePoints').textContent = game.points;
    
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

function cancelReload() {
    if (reloading) {
        reloading = false;
        document.getElementById('reloadStatus').textContent = '';
    }
}

function useAxe() {
    const now = Date.now();
    if (now - lastAxeUse < AXE_COOLDOWN) return;
    
    lastAxeUse = now;
    axe = {
        startTime: now,
        angle: 0,
        radius: 20,
        damage: weapons.pistol.damage / 3 * weaponUpgrades.damage,
        hitZombies: new Set()
    };
    
    isShooting = false;
    isHolding = false;
}

function updateAxe() {
    if (!axe) return;
    
    const now = Date.now();
    const elapsed = now - axe.startTime;
    
    if (elapsed >= AXE_DURATION) {
        axe = null;
        return;
    }
    
    axe.angle = (elapsed / AXE_DURATION) * Math.PI * 4;
    
    const axeX = player.x + Math.cos(axe.angle) * axe.radius;
    const axeY = player.y + Math.sin(axe.angle) * axe.radius;
    
    zombies.forEach((zombie, index) => {
        if (axe.hitZombies.has(zombie.id)) return;
        
        const dx = zombie.x - axeX;
        const dy = zombie.y - axeY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < zombie.radius + 20) {
            const pushAngle = Math.atan2(dy, dx);
            const pushForce = 150;
            zombie.x += Math.cos(pushAngle) * pushForce;
            zombie.y += Math.sin(pushAngle) * pushForce;
            
            damageZombie(zombie, axe.damage, index);
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
    
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(-2, -12, 4, 20);
    
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

function shoot() {
    if (game.upgradeMenuOpen || game.zombieBookOpen || !game.running || axe) return;
    
    const now = Date.now();
    const fireRate = currentWeapon.fireRate * weaponUpgrades.fireRate;
    
    if (now - lastShot < fireRate) return;
    
    if (reloading && currentWeapon.canShootWhileReloading) {
        cancelReload();
    } else if (reloading) {
        return;
    }
    
    if (currentMagazine <= 0) {
        startReload();
        return;
    }
    
    lastShot = now;
    
    if (currentWeapon.knockback) {
        player.x -= Math.cos(player.angle) * currentWeapon.knockback;
        player.y -= Math.sin(player.angle) * currentWeapon.knockback;
        
        player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
        player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));
    }
    
    const pelletCount = currentWeapon.pellets || 1;
    
    for (let p = 0; p < pelletCount; p++) {
        const spread = currentWeapon.spread ? (Math.random() - 0.5) * currentWeapon.spread * 2 : 0;
        const burstSpread = currentWeapon.burst > 1 ? (Math.random() - 0.5) * 0.1 : 0;
        const angle = player.angle + spread + burstSpread;
        
        const projectile = {
            x: player.x + Math.cos(angle) * 20,
            y: player.y + Math.sin(angle) * 20,
            vx: Math.cos(angle) * currentWeapon.projectileSpeed,
            vy: Math.sin(angle) * currentWeapon.projectileSpeed,
            damage: currentWeapon.damage * weaponUpgrades.damage,
            color: currentWeapon.color,
            explosive: currentWeapon.explosive || false,
            explosionRadius: currentWeapon.explosionRadius || 0,
            pierce: currentWeapon.pierce || false,
            piercedZombies: new Set(),
            isPlayer: true
        };
        
        projectiles.push(projectile);
    }
    
    currentMagazine--;
    shake = currentWeapon.knockback ? 5 : 2;
    updateUI();
    
    if (currentMagazine === 0 && !currentWeapon.canShootWhileReloading) {
        startReload();
    }
}

function updateShooting() {
    if (currentWeapon.automatic && isHolding && !axe && !reloading && !game.upgradeMenuOpen && !game.zombieBookOpen && game.running) {
        const now = Date.now();
        const fireRate = currentWeapon.fireRate * weaponUpgrades.fireRate;
        
        if (now - lastShot >= fireRate) {
            shoot();
        }
    }
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
        
        const bossTypesList = ['giantTank', 'mutantHorse', 'spitterBoss'];
        const randomBoss = bossTypesList[Math.floor(Math.random() * bossTypesList.length)];
        spawnZombie(randomBoss, true);
        
        zombiesToSpawn = 5 + Math.floor(game.round / 5);
    } else {
        zombiesToSpawn = 5 + Math.floor(game.round * 1.5);
        
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
        
        const roll = Math.random() * 100;
        let newWeapon;
        
        if (roll < 35) {
            newWeapon = weapons.semiRifle;
        } else if (roll < 55) {
            newWeapon = weapons.burstRifle;
        } else if (roll < 75) {
            newWeapon = weapons.assaultRifle;
        } else if (roll < 90) {
            newWeapon = weapons.shotgun;
        } else {
            newWeapon = weapons.rpg;
        }
        
        currentWeapon = { ...newWeapon };
        currentMagazine = getMaxMagazine();
        reloading = false;
        
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
        player.health = player.maxHealth;
        
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

function resolveZombieCollisions() {
    for (let i = 0; i < zombies.length; i++) {
        for (let j = i + 1; j < zombies.length; j++) {
            const z1 = zombies[i];
            const z2 = zombies[j];
            
            const dx = z2.x - z1.x;
            const dy = z2.y - z1.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const minDist = z1.radius + z2.radius + 2;
            
            if (dist < minDist && dist > 0) {
                const overlap = minDist - dist;
                const pushX = (dx / dist) * overlap * 0.5;
                const pushY = (dy / dist) * overlap * 0.5;
                
                z1.x -= pushX;
                z1.y -= pushY;
                z2.x += pushX;
                z2.y += pushY;
            }
        }
    }
}

function updateZombies() {
    zombies.forEach((zombie) => {
        const dx = player.x - zombie.x;
        const dy = player.y - zombie.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        let shouldMove = true;
        if (zombie.isHorse && zombie.riderType === 'ranged' && dist < 250 && dist > 150) {
            shouldMove = false;
        }
        
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
                if (dist < 150) {
                    zombie.x -= (dx / dist) * zombie.speed * 0.5;
                    zombie.y -= (dy / dist) * zombie.speed * 0.5;
                }
            }
        }
        
        zombie.x = Math.max(zombie.radius, Math.min(canvas.width - zombie.radius, zombie.x));
        zombie.y = Math.max(zombie.radius, Math.min(canvas.height - zombie.radius, zombie.y));
        
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
    });
    
    resolveZombieCollisions();
    
    zombies.forEach((zombie, index) => {
        const dx = player.x - zombie.x;
        const dy = player.y - zombie.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        const touchDistance = zombie.radius + player.radius;
        if (dist < touchDistance && dist > 0) {
            const pushFactor = touchDistance / dist;
            zombie.x = player.x - dx * pushFactor;
            zombie.y = player.y - dy * pushFactor;
        }
        
        if (dist <= touchDistance + 2 && zombie.attackCooldown <= 0) {
            if (!zombie.exploder) {
                damagePlayer(zombie.damage);
                zombie.attackCooldown = 60;
            } else {
                createExplosion(zombie.x, zombie.y, zombie.explosionRadius, zombie.damage);
                zombies.splice(index, 1);
            }
        }
        
        if (zombie.isHorse && zombie.riderType === 'normal' && dist <= touchDistance + 5 && zombie.attackCooldown <= 0) {
            damagePlayer(zombie.damage * 1.5);
            zombie.attackCooldown = 45;
        }
    });
}

function createExplosion(x, y, radius, damage) {
    shake = 10;
    
    zombies.forEach(zombie => {
        const dx = zombie.x - x;
        const dy = zombie.y - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < radius) {
            const dmg = damage * (1 - dist / radius);
            damageZombie(zombie, dmg, zombies.indexOf(zombie));
        }
    });
    
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
    if (zombie.oneTap && damage >= 25) {
        damage = zombie.health + zombie.armor;
    }
    
    if (zombie.armor > 0) {
        zombie.armor -= damage;
        if (zombie.armor < 0) {
            zombie.health += zombie.armor;
            zombie.armor = 0;
            if (zombie.unarmoredColor) {
                zombie.color = zombie.unarmoredColor;
            }
        }
        return;
    }
    
    zombie.health -= damage;
    
    if (zombie.health <= 0) {
        game.points += zombie.points;
        game.zombiesKilled++;
        
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
        
        if (proj.x < 0 || proj.x > canvas.width || proj.y < 0 || proj.y > canvas.height) {
            projectiles.splice(i, 1);
            continue;
        }
        
        if (proj.isPlayer) {
            for (let j = zombies.length - 1; j >= 0; j--) {
                const zombie = zombies[j];
                
                if (proj.pierce && proj.piercedZombies && proj.piercedZombies.has(zombie.id)) {
                    continue;
                }
                
                const dx = proj.x - zombie.x;
                const dy = proj.y - zombie.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < zombie.hitboxRadius + 5) {
                    if (proj.explosive) {
                        createExplosion(proj.x, proj.y, proj.explosionRadius, proj.damage);
                        projectiles.splice(i, 1);
                        break;
                    } else {
                        damageZombie(zombie, proj.damage, j);
                        
                        if (proj.pierce) {
                            proj.piercedZombies.add(zombie.id);
                        } else {
                            projectiles.splice(i, 1);
                            break;
                        }
                    }
                }
            }
            
            if (proj.pierce && proj.piercedZombies && proj.piercedZombies.size >= 5) {
                const idx = projectiles.indexOf(proj);
                if (idx > -1) projectiles.splice(idx, 1);
            }
        } else {
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
        
        player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
        player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));
    }
    
    if (player.invulnerable > 0) player.invulnerable--;
    
    if (reloading) {
        const reloadDuration = currentWeapon.reloadTime / (1 + weaponUpgrades.reloadSpeed - 1);
        if (Date.now() - reloadStart >= reloadDuration) {
            finishReload();
        }
    }
    
    if (currentMagazine === 0 && !reloading && !currentWeapon.canShootWhileReloading) {
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
        waveInProgress = false;
        game.round++;
        
        if ((game.round - 1) % 5 === 0) {
            dropCrate();
            dropMedkit();
        }
        
        player.health = Math.min(player.maxHealth, player.health + 10);
        updateUI();
    }
}

function draw() {
    const shakeX = (Math.random() - 0.5) * shake;
    const shakeY = (Math.random() - 0.5) * shake;
    shake *= 0.9;
    
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.save();
    ctx.translate(shakeX, shakeY);
    
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
    
    if (medkit) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(medkit.x - medkit.radius, medkit.y - medkit.radius, medkit.radius * 2, medkit.radius * 2);
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(medkit.x - 4, medkit.y - 12, 8, 24);
        ctx.fillRect(medkit.x - 12, medkit.y - 4, 24, 8);
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;
        ctx.strokeRect(medkit.x - medkit.radius, medkit.y - medkit.radius, medkit.radius * 2, medkit.radius * 2);
        
        if (!medkit.opened) {
            ctx.fillStyle = '#00ff00';
            ctx.font = '12px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText('MEDKIT [E]', medkit.x, medkit.y - 28);
        }
    }
    
    if (crate) {
        ctx.fillStyle = crate.opened ? '#444' : '#8b4513';
        ctx.fillRect(crate.x - crate.radius, crate.y - crate.radius, crate.radius * 2, crate.radius * 2);
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 3;
        ctx.strokeRect(crate.x - crate.radius, crate.y - crate.radius, crate.radius * 2, crate.radius * 2);
        
        if (!crate.opened) {
            ctx.fillStyle = '#ffff00';
            ctx.font = '12px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText('CRATE [E]', crate.x, crate.y - 30);
        }
        
        if (!crate.opened) {
            ctx.shadowColor = '#ffff00';
            ctx.shadowBlur = 20;
            ctx.strokeRect(crate.x - crate.radius, crate.y - crate.radius, crate.radius * 2, crate.radius * 2);
            ctx.shadowBlur = 0;
        }
    }
    
    particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / 30;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    });
    
    projectiles.forEach(proj => {
        ctx.fillStyle = proj.color;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, proj.pierce ? 3 : 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = proj.color;
        ctx.lineWidth = proj.pierce ? 1 : 2;
        ctx.beginPath();
        ctx.moveTo(proj.x, proj.y);
        ctx.lineTo(proj.x - proj.vx * 2, proj.y - proj.vy * 2);
        ctx.stroke();
    });
    
    zombies.forEach(zombie => {
        ctx.save();
        ctx.translate(zombie.x, zombie.y);
        
        if (zombie.armor > 0) {
            ctx.strokeStyle = '#888';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, zombie.radius + 5, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.fillStyle = zombie.color;
        ctx.beginPath();
        if (zombie.crawler) {
            ctx.ellipse(0, 5, zombie.radius, zombie.radius * 0.6, 0, 0, Math.PI * 2);
        } else {
            ctx.arc(0, 0, zombie.radius, 0, Math.PI * 2);
        }
        ctx.fill();
        
        if (zombie.isHorse) {
            ctx.fillStyle = '#3d2817';
            ctx.fillRect(-15, -5, 30, 10);
            ctx.fillRect(-10, -15, 5, 20);
            ctx.fillRect(5, -15, 5, 20);
            
            if (zombie.riderType === 'normal') {
                ctx.fillStyle = '#2d5016';
                ctx.beginPath();
                ctx.arc(0, -20, 8, 0, Math.PI * 2);
                ctx.fill();
            } else if (zombie.riderType === 'ranged') {
                ctx.fillStyle = '#2d2d2d';
                ctx.beginPath();
                ctx.arc(0, -20, 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#666';
                ctx.fillRect(5, -22, 8, 4);
            }
        }
        
        if (zombie.isBoss || zombie.maxHealth > 100) {
            const barWidth = 40;
            const healthPct = zombie.health / zombie.maxHealth;
            ctx.fillStyle = '#330000';
            ctx.fillRect(-barWidth/2, -zombie.radius - 15, barWidth, 6);
            ctx.fillStyle = healthPct > 0.5 ? '#00ff00' : healthPct > 0.25 ? '#ffff00' : '#ff0000';
            ctx.fillRect(-barWidth/2, -zombie.radius - 15, barWidth * healthPct, 6);
        }
        
        if (zombie.isBoss) {
            ctx.fillStyle = '#ff0000';
            ctx.font = 'bold 14px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText(zombie.name, 0, -zombie.radius - 25);
        }
        
        ctx.restore();
    });
    
    drawAxe();
    
    ctx.save();
    ctx.translate(player.x, player.y);
    
    if (player.invulnerable > 0 && Math.floor(Date.now() / 50) % 2 === 0) {
        ctx.globalAlpha = 0.5;
    }
    
    ctx.fillStyle = '#4488ff';
    ctx.beginPath();
    ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
    ctx.fill();
    
    if (!axe) {
        ctx.rotate(player.angle);
        ctx.fillStyle = currentWeapon.color;
        ctx.fillRect(10, -4, 20, 8);
    }
    
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
    isHolding = false;
    document.getElementById('finalRound').textContent = game.round;
    document.getElementById('finalPoints').textContent = game.points;
    document.getElementById('finalKills').textContent = game.zombiesKilled;
    document.getElementById('gameOver').style.display = 'block';
}

function restartGame() {
    game.running = true;
    game.round = 1;
    game.points = 0;
    game.zombiesKilled = 0;
    game.crateDropped = false;
    isShooting = false;
    isHolding = false;
    axe = null;
    medkit = null;
    
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    player.health = player.maxHealth;
    player.invulnerable = 0;
    
    currentWeapon = { ...weapons.pistol };
    currentMagazine = currentWeapon.magazine;
    reloading = false;
    
    weaponUpgrades.damage = 1;
    weaponUpgrades.reloadSpeed = 1;
    weaponUpgrades.magazineBonus = 0;
    weaponUpgrades.fireRate = 1;
    
    zombies = [];
    projectiles = [];
    particles = [];
    crate = null;
    
    const book = document.getElementById('zombieBook');
    if (book) book.style.display = 'none';
    game.zombieBookOpen = false;
    
    document.getElementById('gameOver').style.display = 'none';
    updateUI();
    startWave();
}

function gameLoop() {
    if (!game.running || game.upgradeMenuOpen || game.zombieBookOpen) {
        requestAnimationFrame(gameLoop);
        return;
    }
    
    updatePlayer();
    updateZombies();
    updateProjectiles();
    updateParticles();
    updateWave();
    updateShooting();
    updateAxe();
    
    draw();
    
    requestAnimationFrame(gameLoop);
}

// Start game
updateUI();
startWave();
gameLoop();

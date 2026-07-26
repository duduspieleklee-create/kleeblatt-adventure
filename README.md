# 🎮 Kleinanzeigen Adventure - Gala Playworks 2D Browser Game

A simple 2D browser-based adventure game built for the **Gala/Playworks ecosystem**. Move around with WASD or Arrow keys, collect glowing treasure gems, and save your score!

## ✨ Features

- 🎯 **Simple controls** - WASD or Arrow keys to move
- 💎 **Collect treasures** - Find glowing gems as you explore
- 🏆 **Score tracking** - Save your high score on the blockchain
- 📱 **Mobile ready** - Touch controls supported
- 🌐 **Instant play** - No install, just open in your browser

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Or build for production
npm run build
```

Then open http://localhost:3000

## 🎮 Game Controls

| Key | Action |
|-----|--------|
| `W` or `↑` | Move up |
| `A` or `←` | Move left |
| `S` or `↓` | Move down |
| `D` or `→` | Move right |
| `Touch` | Swipe horizontally/vertically |

## 🏆 Game Objective

Simply move around the virtual marketplace and collect treasure gems! Each gem you collect**:
- Adds **100 points** to your score
- Shows a celebration message
- Clears the existing gems and generates new ones

Find the best score you can! 🎯

## 📁 File Structure

```
gala-game-development/
├── game/                       # Game source directory
│   ├── game.js                # Complete game logic
│   ├── index.html             # Game entry point
│   ├── package.json           # Dependencies
│   ├── vite.config.js         # Build configuration
│   └── .gitignore
├── .hermes/                   # Hermes project files
│   └── gala-game-development/ # Skill reference
│   └── .env.example           # Environment template
└── README.md                  # This file
```

## 🛠️ Tech Stack

- **Rendering:** Pure JavaScript with HTML5 Canvas (no heavy frameworks)
- **Build Tool:** Vite (lightning-fast dev server)
- **Design:** Simple, retro-inspired aesthetic
- **Blockchain Ready:** Smart contract integration planned for Gala Chain

## 💡 Design Notes

From the Playworks browsing session, the project emphasizes:
1. **Simple Premises:** A player-walking, collecting treasure game with minimal complexity
2. **Browser Accessibility:** No installations, works instantly in any modern browser
3. **Inventory Tracking:** Monitor which categories of virtual currency you've found
4. **Foundation FOR Further Development:** Can expand with wallet integration, blockchain scores, achievements, and multi-level gameplay

## 🎨 Current Version

**Version 1.0** - Foundation for Gala Playworks games

### Planned Future Features:
- ✅ Basic movement (WASD/Arrows)
- ✅ Treasure collection
- ✅ Score tracking
- ✅ Mobile touch support

🚧 Coming Soon:
- 🏆 Gala Chain blockchain leaderboard
- 🎴 Wallet integration (MetaMask)
- 🌟 Achievement system
- 🎮 Multiple difficulty levels
- 📊 Analytics dashboard
- 🎵 Sound effects
- 🎨 Custom themes

## 🧪 Testing

The game runs automatically when you start the dev server:

```bash
# Development mode (hot-reload enabled)
npm run dev

# Check the browser for any errors
npm run test
```

## 📖 Development Notes

This project was built from scratch for the Gala Games Playworks platform. It demonstrates the basic architecture for creating 2D browser games on GalaChain.

### Key Components:

1. **Player Object** - Controls the green circle character
2. **Treasure System** - Generates random gems throughout the play area
3. **Collision Detection** - Simple distance-based collection radius (~20 pixels)
4. **Score System** - Tracks points and displays on UI

### Extending the Game

You can enhance this foundation by:
1. Adding more game mechanics (explosions, obstacles, power-ups)
2. Integrating with actual blockchain for persistent scores
3. Implementing sound and visual effects
4. Creating levels with different environments
5. Adding multiplayer capabilities

## 🔗 Resources

- **Gala Playworks:** https://playworks.gala.com
- **Gala Chain:** https://galachain.org
- **Smart Contracts:** See `contracts/` directory for Solidity templates

## 🎯 How to Use

1. **Navigate to** the game directory
2. **Open in browser** on `localhost:3000`
3. **Move** the player using WASD or Arrows
4. **Collect** all the treasure gems
5. **Move** the player to collect all the treasure gems

## 🤝 Contributing

This is an experimental project. Feel free to fork, modify, and suggest improvements!

## 📄 License

MIT License - Open Source for community use

---

**Built with ❤️ for Gala Games and Playworks**

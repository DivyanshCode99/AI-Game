# 🚀 Quick Start - Pose Runner

## 30 Second Intro

This is an AI-powered endless runner game where you control a character using YOUR BODY MOVEMENTS!

- 🕹️ **Controls**: Move left/right, jump, or activate RAGE using body poses
- 🎮 **Goal**: Survive obstacles, build combos, rack up points
- 📚 **Tech**: TensorFlow.js + Teachable Machine pose detection
- ⚡ **Special**: RAGE MODE destroys obstacles & 2x points

## Get Playing in 5 Minutes

### Step 1: Train Your AI Model (3 minutes)
Go to: https://teachablemachine.withgoogle.com/

1. Click "Get Started"
2. Choose "Pose"
3. Create 5 poses by clicking "Hold to Record":
   - **left**: Arm out to the left
   - **right**: Arm out to the right
   - **jump**: Both arms up
   - **rage**: Arms crossed on chest (activates RAGE MODE)
   - **idle**: Stand normally

4. Click "Train Model" (auto-trains)
5. Click "Export Model" → "TensorFlow.js" → "Upload to Drive"
6. Copy your model ID from the URL

### Step 2: Configure Game (1 minute)
1. Open `index.html` in your browser
2. Enter your model URL in the side panel
3. Click "LOAD" and allow webcam access
4. The game is ready to play!

### Step 3: Play! (1 minute)
1. Open `index.html` in browser
2. Allow webcam access
3. Wait for model (~30 seconds)
4. Move your body to play!

## The 5 Poses

```
LEFT              RIGHT             JUMP              RAGE MODE         IDLE
  ↑                 ↑               /|\               ⚡ ⚡              | |
  |                 |               |                \ /              |
<-+-              +->                ▼                ▼                 ▼
  |                 |               Player         DESTROY             Player
  |                 |              Jumps           Obstacles           Stays
  ↓                 ↓                            2x Speed/Points
                                                                       
Arm Left       Arm Right          Arms Up        Arms Crossed         Normal
  = Move          = Move              = Jump      = RAGE ACTIVE       = Stay
Left Lane      Right Lane        Over Lasers    Destroy Blocks        Still
```

## Game Elements

| Element | What To Do |
|---------|-----------|
| 🟠 Orange Boulder | Move to different lane (can't jump over) |
| 🔵 Blue Laser Beam | Jump over OR activate RAGE MODE |
| 🟢 Green Character | This is YOU - move left/right/jump/rage |
| ⚡ Purple Aura | RAGE MODE active - destroys obstacles! |
| ❤️ Heart Icons | Your lives - hit by 3 obstacles = GAME OVER |

## Scoring

- **+1 Point** per obstacle avoided (base)
- **Combo Multiplier**: 6+ consecutive dodges = ×2 points
- **RAGE Multiplier**: Active RAGE MODE = ×2 points + ×2 in combo
- **Difficulty Scaling**: Speed increases every 15 points
- **Game Over**: Lose all 3 lives (hit 3 times without RAGE)
- **No End** - keep going forever!

## Troubleshooting

**Poses not detected?**
- Ensure good lighting (avoid backlighting/shadows)
- Move closer to camera (1-2 meters for best results)
- Perform poses with clear, confident movements
- Step fully into frame before starting game

**Model won't load?**
- Check internet connection
- Verify model URL ends with `/`
- Check browser console (F12 → Console tab)
- Try refreshing the page

**Game too hard/easy?**
- Higher confidence = stricter pose detection
- Perform poses more clearly if detection is slow
- Game difficulty auto-scales - get better by playing!

## Full Documentation

- 📖 **README.md** - Complete game features & API
- 📋 **SETUP.md** - Detailed setup with pictures
- 🎮 **RULES.md** - All game mechanics explained

## Tips for High Scores

1. **Master your poses** - Practice consistent, clear arm movements
2. **Build combos** - 6+ consecutive dodges = ×2 points (aiming for 6 is key!)
3. **Use RAGE strategically** - Save for tough patterns, use ×2 multiplier wisely
4. **Lane awareness** - Anticipate where obstacles will spawn (left/center/right)
5. **Jump timing** - Jump early for lasers, never for boulders (must lane-switch)
6. **Stay calm** - Pressure increases with speed, but reactions stay the same

## What You're Using

- ✅ **TensorFlow.js** - AI framework (free)
- ✅ **Teachable Machine** - Easy pose training (free)
- ✅ **Vanilla JavaScript** - No dependencies needed
- ✅ **Canvas API** - 2D graphics rendering

## Next Level

Want to customize? Edit these in `index.html`:

```javascript
const CONFIDENCE = 0.6;        // Pose detection confidence threshold
const RAGE_DURATION = 240;     // RAGE duration in frames (~4 seconds)
const RAGE_COOLDOWN = 600;     // RAGE cooldown in frames (~10 seconds)
const INV_DURATION = 90;       // Invincibility after hit (~1.5 seconds)
```

Or modify:
- Game speed (change `baseSpeed` - default 2.7)
- Spawn rate (change `spawnInterval` - default 130 frames)
- Graphics colors (search for hex codes like `#00eeff`)
- Lives (change `lives: 3` in `makeState()`)

## Common Errors

| Error | Fix |
|-------|-----|
| "Model load error" | Check internet, verify model URL ends with `/` |
| Poses not working | Better lighting, step into frame, perform clearly |
| Game won't start | Allow webcam, wait 30s for model load, reload |
| Actions too slow/unresponsive | Perform poses more clearly/confidently |
| Game runs slow | Close other browser tabs, check GPU usage |

---

## 🎮 Ready? Let's Go!

1. Train your model (5 min)
2. Update the URL (1 min)
3. Open index.html (instantly ready)
4. **PLAY!** 🚀

**Questions?** Check README.md or RULES.md for complete documentation.

**Have fun! 🎉**

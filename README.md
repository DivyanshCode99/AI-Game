# 🏃 Pose Runner - Body Movement Game

A fun, endless runner game controlled entirely by your body movements! Use pose detection with a Teachable Machine model to control a character dodging obstacles across three lanes.

## 🎮 Game Features

- **Body Movement Control**: Control the character using body poses detected by AI
- **3 Lanes**: Navigate between left, center, and right lanes
- **2 Obstacle Types**: 
  - **Boulders** (Orange): Ground-level obstacles - dodge by lane-switching
  - **Lasers** (Blue): Horizontal beams - dodge by jumping or RAGE MODE
- **RAGE MODE**: Arms crossed = 2× speed, destroys obstacles, 2× points (10s cooldown)
- **Combo System**: Build combos (6+ = ×2 bonus points)
- **Invincibility**: 1.5 second invulnerability after being hit (in non-RAGE mode)
- **Progressive Difficulty**: Speed increases every 15 points
- **3 Lives**: Start with 3 hearts, game over on 3rd hit
- **Real-time Pose Detection**: Smooth action detection with 0.6 confidence threshold

## 🎯 Pose to Action Mapping

Train these poses in your Teachable Machine model:

1. **Left Arm Out** → Move to Left Lane
   - Extend your left arm horizontally to the side

2. **Right Arm Out** → Move to Right Lane
   - Extend your right arm horizontally to the side

3. **Arms Up** → Jump
   - Raise both arms above your head (escapes lasers)

4. **Arms Crossed** → RAGE MODE
   - Cross both arms across your chest (destroys obstacles, 2× multiplier)

5. **Idle** → Stay in Current Lane
   - Stand normally with arms down or neutral

## 🚀 How to Play

1. **Open the Game**: Open `index.html` in a web browser
2. **Allow Webcam Access**: Grant permission when browser asks
3. **Wait for Model**: The AI model will load (may take 30 seconds)
4. **Move Your Body**: Perform poses to control the character
5. **Survive Obstacles**: Dodge, jump, or shield to survive
6. **Get High Score**: Collect points for each obstacle survived

## 📊 Game Mechanics

### Scoring
- **Base**: +1 point per obstacle avoided
- **Combo Bonus** (6+ combo): ×2 points per obstacle
- **RAGE Bonus**: ×2 points when RAGE is active + ×2 from combo
- **Speed Scaling**: Game speed increases every 15 points
- **Example**: With 7-combo + RAGE = 4 points per obstacle (1 × 2 × 2)

### Collision Rules
- **Boulders**: Hit if you're in same lane → -1 life
- **Lasers**: Hit if you're not jumping and in same lane → -1 life
- **RAGE Collision**: Obstacles destroyed instead of hitting
- **Invincibility**: 1.5 seconds after taking damage (enemies pass through)

### Lives & Game Over
- **Start**: 3 lives (shown as ♥ hearts)
- **Hit**: Lose 1 life, gain 1.5s invincibility
- **RAGE Hit**: Obstacle destroyed instead (no life lost)
- **Game Over**: 3rd hit = game over screen

## 🛠️ Setting Up Your Model

### Step 1: Create a Teachable Machine Project

1. Visit [Teachable Machine](https://teachablemachine.withgoogle.com/)
2. Click "Get Started"
3. Choose "Pose" project
4. Set project name to anything you like

### Step 2: Train Pose Classes

Create 5 classes and record 15-20 samples for each:

1. **Class: "left"** → Extended left arm pose
2. **Class: "right"** → Extended right arm pose
3. **Class: "jump"** → Both arms raised up
4. **Class: "shield"** → Both arms crossed
5. **Class: "idle"** → Neutral standing position

**Tips for Better Training:**
- Record multiple angles (front, slight left, slight right)
- Use consistent lighting
- Perform poses with clear, confident movements
- Include variations (e.g., arms at slightly different heights for "jump")

### Step 3: Export Model

1. Click "Export Model"
2. Choose "TensorFlow.js"
3. Upload to Google Drive (or host elsewhere)
4. Copy the model URL from Google Drive share link

### Step 4: Load in Game

1. Open `index.html` in a web browser
2. In the right panel, paste your Teachable Machine model URL
3. Click the **LOAD** button
4. Grant webcam access when prompted
5. Wait ~30 seconds for model to load
6. Click **START** button to begin!

The game will save your model URL in browser storage for next time.

## ⚙️ Configuration

You can adjust these constants in `index.html`:

```javascript
const CONFIDENCE_THRESHOLD = 0.6;    // 0-1: Higher = requires more confident pose
const ACTION_DEBOUNCE_MS = 150;      // Milliseconds before allowing next action
```

- **Lower confidence threshold**: More responsive but might misdetect
- **Higher confidence threshold**: More accurate but might miss actions
- **Lower debounce**: Faster lane switching but less stable
- **Higher debounce**: More stable but slower response

## 🎨 Game Elements

| Element | Color | Description |
|---------|-------|-------------|
| Player Character | Green (Cyan when shielded) | Your controllable character |
| Ground Obstacle | Red | Must dodge or shield |
| Low Barrier | Orange | Must jump or shield |
| Shield Aura | Cyan | Active shield indicator |
| Webcam Feed | Bottom right | Real-time pose detection preview |

## 📱 Responsive Design

- **Canvas Size**: 400x600 pixels
- **Viewport**: Centered in browser window
- **Webcam Preview**: 120x120 pixels in bottom-right corner
- **Works on**: Laptop, Desktop (requires webcam)

## 🐛 Troubleshooting

### Model Won't Load
- Check your internet connection
- Verify the model URL is correct and ends with `/`
- Check browser console for error messages (F12)

### Poses Not Detected
- Ensure good lighting
- Move closer to webcam (1-2 meters away)
- Make sure poses are clear and confident
- Check confidence threshold isn't too high

### Actions Too Responsive/Not Responsive
- Adjust `CONFIDENCE_THRESHOLD` (try 0.5-0.8)
- Adjust `ACTION_DEBOUNCE_MS` (try 100-300)

### Collision Detection Issues
- Poses in different lanes don't collide
- Jump detection works while `isJumping` is true
- Shield protects from any collision type

## 🎓 Learning Resources

- [Teachable Machine Docs](https://teachablemachine.withgoogle.com/faq)
- [TensorFlow.js Docs](https://js.tensorflow.org/)
- [Pose Detection Guide](https://github.com/tensorflow/tfjs-models/tree/master/pose-detection)

## 🎯 Tips for High Scores

1. **Learn the Timing**: Anticipate obstacle spawns
2. **Practice Your Poses**: Quick, confident movements
3. **Plan Ahead**: Think about your next move while dodging current obstacle
4. **Use Shield Wisely**: Save shield for situations where you can't dodge
5. **Stay Calm**: Don't make jerky movements; stay smooth

## 📝 License

This game uses:
- **TensorFlow.js** - Apache 2.0 License
- **Teachable Machine** - Free by Google

Feel free to modify and share!

## 🤝 Contributing

Have improvements or new features? Feel free to enhance the game:
- Add more obstacle types
- Implement combo scoring
- Add difficulty levels
- Create custom themes
- Improve collision detection

---

**Enjoy the game! 🎮** Now go train your Teachable Machine model and start playing!

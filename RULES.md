# 🎮 Game Rules - Pose Runner

## Objective
Survive as long as possible in an endless runner game by dodging and jumping over obstacles using body pose detection. Your score increases by 1 for every obstacle you successfully avoid.

## Controls

| Pose | Action | Result |
|------|--------|--------|
| Left Arm Out | Move Left | Move to left lane (if not already there) |
| Right Arm Out | Move Right | Move to right lane (if not already there) |
| Arms Up | Jump | Jump over lasers, escape ground level |
| Arms Crossed | RAGE MODE | 2× speed, destroys obstacles, 2× points (10s cooldown) |
| Idle/Neutral | Stay | Continue in current lane |

## Game Layout

```
┌─────────────────────────┐
│     Top of Screen       │
│  (Obstacles spawn here) │
│                         │
│    Lane 1  │  Lane 2  │ Lane 3
│  (Left)    │ (Center) │ (Right)
│                         │
│        [Player] ←───┐   │
│                     Player starts here (center)
│                         │
├─────────────────────────┤
│  Score | Speed | Action │  (UI Display)
│ Webcam Preview          │  (Bottom right)
└─────────────────────────┘
```

## Lanes

- **3 Total Lanes**: Left, Center, Right
- **Starting Lane**: Center (Lane 2)
- **Lane Boundaries**: Cannot move off-screen
- **Movement Speed**: Instant when pose detected (with 150ms debounce)

## Obstacles

### Boulders (Orange)
- **Appearance**: Orange rock with shading, ~30px wide
- **Spawn**: Randomly in any lane at top of screen
- **Behavior**: Move downward toward player
- **Height**: Ground-level obstacle
- **Threat**: Blocks entire lane, cannot jump over
- **Survival Method**: **ONLY dodge by switching to different lane**
- **Points**: +1 base, +2 if in 6+ combo, ×2 if RAGE active

### Lasers (Blue)
- **Appearance**: Horizontal blue beam with cyan glow across full width
- **Spawn**: Randomly in any lane at top of screen
- **Behavior**: Move downward toward player
- **Height**: Mid-screen when active
- **Threat**: Affects all lanes equally
- **Survival Methods**: 
  1. **Jump** - Any active jump clears lasers
  2. **RAGE MODE** - Destroys laser on contact
  3. **Time** - Pass through without being hit
- **Points**: +1 base, +2 if in 6+ combo, ×2 if RAGE active

## Collision Detection

### When Do You Get Hit?
1. Your lane matches obstacle lane (or obstacle spans all lanes)
2. Your character box overlaps obstacle box vertically
3. **For Lasers Only**: You are NOT actively jumping
4. You are NOT in RAGE MODE
5. You are NOT invincible (after previous hit)

### Invincibility After Hit
When hit (outside RAGE):
- **Duration**: 1.5 seconds (90 frames @ 60fps)
- **Visual**: Character blinks on/off
- **Effect**: You pass through obstacles safely during this time
- **Purpose**: Prevent "chain hits" from stacked obstacles

### RAGE Mode Collision
- **Effect**: Obstacles are DESTROYED on contact
- **Visual**: Particle explosion where obstacle was
- **No Damage**: You do NOT lose a life
- **Points**: +2 bonus (or +4 in 6+ combo)

### AABB Collision (Axis-Aligned Bounding Box)
```
         Your Pos (x1, y1, w, h)
         ┌─────────┐
         │ ░░░░░░░ │
         │ ░░░░░░░ │  If overlapping:
         │ ░░░░░░░ │  → COLLISION!
         │ ░░░░░░░ │
         └─────────┘
                 ┌────────────┐
                 │  Obstacle  │
                 │   (x2,y2)  │
                 └────────────┘
         Obstacle Pos
```

## Jumping Mechanics

### Jump Physics
- **Trigger**: Perform "Arms Up" pose (must not already be jumping)
- **Debounce**: 500ms between jump inputs
- **Jump Force**: -20 pixels/frame (upward velocity)
- **Gravity**: 0.88 pixels/frame² (downward acceleration)
- **Max Height**: ~70 pixels above ground
- **Duration**: ~20 frames (0.33s) to return to ground
- **Visual**: Yellow trail line appears while airborne

### Who Jump Affects
- **Lasers**: ✓ Can jump over
- **Boulders**: ✗ Cannot jump over (must switch lanes)
- **Physics**: Jump is full trajectory regardless of height

### Jump Arc
```
Frame 1:     Frame 5:      Frame 10:    Frame 15:    Frame 20:
  ↑         ↑↑↑           ↑↑↑↑↑       ↑↑↑↑↑↑↑     ↓
 ███       █████          ███████      █████████  ███
 ███       █████          ███████      █████████  ███
  ↑         ↑             ↑             ↑          ↓
 Starting  Rising         Peak          Falling      Landing
```

## Lives & Game Over

### Life System
- **Starting Lives**: 3 (shown as ♥ hearts at top-left)
- **Loss Condition**: Hit by obstacle (when not in RAGE or invincible)
- **Game Over**: Reach 0 lives
- **Invincibility**: 1.5s after taking damage (heart blinks to indicate this)

### Damage Prevention
1. **Lane Dodging** (Boulders only) - Switch lanes before collision
2. **Jumping** (Lasers only) - Jump over the beam
3. **RAGE MODE** - Destroy obstacles on contact (no damage)
4. **Timing** - Memorize spawn patterns to anticipate obstacles

---

## Scoring System

### Base Scoring
- **Per Obstacle Passed**: +1 point
- **Speed Scaling**: Game speeds up every 15 points (+0.45 base speed)
- **Spawn Rate**: Obstacles spawn faster as score increases

### Combo Multiplier
- **Combo Counter**: Increases by 1 for each obstacle successfully avoided
- **Resets**: Goes to 0 if you take a hit (outside RAGE)
- **6+ Combo Bonus**: ×2 points per obstacle
  - 5 combo: +1 point per obstacle
  - 6 combo: +2 points per obstacle
  - 7 combo: +2 points per obstacle
  - etc.

### RAGE MODE Bonus
- **Activation**: Cross arms ("rage" pose)
- **Duration**: 4 seconds (gets indicator bar)
- **Speed**: 2× game speed while active
- **Cooldown**: 10 seconds before RAGE can activate again
- **Points**: ×2 multiplier on all obstacles destroyed
  - Normal combo (5): 1 × 2 = 2 points
  - High combo (6+): 2 × 2 = 4 points per obstacle destroyed!

### Scoring Example
```
Scenario 1: Hit obstacle at combo 0
  Result: -1 life, combo = 0, invincible 1.5s

Scenario 2: Avoid 8 obstacles in a row
  Combo progression: 1 (+1), 2 (+1), 3 (+1), 4 (+1), 5 (+1), 6 (+2), 7 (+2), 8 (+2)
  Total points: 1+1+1+1+1+2+2+2 = 11 points
  Combo is now: 8

Scenario 3: Avoid 8 obstacles with RAGE MODE active for last 3
  Obstacles 1-5 + RAGE: (+1)×1 = +1, (+1)×1 = +1, (+1)×1 = +1, (+1)×1 = +1, (+1)×1 = +1
  Then activate RAGE (Combo = 5)
  Obstacles 6-8 with RAGE: (+2 from combo) × 2 = +4, +4, +4
  Total: 5+4+4+4 = 17 points!
  Cooldown: RAGE now on 10s cooldown
```

---

## RAGE MODE Mechanics

### Activation
- **Pose**: Cross both arms across chest ("rage" pose)
- **Confidence**: Must be detected at 60% confidence
- **Cooldown**: 10 seconds between activations
- **Duration**: 4 seconds when active

### During RAGE MODE
- **Visual**: Purple glow around character, pulsing aura
- **Speed**: 2× normal game speed (obstacles move faster)
- **Obstacles**: Destroyed on contact instead of damaging player
- **Points**: 2× multiplier on all destroyed obstacles
- **Indicator**: Purple progress bar shows remaining time
- **Combo**: Still builds while RAGE active

### After RAGE MODE
- **Cooldown Bar**: Shows when RAGE is recharging (10 seconds)
- **Color**: Purple cooldown indicator shows recharge progress
- **Hint**: Display says "CROSS ARMS = RAGE" when ready

### Score Display
- Real-time display in top-right corner (green text)
- Updates every frame
- Persists even when game over

### High Score Tracking
- Currently not saved between sessions
- Could be enhanced with localStorage

## Difficulty Progression

### Speed Scaling
- **Initial Speed**: 3.0 pixels/frame
- **Speed Increase Trigger**: Every 10 points
- **Increase Amount**: +0.5 pixels/frame per 10 points

### Speed Examples
| Score | Speed | Formula |
|-------|-------|---------|
| 0-9 | 3.0 | base |
| 10-19 | 3.5 | base + 0.5×(10÷10) |
| 20-29 | 4.0 | base + 0.5×(20÷10) |
| 30-39 | 4.5 | base + 0.5×(30÷10) |
| 50+ | 5.5 | base + 0.5×(50÷10) |

### Dynamic Difficulty
- **Early Game (0-20 pts)**: Easier, slower obstacles
- **Mid Game (20-50 pts)**: Moderate challenge
- **Late Game (50+ pts)**: Very fast, requires reflexes

## Spawn Mechanics

### Obstacle Spawning
- **Spawn Chance**: 3% per frame (0.03 probability)
- **Spawn Rate**: ~1-2 obstacles per second (at 60 FPS)
- **Spawn Location**: Top of screen (y = -30)
- **Spawn Distribution**: Random lane (left, center, or right)
- **Type Distribution**: 50% ground, 50% low (random)

### Spawn Pattern Example
```
Frame 0: [Random check] → 5% chance
Frame 1: [Random check] → 2% chance
Frame 2: [Random check] → 10% chance → ✓ SPAWN! (Left lane, ground)
Frame 3: [Random check] → 1% chance
Frame 4: [Random check] → 7% chance → ✓ SPAWN! (Right lane, low)
...
```

## Game States

### Playing
- Character moves based on pose input
- Obstacles continuously spawn and move down
- Score increases as obstacles pass
- Speed increases every 10 points
- Real-time action feedback

### Game Over
- **Trigger**: Collision without shield OR shield was active but already used
- **Visual**: 
  - Black semi-transparent overlay
  - "GAME OVER" text (red, 48px)
  - Final score display (green)
  - "Play Again" button
- **Actions Available**: Click "Play Again" to restart

## Action Detection

### Confidence Threshold
- **Default**: 0.6 (60% confidence required)
- **Purpose**: Ignore uncertain pose detections
- **Behavior**: 
  - If confidence < 60%, action is not executed
  - Prevents false positives
  - Adjustable in code

### Action Debounce
- **Default**: 150ms between lane changes
- **Default**: 150ms between shield activations
- **Purpose**: Prevent accidental rapid lane switching
- **Behavior**:
  - Lane change waits 150ms before allowing another
  - Shield activation waits 150ms before allowing another
  - Jump and idle have no debounce

## Pose Detection Details

### What Gets Detected
- **17 Body Points**: 
  - Head: nose, eyes, ears
  - Arms: shoulders, elbows, wrists
  - Torso: hips
  - Legs: knees, ankles

### How It Works
1. Webcam captures video frame (200×200)
2. TensorFlow.js detects body keypoints
3. Model analyzes pose features
4. Returns classification (left, right, jump, shield, idle)
5. Action executed if confidence high enough

### Detection Speed
- **Latency**: <50ms (real-time)
- **FPS**: 30-60 depending on device
- **Updates**: Every frame (no input lag)

## Win/Lose Conditions

### Losing
- **Condition**: Collision with obstacle while unshielded
- **Result**: Game over immediately
- **Display**: Game over screen shows final score

### Winning
- **Condition**: No win condition (endless game)
- **Goal**: Survive as long as possible, accumulate points
- **Challenge**: Get progressively harder as speed increases

## Camera and Pose Recognition

### Optimal Setup
- Distance: 1-2 meters from camera
- Lighting: Bright, even illumination
- Angle: Camera at chest/head level
- Background: Clear, non-busy background

### Poor Detection Symptoms
- Actions not recognized despite correct pose
- Wrong actions detected
- Delayed response
- Inconsistent behavior

### Fixes
- Increase lighting
- Move closer/further from camera
- Re-train model with more samples
- Adjust CONFIDENCE_THRESHOLD lower
- Ensure clear arm/body visibility

## Edge Cases

### Lane Boundaries
```
Leftmost lane:  Left arm out → No action (can't go further left)
Rightmost lane: Right arm out → No action (can't go further right)
Center lane:    Left/right arm out → Move as expected
```

### Shield Exhaustion
- Shield is used when collision occurs
- Shield immediately deactivates after use
- Player takes damage next collision (if no other shield)

### Jump During Shield
- Both can be active simultaneously
- Jumping doesn't deactivate shield
- Jumping doesn't use shield

### Multiple Obstacles
- Obstacles don't interact with each other
- Can have many obstacles on-screen simultaneously
- Each checked independently for collision

## Performance Notes

- **Optimal FPS**: 60 FPS (if device supports)
- **Minimum FPS**: 30 FPS (for playable experience)
- **Resource Usage**: GPU (if available), camera bandwidth
- **Browser Compatibility**: Chrome, Firefox, Edge, Safari

---

**Now you know all the rules! Go play and get that high score! 🎮**

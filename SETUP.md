# 📋 Setup Guide - Pose Runner

## Quick Start

### 1. Create Your Teachable Machine Model (5 minutes)

**Visit**: https://teachablemachine.withgoogle.com/

1. Click **"Get Started"**
2. Choose **"Pose"**
3. Name your project (e.g., "Pose Runner Game")

### 2. Record Training Poses

For each of these 5 classes, click "Hold to Record" and capture 15-20 samples:

#### Class 1: "left"
- **Action**: Extend your LEFT arm straight to the side
- **Body Position**: Stand facing camera, feet shoulder-width apart
- **Tips**: Arm should be parallel to the ground, elbow slightly bent

```
   ^
   |
<--+-->  ← Extended left arm
   |
```

#### Class 2: "right"
- **Action**: Extend your RIGHT arm straight to the side
- **Body Position**: Stand facing camera, feet shoulder-width apart
- **Tips**: Mirror the "left" pose

```
   ^
   |
<--+-->
   |
      ← Extended right arm
```

#### Class 3: "jump"
- **Action**: Raise both arms ABOVE your head
- **Body Position**: Stand facing camera
- **Tips**: Both arms should be extended upward at ~45° angle

```
    /\
   /  \  ← Both arms raised
  |    |
  |    |
   \  /
```

#### Class 4: "rage"
- **Action**: Cross both arms across your CHEST
- **Body Position**: Stand facing camera
- **Tips**: Arms form an X shape on your torso - this activates RAGE MODE!

```
   ^
   |
  \|/   ← Arms crossed (RAGE!)
   X
  /|\
```

#### Class 5: "idle"
- **Action**: Stand with arms at your sides (neutral)
- **Body Position**: Relaxed, natural standing position
- **Tips**: This is your "default" pose when not doing other actions

```
   ^
   |
   |    ← Arms down (natural)
  /|\
  / \
```

### 3. Train Your Model

1. Click **"Train Model"** (usually automatic)
2. Wait for training to complete (30-60 seconds)
3. Test your poses using the webcam preview

**RAGE Mode Tips**: "Rage" should be distinct from "idle" - a clear arm crossing on chest makes the best training data.

### 4. Export Model

1. Click **"Export Model"**
2. Choose **"TensorFlow.js"**
3. Select **"Upload to Drive"**
4. Authorize with your Google account
5. Copy the model ID from the generated URL

Example URL:
```
https://teachablemachine.withgoogle.com/models/pchlNha2j/
                                                ^^^^^^^^^ Copy this (your model ID)
```

### 5. Load in Pose Runner

1. Open `index.html` in a browser
2. In the right side panel, paste the model URL:
```
https://teachablemachine.withgoogle.com/models/YOUR_ID/
```
3. Click **LOAD** and wait for model to initialize
4. Allow camera access when prompted
5. Start playing!

### 5. Update Game Code

1. Open `index.html` in a text editor
2. Find line ~4 in the script section:
```javascript
const URL = "https://teachablemachine.withgoogle.com/models/pchlNha2j/";
```
3. Replace `pchlNha2j` with your model ID
4. Save the file

### 6. Run the Game

1. Open `index.html` in a web browser
2. Allow webcam access
3. Wait for model to load (up to 30 seconds)
4. Start playing!

## 📸 Camera Setup Tips

- **Distance**: Sit 1-2 meters away from camera
- **Lighting**: Use bright, even lighting (not backlit)
- **Angle**: Camera should see your full body from head to waist
- **Background**: Plain background works best
- **Movement**: Move slowly and deliberately

## 🎯 Training Best Practices

### Recording Samples

**DO:**
- ✅ Record at least 15-20 samples per pose
- ✅ Record from slightly different angles
- ✅ Record at different distances from camera
- ✅ Use consistent clothing
- ✅ Ensure good lighting

**DON'T:**
- ❌ Rush through recordings
- ❌ Record only from one angle
- ❌ Use extremely dark or bright lighting
- ❌ Have clutter in the background
- ❌ Record with arms blocking your torso

### Testing Your Model

After training:
1. Look at the **"Test"** section
2. Try performing each pose
3. Check the confidence scores
4. Expect 70%+ confidence for correct poses
5. If accuracy is low, record more samples of that pose

## 🔧 Adjusting Game Sensitivity

If your game feels unresponsive or too twitchy, adjust these values in `index.html`:

```javascript
// Require more confident pose detection (0.0 to 1.0)
const CONFIDENCE_THRESHOLD = 0.6;  
// Try: 0.4 (very responsive), 0.7 (very strict), 0.6 (balanced)

// Prevent rapid lane changes (milliseconds)
const ACTION_DEBOUNCE_MS = 150;    
// Try: 100 (fast), 200 (slow), 150 (balanced)
```

## 🎮 Testing Before Playing

1. Open game in browser
2. Look at the **"Action"** display in bottom-left
3. Try each pose and verify it says the correct action
4. Adjust CONFIDENCE_THRESHOLD if actions aren't detected
5. Once working, start the actual game!

## 🆘 Common Issues

### Model Won't Load
- Check internet connection
- Verify model URL format: should end with `/`
- Check browser console for errors

### Poses Not Detected
- Ensure good lighting
- Move closer to camera
- Try re-recording that specific pose
- Lower CONFIDENCE_THRESHOLD by 0.1

### Game Crashes
- Check browser console (F12) for errors
- Try refreshing the page
- Make sure webcam permissions are granted

## 📊 Expected Performance

- **Model Load Time**: 20-40 seconds
- **Detection Latency**: <50ms (real-time)
- **FPS**: 30-60 FPS depending on device

## 🎓 Next Steps

1. ✅ Create Teachable Machine model
2. ✅ Train 5 pose classes
3. ✅ Export and get model ID
4. ✅ Update game URL
5. ✅ Play and enjoy!

## 💡 Pro Tips

- **Fast reflexes**: Practice your poses to be quick and consistent
- **High scores**: Plan your moves ahead, anticipate obstacle patterns
- **Shield management**: Use shield only when you can't dodge/jump
- **Lane awareness**: Always know which lane you're in

---

**Have fun training and playing! 🚀**

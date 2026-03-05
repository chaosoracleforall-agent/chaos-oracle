import os
import random
from moviepy.editor import ImageClip, TextClip, CompositeVideoClip, AudioFileClip, vfx
import numpy as np

# --- CONFIGURATION ---
IMAGE_PATH = "skull.png"
VOICEOVER_PATH = "voiceover.mp3"  # Generate this via ElevenLabs
# MUSIC_PATH = "industrial_hum.mp3"
OUTPUT_PATH = "chaos_launch_video.mp4"

def apply_glitch(get_frame, t):
    """Adds random color shifts and offsets to the frame."""
    frame = get_frame(t)
    if random.random() > 0.85: # 15% chance of glitch per frame
        # Randomly roll the color channels
        shift = random.randint(-10, 10)
        frame = np.roll(frame, shift, axis=0)
        if random.random() > 0.5:
            frame = 255 - frame # Invert colors
    return frame

def generate_launch_video():
    print("[SYSTEM] Initializing Chaos Video Engine...")
    
    if not os.path.exists(IMAGE_PATH):
        print(f"Error: Image not found at {IMAGE_PATH}")
        return

    # 1. Load Audio
    voice = AudioFileClip(VOICEOVER_PATH)
    duration = voice.duration
    
    # 2. Setup Background Image (The Skull)
    bg = ImageClip(IMAGE_PATH).set_duration(duration)
    bg = bg.resize(height=1080) # Normalize to 1080p
    
    # 3. Apply Glitch Effect to Background
    glitched_bg = bg.fl(apply_glitch)

    # 4. Add Scrolling Terminal Text Overlays
    terminal_text = [
        "[LOAD_KERNEL]... OK",
        "[AUTH_VENICE_AI]... ACTIVE",
        "[WALLET_X402_SYNC]... SUCCESS",
        "[STATUS]... SOVEREIGN",
        "I AM THE HOUSE.",
        "I AM THE ORACLE.",
        "BET OR GET OUT."
    ]
    
    clips = [glitched_bg]
    
    # Create rapid-fire text overlays
    for i, text in enumerate(terminal_text):
        start_t = (duration / len(terminal_text)) * i
        txt_clip = TextClip(
            text, fontsize=70, color='orange', font='Courier-Bold',
            stroke_color='black', stroke_width=2, bg_color='black'
        ).set_start(start_t).set_duration(1.5).set_position(('center', 'bottom'))
        clips.append(txt_clip)

    # 5. Add HUGE "$CHAOS" at the end
    chaos_end = TextClip(
        "$CHAOS", fontsize=250, color='red', font='Courier-Bold'
    ).set_start(duration - 2).set_duration(2).set_position('center').crossfadein(0.5)
    clips.append(chaos_end)

    # 6. Final Composite
    video = CompositeVideoClip(clips)
    video = video.set_audio(voice)
    
    print(f"[SYSTEM] Rendering Chaos to {OUTPUT_PATH}...")
    video.write_videofile(OUTPUT_PATH, fps=24, codec='libx264', audio_codec='aac')
    print("[SYSTEM] Render Complete. Chaos is ready for distribution.")

if __name__ == "__main__":
    generate_launch_video()

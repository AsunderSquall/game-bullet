// src/utils/musicManager.js
class MusicManager {
  constructor() {
    this.currentAudio = null;
    this.isMuted = false;
    this.volume = 0.5; // Default volume
    this.musicLibrary = {
      battle: ['battle1.ogg'],
      event: ['event1.ogg', 'event2.ogg', 'event3.ogg'],
      main: ['main1.ogg', 'main2.ogg'],
      map: ['map1.ogg', 'map2.ogg'],
      select: ['select1.ogg', 'select2.ogg'],
      death: ['death.ogg'],
      rest: ['rest1.ogg', 'rest2.ogg', 'rest3.ogg'],
      shoot: ['shoot1.ogg', 'shoot2.ogg', 'shoot3.ogg', 'shoot4.ogg', 'shoot5.ogg'],
      credit: ['credit1.ogg', 'credit2.ogg']
    };
    this.pendingPlay = null; // Store pending play request
  }

  // Play a random music from a category
  play(category, loop = true) {
    if (this.isMuted) return;

    // Stop current music
    this.stop();

    // Get random music from the category
    const musicList = this.musicLibrary[category] || [];
    if (musicList.length === 0) return;

    const randomMusic = musicList[Math.floor(Math.random() * musicList.length)];
    const musicPath = `music/${randomMusic}`;

    this.currentAudio = new Audio(musicPath);
    this.currentAudio.volume = this.volume;
    this.currentAudio.loop = loop;

    this.currentAudio.play().catch(e => {
      // If autoplay is blocked, store the request for later playback
      if (e.name === 'NotAllowedError') {
        console.warn('Audio playback blocked by autoplay policy. Storing for later playback:', category);
        this.pendingPlay = { category, loop };
      } else {
        console.warn('Audio play failed:', e);
      }
    });
  }

  // Method to resume playback after user interaction
  resumePendingPlay() {
    if (this.pendingPlay) {
      const { category, loop } = this.pendingPlay;
      this.pendingPlay = null; // Clear the pending request
      this.play(category, loop);
    }
  }

  // Play death music (non-looping)
  playDeathMusic() {
    if (this.isMuted) return;

    // Stop current music
    this.stop();

    const deathMusicPath = 'music/death.ogg';
    this.currentAudio = new Audio(deathMusicPath);
    this.currentAudio.volume = this.volume;
    this.currentAudio.loop = false;
    
    this.currentAudio.play().catch(e => {
      console.warn('Death music play failed:', e);
    });
  }

  stop() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.currentAudio) {
      this.currentAudio.volume = this.volume;
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.currentAudio) {
      this.currentAudio.volume = this.isMuted ? 0 : this.volume;
    }
  }

  getIsMuted() {
    return this.isMuted;
  }
}

// Create a singleton instance
export const musicManager = new MusicManager();
// Utility functions for handling video playback and encoding
// This is a simplified implementation for the demo

// Format duration string (e.g., "10:30" or "1:45:20")
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// Convert duration string to seconds (e.g., "10:30" -> 630)
export function durationToSeconds(duration: string): number {
  const parts = duration.split(':').map(part => parseInt(part));
  
  if (parts.length === 3) {
    // hours:minutes:seconds
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    // minutes:seconds
    return parts[0] * 60 + parts[1];
  }
  
  return 0;
}

// Parse human-readable duration format 
// e.g., "10.5 hours" -> { hours: 10.5, seconds: 37800 }
export function parseHumanDuration(duration: string): { hours: number, seconds: number } {
  // Handle formats like "10.2 hours"
  const hoursMatch = duration.match(/(\d+\.?\d*)\s*hours?/i);
  if (hoursMatch) {
    const hours = parseFloat(hoursMatch[1]);
    return {
      hours,
      seconds: hours * 3600
    };
  }
  
  // Handle formats like "45 minutes"
  const minutesMatch = duration.match(/(\d+\.?\d*)\s*minutes?/i);
  if (minutesMatch) {
    const minutes = parseFloat(minutesMatch[1]);
    return {
      hours: minutes / 60,
      seconds: minutes * 60
    };
  }
  
  // Handle formats like "10:30"
  if (duration.includes(':')) {
    const seconds = durationToSeconds(duration);
    return {
      hours: seconds / 3600,
      seconds
    };
  }
  
  return { hours: 0, seconds: 0 };
}

// Generate video thumbnails (in a real implementation, this would create
// actual thumbnails from video files)
export function generateThumbnailUrl(videoUrl: string): string {
  // In a real implementation, this would extract a frame from the video
  // For this demo, we'll return a placeholder
  return 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80';
}

// Check if video format is supported
export function isSupportedVideoFormat(filename: string): boolean {
  const supportedFormats = ['.mp4', '.webm', '.ogg', '.mov'];
  const extension = filename.substring(filename.lastIndexOf('.')).toLowerCase();
  return supportedFormats.includes(extension);
}

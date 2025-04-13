import { useState, useRef } from "react";
import ReactPlayer from "react-player";
import { Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { formatDuration } from "@/lib/videoUtils";

interface VideoPlayerProps {
  videoUrl?: string;
  coverImageUrl?: string;
  isPreview?: boolean;
}

export default function VideoPlayer({ videoUrl, coverImageUrl, isPreview = false }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [played, setPlayed] = useState(0);
  const [seeking, setSeeking] = useState(false);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(false);
  
  const playerRef = useRef<ReactPlayer>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  
  // If no video URL is provided, show a placeholder
  const videoSource = videoUrl || "https://www.youtube.com/watch?v=dQw4w9WgXcQ"; // Default video for demo
  
  // Handle player state changes
  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);
  const handlePlayPause = () => setIsPlaying(!isPlaying);
  
  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
    setMuted(value[0] === 0);
  };
  
  const handleToggleMute = () => {
    setMuted(!muted);
  };
  
  const handleProgress = (state: { played: number; playedSeconds: number; loaded: number; loadedSeconds: number }) => {
    if (!seeking) {
      setPlayed(state.played);
    }
  };
  
  const handleSeekMouseDown = () => {
    setSeeking(true);
  };
  
  const handleSeekChange = (value: number[]) => {
    setPlayed(value[0]);
  };
  
  const handleSeekMouseUp = (value: number[]) => {
    setSeeking(false);
    if (playerRef.current) {
      playerRef.current.seekTo(value[0]);
    }
  };
  
  const handleDuration = (duration: number) => {
    setDuration(duration);
  };
  
  const handleRewind = () => {
    if (playerRef.current) {
      const currentTime = playerRef.current.getCurrentTime();
      playerRef.current.seekTo(Math.max(currentTime - 10, 0));
    }
  };
  
  const handleForward = () => {
    if (playerRef.current) {
      const currentTime = playerRef.current.getCurrentTime();
      playerRef.current.seekTo(Math.min(currentTime + 10, duration));
    }
  };
  
  const handleFullscreen = () => {
    if (playerContainerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        playerContainerRef.current.requestFullscreen();
      }
    }
  };
  
  return (
    <div 
      ref={playerContainerRef} 
      className="relative w-full h-full bg-black rounded-lg overflow-hidden"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {!isPlaying && coverImageUrl && (
        <div className="absolute inset-0 z-10">
          <img 
            src={coverImageUrl} 
            alt="Video thumbnail" 
            className="w-full h-full object-cover" 
          />
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
            <Button 
              onClick={handlePlayPause}
              className="bg-white bg-opacity-75 hover:bg-opacity-100 text-primary rounded-full w-16 h-16 flex items-center justify-center"
            >
              <Play className="h-8 w-8" />
            </Button>
          </div>
        </div>
      )}
      
      <ReactPlayer
        ref={playerRef}
        url={videoSource}
        width="100%"
        height="100%"
        playing={isPlaying}
        volume={volume}
        muted={muted}
        onPlay={handlePlay}
        onPause={handlePause}
        onProgress={handleProgress}
        onDuration={handleDuration}
        config={{
          file: {
            attributes: {
              controlsList: 'nodownload',
            },
          },
          youtube: {
            playerVars: {
              controls: 0,
              modestbranding: 1,
              rel: 0,
            },
          },
        }}
      />
      
      {/* Custom controls overlay */}
      <div 
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Progress bar */}
        <div className="mb-2">
          <Slider
            value={[played]}
            min={0}
            max={1}
            step={0.001}
            onValueChange={handleSeekChange}
            onValueCommit={handleSeekMouseUp}
            onMouseDown={handleSeekMouseDown}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:bg-white/20"
              onClick={handlePlayPause}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:bg-white/20"
              onClick={handleRewind}
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:bg-white/20"
              onClick={handleForward}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
            
            <div className="text-white text-xs hidden sm:block">
              {formatDuration(played * duration)} / {formatDuration(duration)}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2 relative w-20 hidden sm:flex">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:bg-white/20"
                onClick={handleToggleMute}
              >
                {muted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              <Slider
                value={[muted ? 0 : volume]}
                min={0}
                max={1}
                step={0.1}
                onValueChange={handleVolumeChange}
              />
            </div>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:bg-white/20"
              onClick={handleFullscreen}
            >
              <Maximize className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

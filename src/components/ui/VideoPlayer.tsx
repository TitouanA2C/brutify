"use client";

import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Loading } from "@/components/ui/Loading";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  vslMode?: boolean; // Active la courbe de progression VSL (avance vite au début, lent à la fin)
}

export function VideoPlayer({
  src,
  poster,
  className,
  autoPlay = false,
  muted = false,
  loop = false,
  onEnded,
  onTimeUpdate,
  vslMode = false,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  
  const [playing, setPlaying] = useState(autoPlay);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(muted ? 0 : 1);
  const [isMuted, setIsMuted] = useState(muted);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [hovering, setHovering] = useState(false);
  const [seeking, setSeeking] = useState(false);

  const hideControlsTimeout = useRef<NodeJS.Timeout>();

  // Format time helper
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // VSL Progress curve — avance vite au début, ralentit à la fin
  const calculateVSLProgress = (realProgress: number): number => {
    if (!vslMode) return realProgress;
    
    // Courbe par segments (moins agressive) :
    // 0-15% réel → 0-50% affiché (pente raide)
    // 15-40% réel → 50-80% affiché (pente moyenne)  
    // 40-100% réel → 80-100% affiché (pente douce)
    
    if (realProgress <= 0.15) {
      // Premiers 15% = 50% de la barre (ratio 3.33x)
      return realProgress * 3.33;
    } else if (realProgress <= 0.4) {
      // 15-40% = 50-80% de la barre (30% en 25%, ratio 1.2x)
      return 0.5 + ((realProgress - 0.15) / 0.25) * 0.3;
    } else {
      // 40-100% = 80-100% de la barre (20% en 60%, ratio 0.33x)
      return 0.8 + ((realProgress - 0.4) / 0.6) * 0.2;
    }
  };

  // Inverse VSL curve — pour convertir un clic sur la barre en position réelle
  const calculateRealProgressFromVSL = (vslProgress: number): number => {
    if (!vslMode) return vslProgress;
    
    // Fonction inverse de calculateVSLProgress
    if (vslProgress <= 0.5) {
      // 0-50% de barre → 0-15% réel
      return vslProgress / 3.33;
    } else if (vslProgress <= 0.8) {
      // 50-80% de barre → 15-40% réel
      return 0.15 + ((vslProgress - 0.5) / 0.3) * 0.25;
    } else {
      // 80-100% de barre → 40-100% réel
      return 0.4 + ((vslProgress - 0.8) / 0.2) * 0.6;
    }
  };

  // Play/Pause toggle
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setPlaying(!playing);
  };

  // Volume controls
  const toggleMute = () => {
    if (!videoRef.current) return;
    const newMuted = !isMuted;
    videoRef.current.muted = newMuted;
    setIsMuted(newMuted);
    if (newMuted) {
      videoRef.current.volume = 0;
    } else {
      videoRef.current.volume = volume;
    }
  };

  const handleVolumeChange = (value: number) => {
    if (!videoRef.current) return;
    const newVolume = value / 100;
    videoRef.current.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // Timeline seek — gère le mode VSL
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const clickedPercent = (e.clientX - rect.left) / rect.width;
    
    // En mode VSL, le clic représente une position VSL qu'on doit convertir en position réelle
    const realPercent = calculateRealProgressFromVSL(clickedPercent);
    videoRef.current.currentTime = realPercent * duration;
  };

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      onTimeUpdate?.(video.currentTime, video.duration);
    };

    const handleEnded = () => {
      setPlaying(false);
      onEnded?.();
    };

    const handleWaiting = () => setLoading(true);
    const handleCanPlay = () => setLoading(false);

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("canplay", handleCanPlay);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("canplay", handleCanPlay);
    };
  }, [onEnded, onTimeUpdate]);

  // Fullscreen change detection
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Auto-hide controls when playing
  useEffect(() => {
    if (playing && !hovering && !seeking) {
      hideControlsTimeout.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    } else {
      setShowControls(true);
      if (hideControlsTimeout.current) {
        clearTimeout(hideControlsTimeout.current);
      }
    }
    return () => {
      if (hideControlsTimeout.current) {
        clearTimeout(hideControlsTimeout.current);
      }
    };
  }, [playing, hovering, seeking]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!videoRef.current) return;
      
      switch (e.code) {
        case "Space":
          e.preventDefault();
          togglePlay();
          break;
        case "KeyM":
          e.preventDefault();
          toggleMute();
          break;
        case "KeyF":
          e.preventDefault();
          toggleFullscreen();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [playing, isMuted, isFullscreen]);

  const realProgress = duration > 0 ? currentTime / duration : 0;
  const displayProgress = calculateVSLProgress(realProgress);
  const progress = displayProgress * 100;

  return (
    <div
      ref={containerRef}
      className={cn("relative group/player bg-black overflow-hidden rounded-2xl shadow-[0_20px_80px_rgba(0,0,0,0.6)]", className)}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-contain"
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        playsInline
        onClick={togglePlay}
      />

      {/* Vignette subtile pour depth */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/40 via-transparent to-black/20" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-black/20 via-transparent to-black/20" />

      {/* Loading spinner — Premium style */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-md pointer-events-none z-30"
          >
            <div className="relative">
              {/* Pulsing glow */}
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute -inset-8 rounded-full bg-brutify-gold/30 blur-2xl"
              />
              
              {/* Card */}
              <div className="relative flex items-center gap-3 rounded-2xl border border-brutify-gold/30 bg-gradient-to-br from-[#1a1400]/95 to-[#0d0a00]/95 backdrop-blur-xl px-6 py-4 shadow-[0_0_40px_rgba(255,171,0,0.3),0_12px_32px_rgba(0,0,0,0.8)]">
                <Loading variant="block" size="md" label="Chargement..." />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Play/Pause overlay button (center) */}
      <AnimatePresence>
        {!playing && !loading && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center cursor-pointer group/play z-10"
          >
            <div className="relative">
              {/* Pulsing outer glow */}
              <motion.div
                animate={{
                  scale: [1, 1.15, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute -inset-8 rounded-full bg-brutify-gold/30 blur-2xl"
              />
              
              {/* Outer ring gradient */}
              <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-brutify-gold-light/50 via-brutify-gold/40 to-brutify-gold-dark/30 group-hover/play:from-brutify-gold-light/70 group-hover/play:via-brutify-gold/60 group-hover/play:to-brutify-gold-dark/50 transition-all duration-300" />
              
              {/* Main button */}
              <motion.div
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.93 }}
                className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#1a1400] via-[#130f00] to-[#0d0a00] border border-brutify-gold/40 shadow-[0_0_40px_rgba(255,171,0,0.3),0_8px_32px_rgba(0,0,0,0.6)] group-hover/play:shadow-[0_0_60px_rgba(255,171,0,0.5),0_12px_40px_rgba(0,0,0,0.7)] transition-all duration-300"
              >
                <Play className="h-8 w-8 ml-1 text-brutify-gold-light drop-shadow-[0_0_8px_rgba(255,215,0,0.6)]" />
              </motion.div>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Controls bar (bottom) */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-0 left-0 right-0 z-20"
          >
            {/* Timeline container with glow */}
            <div className="relative px-4 pb-2">
              <div
                ref={timelineRef}
                onClick={handleTimelineClick}
                onMouseDown={() => setSeeking(true)}
                onMouseUp={() => setSeeking(false)}
                onMouseMove={(e) => {
                  if (seeking && videoRef.current && timelineRef.current) {
                    const rect = timelineRef.current.getBoundingClientRect();
                    const clickedPercent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                    
                    // En mode VSL, convertir la position cliquée en position réelle
                    const realPercent = calculateRealProgressFromVSL(clickedPercent);
                    videoRef.current.currentTime = Math.max(0, Math.min(duration, realPercent * duration));
                  }
                }}
                className="relative h-2 w-full cursor-pointer group/timeline"
              >
                {/* Background track with inner shadow */}
                <div className="absolute inset-0 rounded-full bg-black/40 shadow-inner" />
                <div className="absolute inset-0 rounded-full bg-white/[0.03]" />
                
                {/* Progress fill with glow */}
                <div
                  className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-brutify-gold-dark via-brutify-gold to-brutify-gold-light shadow-[0_0_12px_rgba(255,171,0,0.6),0_0_20px_rgba(255,171,0,0.3)] group-hover/timeline:shadow-[0_0_16px_rgba(255,171,0,0.8),0_0_28px_rgba(255,171,0,0.4)] transition-all duration-300 ease-linear"
                  style={{ width: `${progress}%` }}
                />

                {/* Progress thumb/handle */}
                <motion.div
                  className="absolute top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-brutify-gold-light border-2 border-white/20 shadow-[0_0_12px_rgba(255,215,0,0.8),0_2px_8px_rgba(0,0,0,0.6)] opacity-0 group-hover/timeline:opacity-100 transition-opacity"
                  style={{ left: `calc(${progress}% - 8px)` }}
                />
                
                {/* Hover shimmer effect */}
                <div className="absolute inset-0 rounded-full opacity-0 group-hover/timeline:opacity-100 transition-opacity duration-300 overflow-hidden">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    animate={{
                      x: ["-100%", "200%"],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Controls panel — Glassmorphism premium */}
            <div className="relative px-4 pb-3">
              {/* Glass background with gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/85 to-black/40 backdrop-blur-xl" />
              
              {/* Top subtle gold glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-brutify-gold/30 to-transparent" />
              
              <div className="relative flex items-center gap-4 pt-1">
                
                {/* Left: Play/Pause + Skip buttons + Time */}
                <div className="flex items-center gap-3">
                  {/* Play/Pause — Hero button */}
                  <motion.button
                    onClick={togglePlay}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative flex h-10 w-10 items-center justify-center rounded-xl cursor-pointer group/btn overflow-hidden"
                  >
                    {/* Glow background */}
                    <div className="absolute inset-0 bg-brutify-gold/10 group-hover/btn:bg-brutify-gold/20 transition-colors" />
                    <div className="absolute inset-0 bg-gradient-to-br from-brutify-gold/20 to-transparent" />
                    
                    {/* Border */}
                    <div className="absolute inset-0 rounded-xl border border-brutify-gold/30 group-hover/btn:border-brutify-gold/50 transition-colors" />
                    
                    {/* Shine effect on hover */}
                    <div className="absolute inset-0 rounded-xl opacity-0 group-hover/btn:opacity-100 transition-opacity">
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                        animate={{
                          x: ["-100%", "200%"],
                        }}
                        transition={{
                          duration: 0.8,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      />
                    </div>
                    
                    {playing ? (
                      <Pause className="relative h-5 w-5 text-brutify-gold drop-shadow-[0_0_8px_rgba(255,171,0,0.6)] group-hover/btn:scale-110 transition-transform" />
                    ) : (
                      <Play className="relative h-5 w-5 ml-0.5 text-brutify-gold drop-shadow-[0_0_8px_rgba(255,171,0,0.6)] group-hover/btn:scale-110 transition-transform" />
                    )}
                  </motion.button>
                </div>

                {/* Center: Spacer */}
                <div className="flex-1" />

                {/* Right: Volume + Fullscreen */}
                <div className="flex items-center gap-3">
                  
                  {/* Volume control */}
                  <div className="group/volume flex items-center gap-2.5">
                    <motion.button
                      onClick={toggleMute}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.12] bg-white/[0.05] backdrop-blur-sm hover:border-brutify-gold/30 hover:bg-brutify-gold/[0.08] transition-all cursor-pointer group/vol"
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX className="h-4 w-4 text-white/70 group-hover/vol:text-brutify-gold transition-colors" />
                      ) : (
                        <Volume2 className="h-4 w-4 text-white/70 group-hover/vol:text-brutify-gold transition-colors" />
                      )}
                    </motion.button>
                    
                    {/* Volume slider with glassmorphism */}
                    <motion.div
                      initial={{ opacity: 0, width: 0 }}
                      animate={{
                        opacity: 1,
                        width: "5rem",
                      }}
                      className="hidden md:flex items-center opacity-0 group-hover/volume:opacity-100 transition-opacity duration-300"
                    >
                      <div className="relative w-20">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={isMuted ? 0 : volume * 100}
                          onChange={(e) => handleVolumeChange(Number(e.target.value))}
                          className="volume-slider w-full h-1.5 rounded-full appearance-none cursor-pointer"
                          style={{
                            background: `linear-gradient(to right, #FFAB00 0%, #FFAB00 ${volume * 100}%, rgba(255,255,255,0.08) ${volume * 100}%, rgba(255,255,255,0.08) 100%)`,
                          }}
                        />
                      </div>
                    </motion.div>
                  </div>

                  {/* Fullscreen with premium styling */}
                  <motion.button
                    onClick={toggleFullscreen}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.12] bg-white/[0.05] backdrop-blur-sm hover:border-brutify-gold/30 hover:bg-brutify-gold/[0.08] transition-all cursor-pointer group/fs"
                  >
                    {isFullscreen ? (
                      <Minimize className="h-4 w-4 text-white/70 group-hover/fs:text-brutify-gold transition-colors" />
                    ) : (
                      <Maximize className="h-4 w-4 text-white/70 group-hover/fs:text-brutify-gold transition-colors" />
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

// ============================================
// DRAWING CANVAS COMPONENT
// ============================================

function DrawingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const [tool, setTool] = useState<'brush' | 'eraser'>('brush');
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const colors = [
    '#000000', '#FF0000', '#FF6B00', '#FFD700', '#00FF00',
    '#00BFFF', '#0000FF', '#8B00FF', '#FF69B4', '#FFFFFF'
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    lastPos.current = getPos(e);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !lastPos.current) return;

    const pos = getPos(e);
    
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = tool === 'eraser' ? '#FFFFFF' : color;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    
    lastPos.current = pos;
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPos.current = null;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  };

  const saveCanvas = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    try {
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feature: 'art',
          activity_type: 'drawing',
          activity_id: Date.now().toString(),
          completed: true,
          metadata: { tool: 'canvas' }
        }),
      });
      alert('🎨 Αποθηκεύτηκε η πρόοδός σου!');
    } catch (error) {
      console.error('Failed to save:', error);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">🎨 Καμβάς Ζωγραφικής</h2>

      {/* Tools */}
      <div className="flex flex-wrap gap-4 mb-4">
        {/* Colors */}
        <div className="flex gap-1">
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => { setColor(c); setTool('brush'); }}
              className={`w-8 h-8 rounded-full border-2 transition-all ${
                color === c && tool === 'brush' ? 'border-gray-800 scale-110' : 'border-gray-200'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        {/* Brush Size */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Μέγεθος:</span>
          <input
            type="range"
            min="1"
            max="30"
            value={brushSize}
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            className="w-24"
          />
          <span className="text-sm text-gray-600">{brushSize}</span>
        </div>

        {/* Tools */}
        <div className="flex gap-2">
          <button
            onClick={() => setTool('brush')}
            className={`px-3 py-1 rounded-lg ${tool === 'brush' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
          >
            ✏️ Πινέλο
          </button>
          <button
            onClick={() => setTool('eraser')}
            className={`px-3 py-1 rounded-lg ${tool === 'eraser' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
          >
            🧹 Γόμα
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="border-2 border-gray-200 rounded-xl overflow-hidden mb-4">
        <canvas
          ref={canvasRef}
          width={600}
          height={400}
          className="w-full touch-none cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={clearCanvas}
          className="flex-1 py-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200"
        >
          🗑️ Καθαρισμός
        </button>
        <button
          onClick={saveCanvas}
          className="flex-1 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600"
        >
          💾 Αποθήκευση
        </button>
      </div>
    </div>
  );
}

// ============================================
// BEAT SEQUENCER COMPONENT
// ============================================

function BeatSequencer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [currentStep, setCurrentStep] = useState(0);
  const [grid, setGrid] = useState<boolean[][]>(() => 
    Array(4).fill(null).map(() => Array(8).fill(false))
  );
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const sounds = [
    { name: 'Kick', emoji: '🥁', freq: 150 },
    { name: 'Snare', emoji: '🪘', freq: 300 },
    { name: 'Hi-hat', emoji: '🔔', freq: 800 },
    { name: 'Clap', emoji: '👏', freq: 500 },
  ];

  const playSound = (freq: number) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
  };

  const toggleCell = (row: number, col: number) => {
    const newGrid = [...grid];
    newGrid[row] = [...newGrid[row]];
    newGrid[row][col] = !newGrid[row][col];
    setGrid(newGrid);
  };

  const play = () => {
    if (isPlaying) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setIsPlaying(false);
      setCurrentStep(0);
      return;
    }

    setIsPlaying(true);
    const stepDuration = (60 / bpm / 2) * 1000;

    intervalRef.current = setInterval(() => {
      setCurrentStep((prev) => {
        const step = (prev + 1) % 8;
        
        // Play sounds for this step
        grid.forEach((row, rowIndex) => {
          if (row[step]) {
            playSound(sounds[rowIndex].freq);
          }
        });
        
        return step;
      });
    }, stepDuration);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const clearGrid = () => {
    setGrid(Array(4).fill(null).map(() => Array(8).fill(false)));
  };

  const randomize = () => {
    setGrid(Array(4).fill(null).map(() => 
      Array(8).fill(false).map(() => Math.random() > 0.7)
    ));
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">🎵 Beat Sequencer</h2>

      {/* Controls */}
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={play}
          className={`px-6 py-2 rounded-xl font-medium ${
            isPlaying ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
          }`}
        >
          {isPlaying ? '⏹️ Stop' : '▶️ Play'}
        </button>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">BPM:</span>
          <input
            type="range"
            min="60"
            max="180"
            value={bpm}
            onChange={(e) => setBpm(parseInt(e.target.value))}
            className="w-24"
          />
          <span className="text-sm font-medium">{bpm}</span>
        </div>

        <button onClick={clearGrid} className="px-3 py-1 bg-gray-100 rounded-lg text-sm">
          🗑️ Clear
        </button>
        <button onClick={randomize} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm">
          🎲 Random
        </button>
      </div>

      {/* Grid */}
      <div className="space-y-2">
        {grid.map((row, rowIndex) => (
          <div key={rowIndex} className="flex items-center gap-2">
            <div className="w-16 text-sm flex items-center gap-1">
              <span>{sounds[rowIndex].emoji}</span>
              <span className="text-gray-600">{sounds[rowIndex].name}</span>
            </div>
            <div className="flex gap-1">
              {row.map((active, colIndex) => (
                <button
                  key={colIndex}
                  onClick={() => toggleCell(rowIndex, colIndex)}
                  className={`w-10 h-10 rounded-lg transition-all ${
                    active
                      ? 'bg-purple-500'
                      : colIndex === currentStep && isPlaying
                      ? 'bg-yellow-200'
                      : 'bg-gray-100 hover:bg-gray-200'
                  } ${colIndex === currentStep && isPlaying ? 'ring-2 ring-yellow-400' : ''}`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 bg-purple-50 rounded-xl p-4">
        <p className="text-sm text-purple-800">
          💡 Κάνε κλικ στα κουτάκια για να δημιουργήσεις το δικό σου beat! Πάτα Play για να το ακούσεις.
        </p>
      </div>
    </div>
  );
}

// ============================================
// PATTERN CREATOR COMPONENT
// ============================================

function PatternCreator() {
  const [pattern, setPattern] = useState<string[][]>(() =>
    Array(6).fill(null).map(() => Array(6).fill('⬜'))
  );
  
  const emojis = ['⬜', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⬛', '💜', '💙'];
  const [selectedEmoji, setSelectedEmoji] = useState('🔴');

  const toggleCell = (row: number, col: number) => {
    const newPattern = [...pattern];
    newPattern[row] = [...newPattern[row]];
    newPattern[row][col] = selectedEmoji;
    setPattern(newPattern);
  };

  const fillSymmetric = () => {
    const newPattern = [...pattern];
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 3; j++) {
        newPattern[i][5 - j] = newPattern[i][j];
      }
    }
    setPattern(newPattern);
  };

  const clearPattern = () => {
    setPattern(Array(6).fill(null).map(() => Array(6).fill('⬜')));
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">🎨 Δημιουργός Μοτίβων</h2>

      {/* Emoji Palette */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {emojis.map((emoji) => (
          <button
            key={emoji}
            onClick={() => setSelectedEmoji(emoji)}
            className={`text-2xl p-2 rounded-lg ${
              selectedEmoji === emoji ? 'bg-blue-100 ring-2 ring-blue-500' : 'hover:bg-gray-100'
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="flex justify-center mb-4">
        <div className="inline-grid gap-1 bg-gray-100 p-2 rounded-xl">
          {pattern.map((row, rowIndex) => (
            <div key={rowIndex} className="flex gap-1">
              {row.map((cell, colIndex) => (
                <button
                  key={colIndex}
                  onClick={() => toggleCell(rowIndex, colIndex)}
                  className="w-10 h-10 text-2xl flex items-center justify-center bg-white rounded-lg hover:bg-gray-50"
                >
                  {cell}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={clearPattern}
          className="flex-1 py-2 bg-red-100 text-red-700 rounded-xl"
        >
          🗑️ Καθαρισμός
        </button>
        <button
          onClick={fillSymmetric}
          className="flex-1 py-2 bg-blue-100 text-blue-700 rounded-xl"
        >
          🪞 Συμμετρία
        </button>
      </div>
    </div>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function ArtCreativityPage() {
  const [activeTab, setActiveTab] = useState<'draw' | 'music' | 'pattern'>('draw');

  const tabs = [
    { id: 'draw', label: 'Ζωγραφική', icon: '🎨' },
    { id: 'music', label: 'Μουσική', icon: '🎵' },
    { id: 'pattern', label: 'Μοτίβα', icon: '🔲' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">🎨 Τέχνη & Δημιουργικότητα</h1>
          <p className="text-gray-600">Εκφράσου μέσα από τη δημιουργία</p>
        </div>

        <div className="flex gap-2 mb-6 bg-white rounded-xl p-2 shadow-sm">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-pink-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {activeTab === 'draw' && <DrawingCanvas />}
          {activeTab === 'music' && <BeatSequencer />}
          {activeTab === 'pattern' && <PatternCreator />}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 bg-gradient-to-r from-pink-500 to-purple-500 rounded-2xl p-6 text-white"
        >
          <h3 className="font-semibold text-lg mb-2">✨ Η δημιουργικότητα είναι υπερδύναμη!</h3>
          <p className="text-sm text-white/90">
            Δεν υπάρχει λάθος στην τέχνη. Κάθε δημιουργία είναι μοναδική και πολύτιμη. Εκφράσου ελεύθερα!
          </p>
        </motion.div>
      </div>
    </div>
  );
}

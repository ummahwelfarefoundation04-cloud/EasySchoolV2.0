
import React, { useState, useRef, useEffect } from 'react';
import { X, Check, ZoomIn, ZoomOut, Move } from 'lucide-react';

interface ImageCropperProps {
  imageSrc: string;
  onCrop: (croppedImage: string) => void;
  onCancel: () => void;
}

const ImageCropper: React.FC<ImageCropperProps> = ({ imageSrc, onCrop, onCancel }) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  // Size of the cropping area in pixels
  const CROP_SIZE = 250; 

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const onImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    // Calculate initial zoom to fit the image nicely (cover)
    const minDim = Math.min(naturalWidth, naturalHeight);
    const initialZoom = CROP_SIZE / minDim; 
    setZoom(initialZoom); 
    // Center image
    setPan({ x: 0, y: 0 });
  };

  const handleCrop = () => {
    const canvas = document.createElement('canvas');
    canvas.width = CROP_SIZE;
    canvas.height = CROP_SIZE;
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;
    
    if (ctx && img) {
        const naturalWidth = img.naturalWidth;
        const naturalHeight = img.naturalHeight;

        // Clear canvas
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.save();
        // Create clipping region
        ctx.beginPath();
        ctx.rect(0, 0, CROP_SIZE, CROP_SIZE);
        ctx.clip();
        
        // Move to center of canvas
        ctx.translate(CROP_SIZE / 2, CROP_SIZE / 2);
        
        // Apply transformations (Pan & Zoom)
        // Pan is applied relative to the scaled image in CSS, but in Canvas we scale first then translate?
        // Actually: Translate context to center -> Translate by Pan -> Scale -> Draw Image centered
        ctx.translate(pan.x, pan.y);
        ctx.scale(zoom, zoom);
        
        // Draw image centered at origin
        ctx.drawImage(img, -naturalWidth / 2, -naturalHeight / 2);
        
        ctx.restore();
        
        // Return high quality JPEG
        onCrop(canvas.toDataURL('image/jpeg', 0.95));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl overflow-hidden w-full max-w-md shadow-2xl animate-fade-in">
        <div className="p-4 border-b flex justify-between items-center bg-slate-50">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Move size={16} className="text-blue-600"/> Adjust Photo
            </h3>
            <button onClick={onCancel} className="text-slate-400 hover:text-slate-700 transition p-1 rounded-full hover:bg-slate-200">
              <X size={20}/>
            </button>
        </div>
        
        <div className="relative h-80 bg-slate-800 overflow-hidden cursor-move flex items-center justify-center select-none"
             onMouseDown={handleMouseDown}
             onMouseMove={handleMouseMove}
             onMouseUp={handleMouseUp}
             onMouseLeave={handleMouseUp}
             ref={containerRef}
        >
            {/* Image Layer */}
            <img 
                ref={imageRef}
                src={imageSrc} 
                onLoad={onImgLoad}
                alt="Crop target"
                draggable={false}
                style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transformOrigin: 'center',
                    maxWidth: 'none', 
                    maxHeight: 'none' 
                }}
                className="select-none transition-transform duration-75 ease-linear will-change-transform"
            />
            
            {/* Overlay */}
             <div className="absolute pointer-events-none z-10"
                  style={{
                      width: CROP_SIZE,
                      height: CROP_SIZE,
                      boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
                      borderRadius: '8px', 
                      border: '2px solid rgba(255,255,255,0.8)'
                  }}
             >
                {/* Grid lines for rule of thirds */}
                <div className="w-full h-full border border-white/20 relative">
                   <div className="absolute top-1/3 w-full h-px bg-white/20"></div>
                   <div className="absolute top-2/3 w-full h-px bg-white/20"></div>
                   <div className="absolute left-1/3 h-full w-px bg-white/20"></div>
                   <div className="absolute left-2/3 h-full w-px bg-white/20"></div>
                </div>
             </div>
        </div>

        <div className="p-5 space-y-5 bg-white">
            <div className="flex items-center gap-4">
                <ZoomOut size={18} className="text-slate-400"/>
                <input 
                    type="range" 
                    min={0.1} 
                    max={3} 
                    step={0.05} 
                    value={zoom} 
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <ZoomIn size={18} className="text-slate-400"/>
            </div>
            <div className="flex gap-3">
                <button onClick={onCancel} className="flex-1 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-lg border border-slate-200 transition">
                  Cancel
                </button>
                <button onClick={handleCrop} className="flex-1 py-2.5 bg-blue-600 text-white font-medium hover:bg-blue-700 rounded-lg shadow-lg shadow-blue-200 flex items-center justify-center gap-2 transition">
                    <Check size={18} /> Apply Crop
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
export default ImageCropper;

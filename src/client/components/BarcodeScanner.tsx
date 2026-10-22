import { useEffect, useRef, useState } from 'react';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onError?: (error: string) => void;
  preferredFormats?: BarcodeFormat[];
}

export function BarcodeScanner({ onScan, onError, preferredFormats }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanning, setScanning] = useState(false);
  const [supported, setSupported] = useState(false);
  const detectorRef = useRef<BarcodeDetector | null>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    if ('BarcodeDetector' in window) {
      try {
        detectorRef.current = new BarcodeDetector({ formats: preferredFormats });
        setSupported(true);
      } catch {
        setSupported(false);
      }
    } else {
      setSupported(false);
    }
  }, [preferredFormats]);

  const startScanning = async () => {
    if (!videoRef.current || !detectorRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setScanning(true);
      scanLoop();
    } catch (err) {
      onError?.(`Camera access denied: ${(err as Error).message}`);
    }
  };

  const stopScanning = () => {
    setScanning(false);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
  };

  const scanLoop = async () => {
    if (!scanning || !videoRef.current || !detectorRef.current) return;
    const detector = detectorRef.current;
    try {
      const barcodes = await detector.detect(videoRef.current);
      const first = barcodes[0];
      if (first) {
        onScan(first.rawValue);
        stopScanning();
        return;
      }
    } catch {
      // Ignore detection errors
    }
    animationRef.current = requestAnimationFrame(scanLoop);
  };

  useEffect(() => () => stopScanning(), []);

  if (!supported) return null;

  return (
    <div className="barcode-scanner">
      <video ref={videoRef} className="scanner-video" playsInline muted />
      <div className="scanner-overlay">
        <div className="scanner-frame" aria-hidden="true"></div>
        <p className="scanner-hint">Position barcode within the frame</p>
      </div>
      <div className="scanner-controls">
        <button className="btn btn-primary" onClick={scanning ? stopScanning : startScanning} disabled={scanning}>
          {scanning ? 'Stop scanning' : 'Start camera scan'}
        </button>
      </div>
    </div>
  );
}

interface KeyboardScannerProps {
  onScan: (barcode: string) => void;
  enabled?: boolean;
}

export function KeyboardScanner({ onScan, enabled = true }: KeyboardScannerProps) {
  const bufferRef = useRef('');
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!enabled) return;
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'Enter') {
        const code = bufferRef.current.trim();
        bufferRef.current = '';
        if (code.length >= 8) onScan(code);
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        bufferRef.current += e.key;
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => { bufferRef.current = ''; }, 200);
      }
    };
    window.addEventListener('keydown', handler);
    return () => { window.removeEventListener('keydown', handler); clearTimeout(timeoutRef.current); };
  }, [enabled, onScan]);

  return null;
}
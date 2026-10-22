interface BarcodeDetectorOptions {
  formats?: BarcodeFormat[];
}

type BarcodeFormat =
  | 'aztec'
  | 'code_128'
  | 'code_39'
  | 'code_93'
  | 'codabar'
  | 'data_matrix'
  | 'ean_13'
  | 'ean_8'
  | 'itf'
  | 'pdf417'
  | 'qr_code'
  | 'upc_a'
  | 'upc_e';

interface DetectedBarcode {
  rawValue: string;
  format: BarcodeFormat;
  boundingBox: DOMRectReadOnly;
  cornerPoints: ReadonlyArray<DOMPoint>;
}

interface BarcodeDetector {
  detect(source: ImageBitmapSource): Promise<DetectedBarcode[]>;
}

interface BarcodeDetectorConstructor {
  new (options?: BarcodeDetectorOptions): BarcodeDetector;
  getSupportedFormats(): Promise<BarcodeFormat[]>;
}

declare const BarcodeDetector: BarcodeDetectorConstructor;

interface Navigator {
  mediaDevices: MediaDevices;
}
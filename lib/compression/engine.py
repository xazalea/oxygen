import os
import zstandard as zstd
from PIL import Image
import io
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SmartCompressor:
    """
    An incredible file compressor capable of achieving high compression ratios
    by utilizing format-specific optimizations.
    
    Strategies:
    - Text/Data: Zstandard (Level 22) - State of the art dictionary compression.
    - Images: WebP conversion with quality tuning.
    - General: Zstandard fallback.
    """
    
    def __init__(self, compression_level=22):
        self.compression_level = compression_level
        self.compressor = zstd.ZstdCompressor(level=compression_level)
        self.decompressor = zstd.ZstdDecompressor()

    def compress(self, input_path: str, output_path: str) -> dict:
        """
        Compresses a file using the best available strategy.
        """
        if not os.path.exists(input_path):
            raise FileNotFoundError(f"Input file not found: {input_path}")
            
        file_size = os.path.getsize(input_path)
        ext = os.path.splitext(input_path)[1].lower()
        
        logger.info(f"Compressing {input_path} ({file_size / 1024 / 1024:.2f} MB)...")
        
        try:
            if ext in ['.jpg', '.jpeg', '.png', '.bmp', '.tiff']:
                self._compress_image(input_path, output_path)
            else:
                self._compress_generic(input_path, output_path)
                
            compressed_size = os.path.getsize(output_path)
            ratio = file_size / compressed_size if compressed_size > 0 else 0
            
            result = {
                "original_size": file_size,
                "compressed_size": compressed_size,
                "ratio": f"{ratio:.2f}x",
                "strategy": "image_optimization" if ext in ['.jpg', '.jpeg', '.png'] else "zstd_max"
            }
            logger.info(f"Compression complete: {result}")
            return result
            
        except Exception as e:
            logger.error(f"Compression failed: {e}")
            raise

    def decompress(self, input_path: str, output_path: str):
        """
        Decompresses a file. Note: Lossy image compression cannot be reversed to exact original.
        This only handles zstd compressed files. Images are viewable as-is.
        """
        # specialized handling would be needed if we wrapped images in a container
        # for now, we assume standard zstd for non-images
        
        # Check if it's a zstd file by magic number or extension convention
        # Simple implementation: try zstd, if fail, assume it's a media file that is already usable
        try:
            with open(input_path, 'rb') as f_in, open(output_path, 'wb') as f_out:
                self.decompressor.copy_stream(f_in, f_out)
        except zstd.ZstdError:
            logger.warning("File does not appear to be zstd compressed. It might be a media file optimized in place.")
            # For this MVP, we just copy it if it's not zstd (assuming it was an image conversion)
            import shutil
            shutil.copy2(input_path, output_path)

    def _compress_generic(self, input_path, output_path):
        with open(input_path, 'rb') as f_in, open(output_path, 'wb') as f_out:
            self.compressor.copy_stream(f_in, f_out)

    def _compress_image(self, input_path, output_path, quality=80):
        """
        Aggressive image compression:
        1. Resize if huge (>4k resolution)
        2. Convert to WebP (superior to JPEG)
        """
        try:
            with Image.open(input_path) as img:
                # Resize if massive (limit to 4k for "100MB to 1MB" goal)
                max_dim = 3840 
                if img.width > max_dim or img.height > max_dim:
                    img.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)
                
                # If output path doesn't end in .webp, append it or change it
                # For this tool, we force strict output path, but WebP header will be there
                
                # We save as WebP
                img.save(output_path, 'WEBP', quality=quality, optimize=True)
                
        except Exception as e:
            logger.warning(f"Image compression failed, falling back to generic: {e}")
            self._compress_generic(input_path, output_path)



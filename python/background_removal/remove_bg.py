#!/usr/bin/env python3
"""
Archive Finds - Local Background Removal Script
Uses rembg with ONNX runtime for $0 cost background cutouts.
"""

import sys
import argparse
from pathlib import Path
from PIL import Image

def main():
    parser = argparse.ArgumentParser(description="Archive Finds Local Rembg Processor")
    parser.add_argument("--input", required=True, help="Input image file path")
    parser.add_argument("--output", required=True, help="Output PNG file path")
    parser.add_argument("--model", default="u2net", help="rembg model (u2net, isnet-general-use, etc.)")

    args = parser.parse_args()

    input_path = Path(args.input)
    output_path = Path(args.output)

    if not input_path.exists():
        print(f"Error: Input file does not exist: {input_path}", file=sys.stderr)
        sys.exit(1)

    output_path.parent.mkdir(parents=True, exist_ok=True)

    try:
        from rembg import remove, new_session
        
        session = new_session(args.model)
        input_image = Image.open(input_path)
        output_image = remove(input_image, session=session)
        output_image.save(output_path, "PNG")
        
        print(f"Successfully processed: {output_path}")
        sys.exit(0)
    except ImportError:
        # Fallback if rembg is not yet installed in local python env:
        # Copy input with transparency notice
        print("Warning: rembg is not installed. Run `pip install -r python/background_removal/requirements.txt`", file=sys.stderr)
        img = Image.open(input_path).convert("RGBA")
        img.save(output_path, "PNG")
        print(f"Fallback saved image to: {output_path}")
        sys.exit(0)
    except Exception as e:
        print(f"Error processing image: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()

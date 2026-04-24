"""
Test PDF formatting fixes
"""
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent / "src"))

from services.pdf_generator import PDFGenerator, format_text

# Test the format_text function
test_cases = [
    ("**Bold Text:** Regular text", "<strong>Bold Text:</strong> Regular text"),
    ("Text with &amp; ampersand", "Text with & ampersand"),
    ("Text with &#39; apostrophe", "Text with ' apostrophe"),
    ("**Multiple** **bold** sections", "<strong>Multiple</strong> <strong>bold</strong> sections"),
    ("S&amp;P 500&#39;s performance", "S&P 500's performance"),
]

print("Testing format_text function:")
print("-" * 60)
for input_text, expected in test_cases:
    result = format_text(input_text)
    status = "✓" if result == expected else "✗"
    print(f"{status} Input:    {input_text}")
    print(f"  Expected: {expected}")
    print(f"  Got:      {result}")
    print()

# Test PDF generator initialization
print("\nTesting PDF Generator initialization:")
print("-" * 60)
try:
    pdf_gen = PDFGenerator()
    print("✓ PDF Generator initialized successfully")
    print(f"✓ Custom filter 'format_text' registered: {'format_text' in pdf_gen.env.filters}")
except Exception as e:
    print(f"✗ Error: {e}")

print("\nAll tests completed!")

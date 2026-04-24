"""
Test wkhtmltopdf installation and PDF generation
"""
import pdfkit
from pathlib import Path

# Test HTML with modern CSS
test_html = """
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 40px;
        }
        .gradient-box {
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
            color: white;
            padding: 40px;
            border-radius: 12px;
            text-align: center;
        }
        .metrics {
            display: flex;
            justify-content: space-around;
            margin-top: 30px;
        }
        .metric {
            background: white;
            color: #1e40af;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
    </style>
</head>
<body>
    <div class="gradient-box">
        <h1>Test Report - Modern PDF</h1>
        <p>If you see gradients and rounded corners, wkhtmltopdf is working!</p>
    </div>
    <div class="metrics">
        <div class="metric">
            <h2>$1.8M</h2>
            <p>Portfolio Value</p>
        </div>
        <div class="metric">
            <h2>+22.9%</h2>
            <p>YTD Return</p>
        </div>
    </div>
</body>
</html>
"""

# Output path
output_dir = Path(__file__).parent.parent / "output" / "reports"
output_dir.mkdir(parents=True, exist_ok=True)
test_pdf = output_dir / "test_wkhtmltopdf.pdf"

# Try to generate PDF
try:
    # Check if wkhtmltopdf exists (Windows + Linux)
    import shutil
    import platform
    wkhtmltopdf_path = None
    if platform.system() == "Windows":
        p = Path(r'C:\Program Files\wkhtmltopdf\bin\wkhtmltopdf.exe')
        if p.exists():
            wkhtmltopdf_path = str(p)
    else:
        for p in ["/usr/bin/wkhtmltopdf", "/usr/local/bin/wkhtmltopdf"]:
            if Path(p).exists():
                wkhtmltopdf_path = p
                break
    if not wkhtmltopdf_path:
        wkhtmltopdf_path = shutil.which("wkhtmltopdf")
    if wkhtmltopdf_path:
        config = pdfkit.configuration(wkhtmltopdf=wkhtmltopdf_path)
        print(f"✓ Found wkhtmltopdf at: {wkhtmltopdf_path}")
    else:
        print("✗ wkhtmltopdf NOT found. See PDF_SETUP.md or https://wkhtmltopdf.org/downloads.html")
        exit(1)
    
    # Generate PDF
    options = {
        'page-size': 'Letter',
        'margin-top': '0mm',
        'margin-right': '0mm',
        'margin-bottom': '0mm',
        'margin-left': '0mm',
        'encoding': 'UTF-8',
        'enable-local-file-access': None,
    }
    
    pdfkit.from_string(test_html, str(test_pdf), options=options, configuration=config)
    
    print(f"✓ PDF generated successfully: {test_pdf}")
    print("\nOpen the PDF to verify:")
    print("- Blue gradient background")
    print("- Rounded corners")
    print("- White metric boxes with shadows")
    print("\nIf you see these, the system is ready for professional reports!")
    
except Exception as e:
    print(f"✗ Error: {e}")
    print("\nTroubleshooting:")
    print("1. Install wkhtmltopdf from: https://wkhtmltopdf.org/downloads.html")
    print("2. Restart your terminal/IDE")
    print("3. Run this test again")

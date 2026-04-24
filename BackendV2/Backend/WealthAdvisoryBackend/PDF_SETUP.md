# wkhtmltopdf Setup for PDF Generation

The PDF generator uses `pdfkit` + `wkhtmltopdf` to create reports. You must install wkhtmltopdf.

## Windows (Local Development)

### Step 1: Download wkhtmltopdf

- Go to https://wkhtmltopdf.org/downloads.html
- Scroll to **Windows** section
- Download **64-bit**: `wkhtmltox-0.12.6-1.msvc2015-win64.exe` (or 32-bit if needed)

### Step 2: Install

- Run the installer
- Keep the default path: `C:\Program Files\wkhtmltopdf\`
- Click through Next → Install → Finish

### Step 3: Verify

```cmd
"C:\Program Files\wkhtmltopdf\bin\wkhtmltopdf.exe" --version
```

Should show: `wkhtmltopdf 0.12.6 (with patched qt)`

### Step 4: Python Package

```cmd
pip install pdfkit
```

(or already in `requirements.txt`)

### Different Install Path?

If you installed elsewhere, set the path in your environment or edit `src/services/pdf_generator.py` — it checks `C:\Program Files\wkhtmltopdf\bin\wkhtmltopdf.exe` first, then falls back to `wkhtmltopdf` in your PATH.

## Linux (EC2/Production)

On Ubuntu/Debian, wkhtmltopdf is installed via apt (included in `deploy/setup-server.sh`):

```bash
sudo apt-get install -y wkhtmltopdf
```

Path: `/usr/bin/wkhtmltopdf` (auto-detected by pdf_generator.py)

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Access Denied" on Windows | Right-click installer → Run as Administrator |
| `wkhtmltopdf` not found | Check path; install to default or add to PATH |
| PDF generation fails | Run `python test_pdf.py` in WealthAdvisoryBackend |

"""
PDF Generator Service - HTML to PDF using pdfkit/wkhtmltopdf
"""
import platform
import shutil
from pathlib import Path
from typing import Dict, Optional
from jinja2 import Environment, FileSystemLoader
import pdfkit
import logging
import re
import html

logger = logging.getLogger(__name__)


def _find_wkhtmltopdf() -> Optional[str]:
    """Find wkhtmltopdf path - Windows default or Linux/apt, else system PATH."""
    if platform.system() == "Windows":
        win_path = r"C:\Program Files\wkhtmltopdf\bin\wkhtmltopdf.exe"
        if Path(win_path).exists():
            return win_path
    else:
        # Linux (apt: wkhtmltopdf) - usually /usr/bin/wkhtmltopdf
        for path in ["/usr/bin/wkhtmltopdf", "/usr/local/bin/wkhtmltopdf"]:
            if Path(path).exists():
                return path
    return shutil.which("wkhtmltopdf")


def format_text(text):
    """Convert markdown bold to HTML and decode entities"""
    if not text:
        return text
    # Decode HTML entities first
    text = html.unescape(str(text))
    # Convert **text** to <strong>text</strong>
    text = re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', text)
    return text


class PDFGenerator:
    """Generate professional PDFs from HTML templates"""
    
    def __init__(self):
        # Set up Jinja2 template environment
        template_dir = Path(__file__).parent.parent / "templates" / "report"
        self.env = Environment(
            loader=FileSystemLoader(str(template_dir)),
            autoescape=True
        )
        
        # Add custom filter
        self.env.filters['format_text'] = format_text
        
        # wkhtmltopdf configuration - auto-detect Windows/Linux path
        wkhtmltopdf_path = _find_wkhtmltopdf()
        self.config = pdfkit.configuration(wkhtmltopdf=wkhtmltopdf_path) if wkhtmltopdf_path else None
        
        # PDF options
        self.options = {
            'page-size': 'Letter',
            'margin-top': '0mm',
            'margin-right': '0mm',
            'margin-bottom': '0mm',
            'margin-left': '0mm',
            'encoding': 'UTF-8',
            'enable-local-file-access': None,
            'no-outline': None,
            'dpi': 300,
            'print-media-type': None
        }
    
    def generate_pdf(self, report_data: Dict, output_path: str) -> str:
        """
        Generate PDF from report data
        
        Args:
            report_data: Dictionary containing all report sections
            output_path: Full path where PDF should be saved
            
        Returns:
            Path to generated PDF file
        """
        try:
            # Render HTML from template
            template = self.env.get_template('base.html')
            html_content = template.render(report=report_data)
            
            # Convert HTML to PDF
            if self.config:
                pdfkit.from_string(html_content, output_path, options=self.options, configuration=self.config)
            else:
                pdfkit.from_string(html_content, output_path, options=self.options)
            
            logger.info(f"[PDF] Generated successfully: {output_path}")
            return output_path
            
        except Exception as e:
            logger.error(f"[PDF] Generation failed: {str(e)}")
            raise

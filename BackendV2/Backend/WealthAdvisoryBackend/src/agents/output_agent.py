"""
Output Agent - Step 8: Assemble final report and generate PDF
"""
from typing import Dict
from datetime import datetime
from pathlib import Path
import sys

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

from services.pdf_generator import PDFGenerator


class OutputAgent:
    """Step 8: Generate Report Output with PDF"""
    
    def __init__(self):
        self.pdf_generator = PDFGenerator()
    
    async def execute(self, state_data: Dict) -> Dict:
        """Assemble all sections into final report and generate PDF"""
        try:
            client_name = state_data.get("client_name", "Client")
            period = state_data.get("period", {})
            firm_name = state_data.get("firm_name", "Wealth Management Firm")
            
            period_name = period.get('name', 'Q4-2025') if isinstance(period, dict) else str(period)
            
            section_results = state_data.get("section_results", {})
            
            # Assemble report structure
            report = {
                'cover_page': {
                    'client_name': client_name,
                    'period': period_name,
                    'firm_name': firm_name,
                    'generation_date': datetime.now().strftime("%B %d, %Y"),
                    'report_title': f"Portfolio Performance Report - {period_name}"
                },
                'sections': section_results,
                'total_sections': len(section_results)
            }
            
            # Generate PDF
            pdf_path = await self._generate_pdf(report, client_name, period_name)
            
            # Generate summary
            summary = self._generate_summary(section_results)
            
            return {
                "status": "complete",
                "section": "output",
                "report": report,
                "summary": summary,
                "pdf_path": pdf_path,
                "message": f"Complete report generated for {client_name} - {period_name}",
                "pdf_ready": True
            }
            
        except Exception as e:
            import traceback
            return {
                "status": "error",
                "error": f"{str(e)}\n{traceback.format_exc()}"
            }
    
    async def _generate_pdf(self, report: Dict, client_name: str, period: str) -> str:
        """Generate PDF report using HTML templates"""
        try:
            # Create output directory
            output_dir = Path(__file__).parent.parent.parent.parent / "output" / "reports"
            output_dir.mkdir(parents=True, exist_ok=True)
            
            # Generate filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"{client_name.replace(' ', '_')}_{period.replace(' ', '_')}_{timestamp}.pdf"
            pdf_path = output_dir / filename
            
            # Generate PDF using HTML template
            self.pdf_generator.generate_pdf(report, str(pdf_path))
            
            return str(pdf_path.absolute())
            
        except Exception as e:
            import traceback
            print(f"[PDF] Error: {traceback.format_exc()}")
            return f"PDF generation failed: {str(e)}"
    
    def _generate_summary(self, sections: Dict) -> str:
        """Generate executive summary"""
        completed = len(sections)
        section_names = list(sections.keys())
        return f"Report complete with {completed} sections: {', '.join(section_names)}"

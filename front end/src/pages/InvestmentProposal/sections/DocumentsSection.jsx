import React from 'react';
import { FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { motion } from 'framer-motion';

const DocumentsSection = ({ documents, isExpanded, onToggle }) => {
  return (
    <section className="ip-section">
      <div className="section-header" onClick={onToggle}>
        <FileText size={20} />
        <h2>Customer Service Toolkit</h2>
        {isExpanded ? <ChevronUp size={20} className="ip-chevron-icon" /> : <ChevronDown size={20} className="ip-chevron-icon" />}
      </div>
      {isExpanded && (
        <>
          <div className="ip-onboarding-message">
            <p>To proceed with investment proposal, you may share these pre-filled forms with client.</p>
          </div>
          <div className="documents-grid">
            {documents.map((doc, idx) => (
              <motion.div 
                key={idx} 
                className="document-card"
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="onboarding-icon">
                  <FileText size={32} />
                </div>
                <h4>{doc.title}</h4>
                <p>{doc.description}</p>
                <a href={doc.link} target="_blank" rel="noopener noreferrer" className="onboarding-link">
                  View Document →
                </a>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </section>
  );
};

export default DocumentsSection;

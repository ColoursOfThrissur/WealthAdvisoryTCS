/**
 * Utility to format LLM text responses with markdown-like syntax.
 * Sanitizes output to prevent XSS.
 */
import React from 'react';

const escapeHtml = (text) => {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(text));
  return div.innerHTML;
};

export const formatText = (text) => {
  if (!text) return '';

  // Escape HTML first to prevent XSS
  let safe = escapeHtml(text);

  // Convert **bold** to <strong>
  safe = safe.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Split into lines for processing
  const lines = safe.split('\n');
  const processed = [];
  let listItems = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Bullet point
    if (line.match(/^[•\*\-]\s+(.+)$/)) {
      const content = line.replace(/^[•\*\-]\s+/, '');
      listItems.push(`<li>${content}</li>`);
      inList = true;
    }
    // Numbered list
    else if (line.match(/^\d+\.\s+(.+)$/)) {
      const content = line.replace(/^\d+\.\s+/, '');
      listItems.push(`<li>${content}</li>`);
      inList = true;
    }
    else {
      if (inList && listItems.length > 0) {
        processed.push(`<ul>${listItems.join('')}</ul>`);
        listItems = [];
        inList = false;
      }
      if (line) {
        processed.push(`<p>${line}</p>`);
      }
    }
  }

  if (inList && listItems.length > 0) {
    processed.push(`<ul>${listItems.join('')}</ul>`);
  }

  return processed.join('');
};

export const FormattedText = ({ text, className = '' }) => {
  return (
    <div
      className={`formatted-content ${className}`}
      dangerouslySetInnerHTML={{ __html: formatText(text) }}
    />
  );
};

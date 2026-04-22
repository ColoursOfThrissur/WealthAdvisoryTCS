import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import './PortfolioRebalancingNative.css';

const PortfolioRebalancingSimple = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="pr-page">
      <div className="pr-header">
        <button onClick={() => navigate('/worklist/rebalancing')} className="pr-back-btn">
          <ArrowLeft size={18} />
          Back to Worklist
        </button>
      </div>
      <div className="pr-content">
        <motion.section
          className="pr-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="pr-section-header">
            <Shield size={22} />
            <h2>Client Profile</h2>
          </div>
          <div className="pr-client-profile-content">
            <p>View complete client profile, relationship timeline, investment comparison, liquidity analysis, tax loss harvesting opportunities, and recommended actions in the client detail page.</p>
            <button 
              className="pr-view-profile-btn"
              onClick={() => navigate(`/client/${clientId}/rebalancing`)}
            >
              View Client Profile
            </button>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default PortfolioRebalancingSimple;

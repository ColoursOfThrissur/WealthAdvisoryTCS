import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './Tooltip.css';

const OFFSET = 8;
const ARROW_SIZE = 6;
const MARGIN = 6;

const Tooltip = ({
  content,
  placement = 'top',
  delay = 400,
  disabled = false,
  children,
}) => {
  const [visible, setVisible] = useState(false);
  const [style, setStyle] = useState({});
  const [arrowStyle, setArrowStyle] = useState({});
  const [actualPlacement, setActualPlacement] = useState(placement);
  const wrapperRef = useRef(null);
  const bubbleRef = useRef(null);
  const showTimer = useRef(null);

  const computeCoords = useCallback(() => {
    if (!wrapperRef.current || !bubbleRef.current) return;

    const trigger = wrapperRef.current.getBoundingClientRect();
    const bubbleW = bubbleRef.current.offsetWidth;
    const bubbleH = bubbleRef.current.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const fits = {
      top:    trigger.top  - bubbleH - OFFSET >= MARGIN,
      bottom: trigger.bottom + bubbleH + OFFSET <= vh - MARGIN,
      left:   trigger.left - bubbleW - OFFSET >= MARGIN,
      right:  trigger.right + bubbleW + OFFSET <= vw - MARGIN,
    };

    let actual = placement;
    if ((placement === 'top' || placement === 'bottom') && !fits[placement]) {
      actual = fits.top ? 'top' : 'bottom';
    }
    if ((placement === 'left' || placement === 'right') && !fits[placement]) {
      actual = fits.left ? 'left' : 'right';
    }

    // Ideal bubble position (before clamping)
    let top = 0, left = 0;
    if (actual === 'top') {
      top  = trigger.top - bubbleH - OFFSET;
      left = trigger.left + trigger.width / 2 - bubbleW / 2;
    } else if (actual === 'bottom') {
      top  = trigger.bottom + OFFSET;
      left = trigger.left + trigger.width / 2 - bubbleW / 2;
    } else if (actual === 'left') {
      top  = trigger.top + trigger.height / 2 - bubbleH / 2;
      left = trigger.left - bubbleW - OFFSET;
    } else {
      top  = trigger.top + trigger.height / 2 - bubbleH / 2;
      left = trigger.right + OFFSET;
    }

    // Clamp bubble to viewport
    const clampedLeft = Math.max(MARGIN, Math.min(left, vw - bubbleW - MARGIN));
    const clampedTop  = Math.max(MARGIN, Math.min(top,  vh - bubbleH - MARGIN));

    // Arrow offset — point at trigger center, accounting for clamping shift
    let arrowPos = {};
    if (actual === 'top' || actual === 'bottom') {
      // Trigger center X relative to clamped bubble left
      const triggerCenterX = trigger.left + trigger.width / 2;
      const arrowLeft = triggerCenterX - clampedLeft;
      // Clamp arrow within bubble bounds (keep away from rounded corners)
      const arrowLeftClamped = Math.max(ARROW_SIZE + 4, Math.min(arrowLeft, bubbleW - ARROW_SIZE - 4));
      arrowPos = { left: arrowLeftClamped };
    } else {
      // Trigger center Y relative to clamped bubble top
      const triggerCenterY = trigger.top + trigger.height / 2;
      const arrowTop = triggerCenterY - clampedTop;
      const arrowTopClamped = Math.max(ARROW_SIZE + 4, Math.min(arrowTop, bubbleH - ARROW_SIZE - 4));
      arrowPos = { top: arrowTopClamped };
    }

    setActualPlacement(actual);
    setStyle({ top: clampedTop, left: clampedLeft });
    setArrowStyle(arrowPos);
  }, [placement]);

  const show = useCallback(() => {
    if (disabled || !content) return;
    showTimer.current = setTimeout(() => {
      setVisible(true);
    }, delay);
  }, [disabled, content, delay]);

  const hide = useCallback(() => {
    clearTimeout(showTimer.current);
    setVisible(false);
  }, []);

  // Recompute after visible so bubbleRef has real dimensions
  useEffect(() => {
    if (visible) computeCoords();
  }, [visible, computeCoords]);

  // Recompute on scroll/resize while visible
  useEffect(() => {
    if (!visible) return;
    const update = () => computeCoords();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [visible, computeCoords]);

  if (disabled || !content) return children;

  return (
    <>
      <span
        ref={wrapperRef}
        className="tooltip-wrapper"
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        {children}
      </span>

      {createPortal(
        <span
          ref={bubbleRef}
          role="tooltip"
          className={`tooltip-bubble tooltip-bubble--${actualPlacement}${visible ? ' tooltip-bubble--visible' : ''}`}
          style={style}
          data-arrow-left={arrowStyle.left}
          data-arrow-top={arrowStyle.top}
        >
          {content}
          <span
            className="tooltip-arrow"
            style={arrowStyle.left !== undefined
              ? { left: arrowStyle.left }
              : { top: arrowStyle.top }}
          />
        </span>,
        document.body
      )}
    </>
  );
};

export default Tooltip;

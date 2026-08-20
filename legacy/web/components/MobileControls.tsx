import { useEffect, useRef, useState } from "react";

interface Vector2D {
  x: number;
  y: number;
}

/**
 * Mobile Touch Controls for Kleeblatt Adventure
 * Provides analog stick and action buttons for mobile play
 */
export function MobileControls() {
  const [isMobile, setIsMobile] = useState(false);
  const [stickPosition, setStickPosition] = useState<Vector2D>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [touchId, setTouchId] = useState<number | null>(null);
  const stickRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Check if we're on mobile device
  useEffect(() => {
    const checkMobile = () => {
      // Check user agent
      const userAgent =
        navigator.userAgent || navigator.vendor || ((window as { opera?: string }).opera ?? "");
      const isMobileDevice =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile/i.test(
          userAgent,
        );

      // Also check screen dimensions
      const isSmallScreen = window.innerWidth <= 768;

      // Additional check for touch capability
      const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;

      setIsMobile(isMobileDevice || isSmallScreen || hasTouch);
    };

    checkMobile();

    // Also check window size
    const handleResize = () => {
      const userAgent =
        navigator.userAgent || navigator.vendor || ((window as { opera?: string }).opera ?? "");
      const isMobileDevice =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile/i.test(
          userAgent,
        );
      const isSmallScreen = window.innerWidth <= 768;
      const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
      setIsMobile(isMobileDevice || isSmallScreen || hasTouch);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handle touch events for analog stick
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!stickRef.current || !isMobile) return;

    const touch = e.touches[0];
    const rect = stickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Only start dragging if touching the stick itself
    const distance = Math.sqrt(
      Math.pow(touch.clientX - centerX, 2) + Math.pow(touch.clientY - centerY, 2),
    );

    if (distance <= rect.width / 2) {
      setIsDragging(true);
      setTouchId(touch.identifier);
      updateStickPosition(touch.clientX, touch.clientY, rect);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || touchId === null || !isMobile) return;

    const touch = Array.from(e.touches).find((t) => t.identifier === touchId);
    if (touch && stickRef.current) {
      const rect = stickRef.current.getBoundingClientRect();
      updateStickPosition(touch.clientX, touch.clientY, rect);
    }
  };

  const handleTouchEnd = (_e: React.TouchEvent) => {
    if (isDragging && isMobile) {
      setIsDragging(false);
      setTouchId(null);
      setStickPosition({ x: 0, y: 0 }); // Reset to center
    }
  };

  const updateStickPosition = (clientX: number, clientY: number, rect: DOMRect) => {
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let deltaX = clientX - centerX;
    let deltaY = clientY - centerY;

    // Limit movement to stick radius
    const maxDistance = rect.width / 2;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance > maxDistance) {
      deltaX = (deltaX / distance) * maxDistance;
      deltaY = (deltaY / distance) * maxDistance;
    }

    setStickPosition({ x: deltaX / maxDistance, y: deltaY / maxDistance });
  };

  // Handle mouse events for desktop testing
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isMobile) {
      setIsDragging(true);
      const rect = stickRef.current?.getBoundingClientRect();
      if (rect) {
        updateStickPosition(e.clientX, e.clientY, rect);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && !isMobile && stickRef.current) {
      const rect = stickRef.current.getBoundingClientRect();
      updateStickPosition(e.clientX, e.clientY, rect);
    }
  };

  const handleMouseUp = () => {
    if (isDragging && !isMobile) {
      setIsDragging(false);
      setStickPosition({ x: 0, y: 0 });
    }
  };

  // Action buttons
  const handleActionPress = (action: string) => {
    // This would be where we emit action events to Phaser
    console.info(`Action pressed: ${action}`);
  };

  // Don't show on desktop
  if (!isMobile) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="mobile-controls-overlay"
      style={{
        position: "fixed",
        bottom: "20px",
        left: "20px",
        right: "20px",
        height: "200px",
        pointerEvents: "none",
        zIndex: 1000,
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Analog Stick Area */}
      <div
        className="stick-container"
        style={{
          position: "absolute",
          bottom: "0",
          left: "0",
          width: "150px",
          height: "150px",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
      >
        {/* Stick Base */}
        <div
          className="stick-base"
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            backgroundColor: "rgba(255, 255, 255, 0.2)",
            border: "2px solid rgba(255, 255, 255, 0.4)",
            backdropFilter: "blur(4px)",
            transform: "translate(-50%, -50%)",
            left: "50%",
            top: "50%",
            pointerEvents: "none",
          }}
        />

        {/* Stick */}
        <div
          ref={stickRef}
          className="stick"
          style={{
            position: "absolute",
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            border: "2px solid rgba(255, 255, 255, 0.9)",

            transition: "transform 0.05s cubic-bezier(0.4, 0, 0.2, 1)",
            pointerEvents: "none",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            left: "50%",
            top: "50%",
            transform: `translate(calc(-50% + ${stickPosition.x * 40}px), calc(-50% + ${stickPosition.y * 40}px))`,
          }}
        />
      </div>

      {/* Action Buttons */}
      <div
        className="action-buttons"
        style={{
          position: "absolute",
          bottom: "0",
          right: "0",
          display: "flex",
          gap: "15px",
        }}
      >
        <button
          className="action-button attack"
          onClick={() => handleActionPress("attack")}
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            backgroundColor: "rgba(255, 50, 50, 0.7)",
            border: "2px solid rgba(255, 255, 255, 0.8)",
            color: "white",
            fontSize: "14px",
            fontWeight: "bold",
            backdropFilter: "blur(4px)",
            cursor: "pointer",
            pointerEvents: "auto",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          }}
        >
          A
        </button>
        <button
          className="action-button jump"
          onClick={() => handleActionPress("jump")}
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            backgroundColor: "rgba(50, 255, 50, 0.7)",
            border: "2px solid rgba(255, 255, 255, 0.8)",
            color: "white",
            fontSize: "14px",
            fontWeight: "bold",
            backdropFilter: "blur(4px)",
            cursor: "pointer",
            pointerEvents: "auto",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          }}
        >
          J
        </button>
      </div>
    </div>
  );
}

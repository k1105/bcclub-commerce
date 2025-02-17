import React, { useState, useEffect } from "react";

const DraggableCircle: React.FC = () => {
  const [position, setPosition] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      setIsDragging(true);
    };

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      setPosition({ x: touch.clientX, y: touch.clientY });
      setIsDragging(true);
    };

    // const handleMouseMove = (e: MouseEvent) => {
    //   if (isDragging) {
    //     setPosition({ x: e.clientX, y: e.clientY });
    //   }
    // };

    // const handleTouchMove = (e: TouchEvent) => {
    //   if (isDragging) {
    //     const touch = e.touches[0];
    //     setPosition({ x: touch.clientX, y: touch.clientY });
    //   }
    // };

    const handleMouseUp = () => {
      setIsDragging(false);
      //   setPosition(null);
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
      //   setPosition(null);
    };

    document.addEventListener("mousedown", handleMouseDown);
    // document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("touchstart", handleTouchStart);
    // document.addEventListener("touchmove", handleTouchMove);
    document.addEventListener("touchend", handleTouchEnd);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      //   document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchstart", handleTouchStart);
      //   document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isDragging]);

  return (
    <>
      <div
        style={{
          position: "fixed",
          top: position.y - 50,
          left: position.x - 50,
          width: "100px",
          height: "100px",
          borderRadius: "50%",
          backgroundColor: "rgba(0, 0, 255, 0.5)",
          pointerEvents: "none",
          zIndex: "99",
          opacity: isDragging ? 1 : 0,
          transition: "opacity 300ms ease",
        }}
      />
    </>
  );
};

export default DraggableCircle;

import { useEffect } from 'react';

const InteractiveBackground = () => {
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const { clientX, clientY } = event;
      // We use requestAnimationFrame to ensure we don't cause performance issues
      requestAnimationFrame(() => {
        document.body.style.setProperty('--x', `${clientX}px`);
        document.body.style.setProperty('--y', `${clientY}px`);
      });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return null; // This component does not render any visible elements
};

export default InteractiveBackground;
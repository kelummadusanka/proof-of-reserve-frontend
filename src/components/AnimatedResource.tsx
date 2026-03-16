import { useEffect, useRef } from "react";

interface AnimatedResourceProps {
  type: "token" | "storage" | "compute" | "bandwidth" | "generic";
  className?: string;
}

const colorSchemes = {
  token: {
    primary: "hsl(280, 100%, 70%)",
    secondary: "hsl(200, 100%, 60%)",
    glow: "hsl(280, 100%, 70%)",
  },
  storage: {
    primary: "hsl(330, 100%, 65%)",
    secondary: "hsl(25, 100%, 60%)",
    glow: "hsl(330, 100%, 65%)",
  },
  compute: {
    primary: "hsl(150, 100%, 50%)",
    secondary: "hsl(200, 100%, 60%)",
    glow: "hsl(150, 100%, 50%)",
  },
  bandwidth: {
    primary: "hsl(200, 100%, 60%)",
    secondary: "hsl(280, 100%, 70%)",
    glow: "hsl(200, 100%, 60%)",
  },
  generic: {
    primary: "hsl(40, 100%, 50%)",
    secondary: "hsl(25, 100%, 60%)",
    glow: "hsl(40, 100%, 50%)",
  },
};

export function AnimatedResource({ type, className = "" }: AnimatedResourceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = colorSchemes[type];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const centerX = width / 2;
    const centerY = height / 2;

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      alpha: number;
      color: string;
    }

    const particles: Particle[] = [];
    const particleCount = 30;

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const distance = 30 + Math.random() * 40;
      particles.push({
        x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: 1 + Math.random() * 2,
        alpha: 0.3 + Math.random() * 0.7,
        color: Math.random() > 0.5 ? colors.primary : colors.secondary,
      });
    }

    let frame = 0;
    let animationId: number;

    const animate = () => {
      frame++;
      ctx.clearRect(0, 0, width, height);

      // Draw central orb with pulsing glow
      const pulseScale = 1 + Math.sin(frame * 0.03) * 0.15;
      const orbRadius = 25 * pulseScale;

      // Outer glow
      const gradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, orbRadius * 2.5
      );
      gradient.addColorStop(0, colors.glow.replace(")", ", 0.4)").replace("hsl", "hsla"));
      gradient.addColorStop(0.5, colors.glow.replace(")", ", 0.1)").replace("hsl", "hsla"));
      gradient.addColorStop(1, "transparent");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, orbRadius * 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Inner orb gradient
      const innerGradient = ctx.createRadialGradient(
        centerX - orbRadius * 0.3, centerY - orbRadius * 0.3, 0,
        centerX, centerY, orbRadius
      );
      innerGradient.addColorStop(0, colors.secondary);
      innerGradient.addColorStop(0.7, colors.primary);
      innerGradient.addColorStop(1, colors.glow.replace(")", ", 0.8)").replace("hsl", "hsla"));
      ctx.fillStyle = innerGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, orbRadius, 0, Math.PI * 2);
      ctx.fill();

      // Draw rotating rings
      ctx.strokeStyle = colors.primary.replace(")", ", 0.3)").replace("hsl", "hsla");
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        const ringRadius = 45 + i * 15;
        const rotation = frame * 0.01 * (i % 2 === 0 ? 1 : -1);
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(rotation);
        ctx.beginPath();
        ctx.ellipse(0, 0, ringRadius, ringRadius * 0.3, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Update and draw particles
      particles.forEach((p, i) => {
        // Orbital motion
        const angle = Math.atan2(p.y - centerY, p.x - centerX);
        const distance = Math.sqrt((p.x - centerX) ** 2 + (p.y - centerY) ** 2);
        const orbitSpeed = 0.008;
        const newAngle = angle + orbitSpeed;
        
        p.x = centerX + Math.cos(newAngle) * distance + p.vx;
        p.y = centerY + Math.sin(newAngle) * distance + p.vy;

        // Keep particles in bounds
        const maxDist = 80;
        const currentDist = Math.sqrt((p.x - centerX) ** 2 + (p.y - centerY) ** 2);
        if (currentDist > maxDist) {
          const scale = maxDist / currentDist;
          p.x = centerX + (p.x - centerX) * scale;
          p.y = centerY + (p.y - centerY) * scale;
        }
        if (currentDist < 35) {
          const scale = 35 / currentDist;
          p.x = centerX + (p.x - centerX) * scale;
          p.y = centerY + (p.y - centerY) * scale;
        }

        // Draw particle with glow
        const particleGlow = ctx.createRadialGradient(
          p.x, p.y, 0,
          p.x, p.y, p.radius * 3
        );
        particleGlow.addColorStop(0, p.color.replace(")", `, ${p.alpha})`).replace("hsl", "hsla"));
        particleGlow.addColorStop(1, "transparent");
        ctx.fillStyle = particleGlow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2);
        ctx.fill();

        // Draw particle core
        ctx.fillStyle = p.color.replace(")", `, ${p.alpha})`).replace("hsl", "hsla");
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        // Draw connection lines
        particles.forEach((p2, j) => {
          if (j <= i) return;
          const dx = p2.x - p.x;
          const dy = p2.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 30) {
            ctx.strokeStyle = colors.primary.replace(")", `, ${0.15 * (1 - dist / 30)})`).replace("hsl", "hsla");
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        });
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [type, colors]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full ${className}`}
      style={{ width: "100%", height: "100%" }}
    />
  );
}

// Helper to determine resource type from name
export function getResourceType(name: string): AnimatedResourceProps["type"] {
  const lower = name.toLowerCase();
  if (lower.includes("token") || lower.includes("dot") || lower.includes("ksm")) return "token";
  if (lower.includes("storage") || lower.includes("gb") || lower.includes("tb")) return "storage";
  if (lower.includes("compute") || lower.includes("cpu") || lower.includes("hour")) return "compute";
  if (lower.includes("bandwidth") || lower.includes("network")) return "bandwidth";
  return "generic";
}

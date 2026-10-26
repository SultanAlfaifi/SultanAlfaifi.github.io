"use client";

import { useEffect, useRef } from "react";
import { motionAllowed, subscribeMotion } from "./motion-preference";
import { unlockSecret } from "./secrets";

type FieldNode = { x: number; y: number; vx: number; vy: number; label: string | null; tx: number; ty: number };
type Packet = { from: number; to: number; t: number; speed: number; hops: number };
type Ripple = { x: number; y: number; age: number; size: number };

const LINK_DISTANCE = 136;
const POINTER_RADIUS = 170;
const MAX_PACKETS = 22;
const FREE_DAMPING = 0.94;
const HOLD_DELAY = 260;
const MINT = "125, 226, 209";
const PAPER = "255, 250, 251";

// A living graph of agents passing messages. Decorative only: every link it hints at exists as real content.
// It is born in a burst on load, and a press-and-hold turns the pointer into a gravity well.
export function AgentField({ labels }: { labels: string[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    const context = canvas?.getContext("2d");
    if (!canvas || !host || !context) return;

    let width = 0;
    let height = 0;
    let nodes: FieldNode[] = [];
    const packets: Packet[] = [];
    const ripples: Ripple[] = [];
    let grid = new Map<number, number[]>();
    let columns = 1;
    let frame = 0;
    let last = 0;
    let visible = true;
    let bangAt = 0;
    let freeUntil = 0;
    let well = false;
    let holdTimer = 0;
    let holding = false;
    const pointer = { x: -9999, y: -9999, clientX: -9999, clientY: -9999, active: false };
    const monoFamily = getComputedStyle(document.body).getPropertyValue("--font-mono").trim() || "monospace";

    function seed(withBang: boolean) {
      const area = width * height;
      const count = Math.round(Math.min(118, Math.max(34, area / 15000)));
      const margin = Math.min(90, width * 0.08);
      const centerX = width * 0.62;
      const centerY = height * 0.45;
      nodes = Array.from({ length: count }, (_, index) => {
        const tx = margin + Math.random() * (width - margin * 2);
        const ty = margin + Math.random() * (height - margin * 2);
        return {
          x: withBang ? centerX + (Math.random() - 0.5) * 24 : tx,
          y: withBang ? centerY + (Math.random() - 0.5) * 24 : ty,
          vx: withBang ? 0 : (Math.random() - 0.5) * 0.22,
          vy: withBang ? 0 : (Math.random() - 0.5) * 0.22,
          tx,
          ty,
          label: index < labels.length && width > 640 ? labels[index] : null
        };
      });
      packets.length = 0;
    }

    function resize() {
      const rect = host!.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const nextWidth = Math.max(1, Math.round(rect.width));
      const nextHeight = Math.max(1, Math.round(rect.height));
      const reseed = Math.abs(nextWidth - width) > 80 || nodes.length === 0;
      const firstSeed = nodes.length === 0;
      width = nextWidth;
      height = nextHeight;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      context!.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (reseed) {
        const withBang = firstSeed && motionAllowed();
        seed(withBang);
        if (withBang) bangAt = performance.now() + (document.documentElement.dataset.intro === "play" ? 1650 : 220);
      }
      draw(0, performance.now());
    }

    function bucket() {
      columns = Math.ceil(width / LINK_DISTANCE) + 1;
      grid = new Map();
      nodes.forEach((node, index) => {
        const key = Math.floor(node.y / LINK_DISTANCE) * columns + Math.floor(node.x / LINK_DISTANCE);
        const cell = grid.get(key);
        if (cell) cell.push(index);
        else grid.set(key, [index]);
      });
    }

    function neighbours(index: number, callback: (other: number, distance: number) => void) {
      const node = nodes[index];
      const cx = Math.floor(node.x / LINK_DISTANCE);
      const cy = Math.floor(node.y / LINK_DISTANCE);
      for (let y = cy - 1; y <= cy + 1; y += 1) {
        for (let x = cx - 1; x <= cx + 1; x += 1) {
          const cell = grid.get(y * columns + x);
          if (!cell) continue;
          for (const other of cell) {
            if (other <= index) continue;
            const distance = Math.hypot(nodes[other].x - node.x, nodes[other].y - node.y);
            if (distance < LINK_DISTANCE) callback(other, distance);
          }
        }
      }
    }

    function nearestNeighbour(index: number, exclude = -1) {
      let best = -1;
      let bestDistance = LINK_DISTANCE * 1.25;
      const node = nodes[index];
      nodes.forEach((other, otherIndex) => {
        if (otherIndex === index || otherIndex === exclude) return;
        const distance = Math.hypot(other.x - node.x, other.y - node.y);
        if (distance < bestDistance && Math.random() > 0.25) {
          best = otherIndex;
          bestDistance = distance;
        }
      });
      return best;
    }

    function nearestNode(x: number, y: number) {
      let nearest = -1;
      let nearestDistance = Infinity;
      nodes.forEach((node, index) => {
        const distance = Math.hypot(node.x - x, node.y - y);
        if (distance < nearestDistance) {
          nearest = index;
          nearestDistance = distance;
        }
      });
      return nearest;
    }

    function launch(from: number, hops = 3) {
      if (packets.length >= MAX_PACKETS || from < 0) return;
      const to = nearestNeighbour(from);
      if (to >= 0) packets.push({ from, to, t: 0, speed: 0.012 + Math.random() * 0.014, hops });
    }

    // Time-based, so the burst lands in its final layout even when frames are throttled.
    let bangStart = 0;
    const BANG_DURATION = 1500;
    const origin = { x: 0, y: 0 };
    function bang(now: number) {
      bangAt = 0;
      bangStart = now;
      origin.x = width * 0.62;
      origin.y = height * 0.45;
      ripples.push({ x: origin.x, y: origin.y, age: 0, size: 260 });
    }
    function settleBang(now: number) {
      const progress = Math.min(1, (now - bangStart) / BANG_DURATION);
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      for (const node of nodes) {
        node.x = origin.x + (node.tx - origin.x) * eased;
        node.y = origin.y + (node.ty - origin.y) * eased;
      }
      if (progress === 1) {
        bangStart = 0;
        for (const node of nodes) {
          node.vx = (Math.random() - 0.5) * 0.22;
          node.vy = (Math.random() - 0.5) * 0.22;
        }
        for (let burst = 0; burst < 10; burst += 1) launch(Math.floor(Math.random() * nodes.length), 4);
      }
    }

    function explode(now: number) {
      well = false;
      freeUntil = now + 1400;
      for (const node of nodes) {
        const dx = node.x - pointer.x;
        const dy = node.y - pointer.y;
        const distance = Math.max(1, Math.hypot(dx, dy));
        const force = (7 + Math.random() * 11) * Math.max(0.25, 1 - distance / 900);
        node.vx = (dx / distance) * force;
        node.vy = (dy / distance) * force;
      }
      ripples.push({ x: pointer.x, y: pointer.y, age: 0, size: 320 });
      const center = nearestNode(pointer.x, pointer.y);
      for (let burst = 0; burst < 12; burst += 1) launch(center, 5);
      unlockSecret("gravity");
    }

    function step(delta: number, now: number) {
      if (bangAt) {
        if (now < bangAt) return;
        bang(now);
      }
      if (bangStart) {
        settleBang(now);
        for (let index = ripples.length - 1; index >= 0; index -= 1) {
          ripples[index].age += delta;
          if (ripples[index].age > 1000) ripples.splice(index, 1);
        }
        return;
      }
      const scale = Math.min(delta / 16.7, 3);
      const free = now < freeUntil;
      for (const node of nodes) {
        const dx = pointer.x - node.x;
        const dy = pointer.y - node.y;
        const distance = Math.hypot(dx, dy);
        if (well && distance > 1) {
          const pull = 0.5 * Math.min(1, 320 / distance);
          node.vx += (dx / distance) * pull * scale + (-dy / distance) * 0.18;
          node.vy += (dy / distance) * pull * scale + (dx / distance) * 0.18;
          node.vx *= 0.9;
          node.vy *= 0.9;
        } else {
          if (pointer.active && distance < POINTER_RADIUS && distance > 1) {
            const pull = (1 - distance / POINTER_RADIUS) * 0.012;
            node.vx += (dx / distance) * pull;
            node.vy += (dy / distance) * pull;
          }
          const damping = free ? FREE_DAMPING : 0.985;
          node.vx *= damping;
          node.vy *= damping;
        }
        const speed = Math.hypot(node.vx, node.vy);
        if (!free && !well) {
          if (speed < 0.06) {
            node.vx += (Math.random() - 0.5) * 0.02;
            node.vy += (Math.random() - 0.5) * 0.02;
          }
          if (speed > 1.1) {
            node.vx = (node.vx / speed) * 1.1;
            node.vy = (node.vy / speed) * 1.1;
          }
        }
        node.x += node.vx * scale;
        node.y += node.vy * scale;
        if (node.x < 8 || node.x > width - 8) node.vx *= -0.8;
        if (node.y < 8 || node.y > height - 8) node.vy *= -0.8;
        node.x = Math.min(width - 8, Math.max(8, node.x));
        node.y = Math.min(height - 8, Math.max(8, node.y));
      }

      for (let index = packets.length - 1; index >= 0; index -= 1) {
        const packet = packets[index];
        packet.t += packet.speed * scale;
        if (packet.t >= 1) {
          packets.splice(index, 1);
          if (packet.hops > 0) {
            const next = nearestNeighbour(packet.to, packet.from);
            if (next >= 0) packets.push({ from: packet.to, to: next, t: 0, speed: packet.speed, hops: packet.hops - 1 });
          }
        }
      }
      if (Math.random() < (well ? 0.4 : 0.05) * scale) launch(well ? nearestNode(pointer.x, pointer.y) : Math.floor(Math.random() * nodes.length));

      for (let index = ripples.length - 1; index >= 0; index -= 1) {
        ripples[index].age += delta;
        if (ripples[index].age > 1000) ripples.splice(index, 1);
      }
    }

    function draw(delta: number, now: number) {
      if (delta) step(delta, now);
      bucket();
      context!.clearRect(0, 0, width, height);
      context!.lineWidth = 1;

      nodes.forEach((node, index) => {
        neighbours(index, (other, distance) => {
          const strength = 1 - distance / LINK_DISTANCE;
          context!.strokeStyle = `rgba(${MINT}, ${strength * (well ? 0.4 : 0.26)})`;
          context!.beginPath();
          context!.moveTo(node.x, node.y);
          context!.lineTo(nodes[other].x, nodes[other].y);
          context!.stroke();
        });
      });

      if (pointer.active || well) {
        const radius = well ? 420 : POINTER_RADIUS;
        for (const node of nodes) {
          const distance = Math.hypot(pointer.x - node.x, pointer.y - node.y);
          if (distance > radius) continue;
          context!.strokeStyle = `rgba(${MINT}, ${(1 - distance / radius) * 0.55})`;
          context!.beginPath();
          context!.moveTo(pointer.x, pointer.y);
          context!.lineTo(node.x, node.y);
          context!.stroke();
        }
      }

      if (well) {
        const pulse = 18 + Math.sin(now / 90) * 6;
        const glow = context!.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, pulse * 3);
        glow.addColorStop(0, `rgba(${MINT}, 0.55)`);
        glow.addColorStop(1, `rgba(${MINT}, 0)`);
        context!.fillStyle = glow;
        context!.beginPath();
        context!.arc(pointer.x, pointer.y, pulse * 3, 0, Math.PI * 2);
        context!.fill();
      }

      context!.font = `500 11px ${monoFamily}`;
      context!.direction = "ltr";
      for (const node of nodes) {
        if (node.label) {
          context!.fillStyle = `rgba(${MINT}, 0.9)`;
          context!.beginPath();
          context!.arc(node.x, node.y, 3.2, 0, Math.PI * 2);
          context!.fill();
          context!.strokeStyle = `rgba(${MINT}, 0.35)`;
          context!.beginPath();
          context!.arc(node.x, node.y, 7, 0, Math.PI * 2);
          context!.stroke();
          context!.fillStyle = `rgba(${PAPER}, 0.5)`;
          context!.fillText(node.label, node.x + 11, node.y + 4);
        } else {
          context!.fillStyle = `rgba(${PAPER}, 0.42)`;
          context!.fillRect(node.x - 1, node.y - 1, 2, 2);
        }
      }

      for (const packet of packets) {
        const from = nodes[packet.from];
        const to = nodes[packet.to];
        if (!from || !to) continue;
        for (let trail = 3; trail >= 0; trail -= 1) {
          const t = Math.max(0, packet.t - trail * 0.035);
          const x = from.x + (to.x - from.x) * t;
          const y = from.y + (to.y - from.y) * t;
          context!.fillStyle = `rgba(${MINT}, ${trail === 0 ? 1 : 0.4 - trail * 0.1})`;
          context!.beginPath();
          context!.arc(x, y, trail === 0 ? 2.6 : 2 - trail * 0.4, 0, Math.PI * 2);
          context!.fill();
        }
      }

      for (const ripple of ripples) {
        const progress = ripple.age / 1000;
        context!.strokeStyle = `rgba(${MINT}, ${0.7 * (1 - progress)})`;
        context!.beginPath();
        context!.arc(ripple.x, ripple.y, 12 + progress * ripple.size, 0, Math.PI * 2);
        context!.stroke();
      }
    }

    function tick(time: number) {
      const delta = last ? Math.min(time - last, 64) : 16.7;
      last = time;
      const rect = canvas!.getBoundingClientRect();
      pointer.x = pointer.clientX - rect.left;
      pointer.y = pointer.clientY - rect.top;
      draw(delta, time);
      frame = requestAnimationFrame(tick);
    }

    function sync() {
      cancelAnimationFrame(frame);
      frame = 0;
      last = 0;
      if (visible && !document.hidden && motionAllowed()) frame = requestAnimationFrame(tick);
      else {
        if (bangAt || bangStart) {
          // A paused field still lands in its final layout.
          for (const node of nodes) {
            node.x = node.tx;
            node.y = node.ty;
          }
          bangAt = 0;
          bangStart = 0;
        }
        draw(0, performance.now());
      }
    }

    function handlePointerMove(event: PointerEvent) {
      if (event.pointerType !== "mouse" && !holding) return;
      pointer.clientX = event.clientX;
      pointer.clientY = event.clientY;
      const rect = canvas!.getBoundingClientRect();
      pointer.active = event.clientY >= rect.top && event.clientY <= rect.bottom;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Element | null;
      if (!motionAllowed() || event.button > 0 || target?.closest("a, button, input, video, .intro-film")) return;
      const rect = canvas!.getBoundingClientRect();
      pointer.clientX = event.clientX;
      pointer.clientY = event.clientY;
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      ripples.push({ x, y, age: 0, size: 120 });
      const nearest = nearestNode(x, y);
      for (let burst = 0; burst < 5; burst += 1) launch(nearest, 4);
      holding = true;
      window.clearTimeout(holdTimer);
      holdTimer = window.setTimeout(() => {
        if (!holding) return;
        well = true;
        host!.dataset.gravity = "on";
      }, HOLD_DELAY);
    }

    function handlePointerUp() {
      holding = false;
      window.clearTimeout(holdTimer);
      if (well) {
        delete host!.dataset.gravity;
        explode(performance.now());
      }
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    intersection.observe(host);
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    host.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
    document.addEventListener("visibilitychange", sync);
    const unsubscribe = subscribeMotion(sync);
    resize();
    sync();

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(holdTimer);
      resizeObserver.disconnect();
      intersection.disconnect();
      window.removeEventListener("pointermove", handlePointerMove);
      host.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
      document.removeEventListener("visibilitychange", sync);
      unsubscribe();
    };
  }, [labels]);

  return <canvas ref={canvasRef} className="agent-field" aria-hidden="true" />;
}

"use client";

import {
  type ForwardedRef,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

export interface SignatureCanvasHandle {
  clear: () => void;
  toDataUrl: () => string;
}

function SignatureCanvasInner(
  { onSignedChange }: { onSignedChange: (hasSigned: boolean) => void },
  ref: ForwardedRef<SignatureCanvasHandle>,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);

  const resetCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    const width = Math.max(rect.width, 1);
    const height = Math.max(rect.height, 1);

    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    context.setTransform(1, 0, 0, 1, 0, 0);
    context.scale(ratio, ratio);
    context.fillStyle = "#FFFFFF";
    context.fillRect(0, 0, width, height);
    context.strokeStyle = "#182033";
    context.lineWidth = 2.5;
    context.lineCap = "round";
    context.lineJoin = "round";
    onSignedChange(false);
  }, [onSignedChange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    resetCanvas();
    const target = canvas.parentElement ?? canvas;
    const observer = new ResizeObserver(() => resetCanvas());
    observer.observe(target);

    return () => observer.disconnect();
  }, [resetCanvas]);

  useImperativeHandle(ref, () => ({
    clear: resetCanvas,
    toDataUrl: () => canvasRef.current?.toDataURL("image/png") ?? "",
  }), [resetCanvas]);

  function getPoint(event: React.PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    const context = canvasRef.current?.getContext("2d");
    if (!context) {
      return;
    }

    const point = getPoint(event);
    isDrawingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    context.beginPath();
    context.moveTo(point.x, point.y);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawingRef.current) {
      return;
    }

    const context = canvasRef.current?.getContext("2d");
    if (!context) {
      return;
    }

    const point = getPoint(event);
    context.lineTo(point.x, point.y);
    context.stroke();
    onSignedChange(true);
  }

  function handlePointerUp(event: React.PointerEvent<HTMLCanvasElement>) {
    isDrawingRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  return (
    <canvas
      ref={canvasRef}
      className="block h-48 w-full touch-none bg-white"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    />
  );
}

const SignatureCanvas = forwardRef(SignatureCanvasInner);

SignatureCanvas.displayName = "SignatureCanvas";

export default SignatureCanvas;

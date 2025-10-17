
import { useState, useRef, useCallback, useEffect } from 'react';

interface UseDraggableOptions {
    initialPosition?: { x: number; y: number };
    onDragStart?: () => void;
    onDrag?: (position: { x: number; y: number }) => void;
    onDragEnd?: (position: { x: number; y: number }) => void;
    disabled?: boolean;
}

export default function useDraggable({
    initialPosition = { x: 0, y: 0 },
    onDragStart,
    onDrag,
    onDragEnd,
    disabled = false
}: UseDraggableOptions) {
    const [position, setPosition] = useState(initialPosition);
    const dragRef = useRef<HTMLElement | null>(null);
    const isDragging = useRef(false);
    const startPos = useRef({ x: 0, y: 0 });

    useEffect(() => {
        setPosition(initialPosition);
    }, [initialPosition]);

    const handleMouseDown = useCallback((e: MouseEvent) => {
        if (disabled) return;
        
        isDragging.current = true;
        startPos.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y,
        };
        onDragStart?.();
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, [position.x, position.y, onDragStart, disabled]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging.current || disabled) return;
        
        const newX = e.clientX - startPos.current.x;
        const newY = e.clientY - startPos.current.y;
        
        const newPosition = { x: newX, y: newY };
        setPosition(newPosition);
        onDrag?.(newPosition);
    }, [onDrag, disabled]);

    const handleMouseUp = useCallback(() => {
        if (!isDragging.current || disabled) return;

        isDragging.current = false;
        onDragEnd?.(position);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    }, [onDragEnd, position, disabled, handleMouseMove]);

    const refCallback = useCallback((node: HTMLElement | null) => {
        if (dragRef.current) {
            dragRef.current.removeEventListener('mousedown', handleMouseDown);
        }
        dragRef.current = node;
        if (dragRef.current) {
            dragRef.current.addEventListener('mousedown', handleMouseDown);
        }
    }, [handleMouseDown]);

    return { ref: refCallback, position };
}
   
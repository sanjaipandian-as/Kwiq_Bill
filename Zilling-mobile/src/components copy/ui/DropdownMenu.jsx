import React, { useState, useRef, useEffect, useContext, createContext, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';

const DropdownContext = createContext({
    isOpen: false,
    setIsOpen: () => { },
    close: () => { },
    triggerRef: { current: null },
    contentRef: { current: null }
});

export const DropdownMenu = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef(null);
    const contentRef = useRef(null);

    const close = () => setIsOpen(false);

    useEffect(() => {
        const handleClickOutside = (event) => {
            const isClickInTrigger = triggerRef.current && triggerRef.current.contains(event.target);
            const isClickInContent = contentRef.current && contentRef.current.contains(event.target);

            if (!isClickInTrigger && !isClickInContent) {
                setIsOpen(false);
            }
        };

        const handleScroll = (event) => {
            // Close on scroll to prevent detached UI, unless it's scrolling inside the menu
            if (contentRef.current && !contentRef.current.contains(event.target)) {
                close();
            }
        };

        const handleResize = () => close();

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('scroll', handleScroll, true);
            window.addEventListener('resize', handleResize);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', handleResize);
        };
    }, [isOpen]);

    return (
        <DropdownContext.Provider value={{ isOpen, setIsOpen, close, triggerRef, contentRef }}>
            {children}
        </DropdownContext.Provider>
    );
};

export const DropdownMenuTrigger = ({ children, asChild, className }) => {
    const { isOpen, setIsOpen, triggerRef } = useContext(DropdownContext);

    const handleClick = (e) => {
        if (children.props?.onClick) children.props.onClick(e);
        e.stopPropagation(); // Prevent bubbling issues
        setIsOpen(!isOpen);
    };

    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children, {
            ref: triggerRef,
            onClick: handleClick,
            className: cn(children.props.className, className),
            'aria-expanded': isOpen
        });
    }

    return (
        <button
            ref={triggerRef}
            onClick={() => setIsOpen(!isOpen)}
            className={cn("inline-flex justify-center rounded-md text-sm font-medium focus:outline-none", className)}
        >
            {children}
        </button>
    );
};

export const DropdownMenuContent = ({ children, align = 'end', className }) => {
    const { isOpen, triggerRef, contentRef } = useContext(DropdownContext);
    const [style, setStyle] = useState({});

    useLayoutEffect(() => {
        if (isOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();

            // Calculate adjustments
            const top = rect.bottom + 5; // 5px offset
            let left = rect.left;
            let transform = 'none';

            if (align === 'end') {
                left = rect.right;
                transform = 'translateX(-100%)';
            }

            // Boundary checks could go here (collision detection), 
            // but for now we trust simple positioning + body portal

            setStyle({
                position: 'fixed',
                top: `${top}px`,
                left: `${left}px`,
                transform,
                zIndex: 9999, // High z-index to be on top of everything
                minWidth: '8rem',
            });
        }
    }, [isOpen, align]);

    if (!isOpen) return null;

    return createPortal(
        <div
            ref={contentRef}
            style={style}
            className={cn(
                "rounded-md border border-slate-200 bg-white p-1 shadow-md animate-in fade-in-0 zoom-in-95",
                className
            )}
        >
            {children}
        </div>,
        document.body
    );
};

export const DropdownMenuItem = ({ children, onClick, className, disabled, inset }) => {
    const { close } = useContext(DropdownContext);

    const handleClick = (e) => {
        if (disabled) return;
        if (onClick) onClick(e);
        close();
    };

    return (
        <div
            onClick={handleClick}
            className={cn(
                "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-slate-100 focus:bg-slate-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 cursor-pointer",
                inset && "pl-8",
                className
            )}
        >
            {children}
        </div>
    );
};

export const DropdownMenuCheckboxItem = ({ children, checked, onCheckedChange, disabled, className }) => {
    const { close } = useContext(DropdownContext);

    const handleClick = (e) => {
        if (disabled) return;
        e.preventDefault();
        if (onCheckedChange) onCheckedChange(!checked);
    };

    return (
        <div
            onClick={handleClick}
            className={cn(
                "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors hover:bg-slate-100 focus:bg-slate-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 cursor-pointer",
                className
            )}
        >
            <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                {checked && <Check className="h-4 w-4" />}
            </span>
            {children}
        </div>
    );
};

export const DropdownMenuLabel = ({ children, inset, className }) => (
    <div className={cn("px-2 py-1.5 text-sm font-semibold", inset && "pl-8", className)}>
        {children}
    </div>
);

export const DropdownMenuSeparator = ({ className }) => (
    <div className={cn("-mx-1 my-1 h-px bg-slate-100", className)} />
);

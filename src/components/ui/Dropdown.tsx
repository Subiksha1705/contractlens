"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Check } from "lucide-react";

export interface DropdownItem {
  id: string;
  label: string;
  sublabel?: string;
  badge?: string;
  badgeColor?: "blue" | "green" | "amber" | "slate";
  icon?: React.ReactNode;
  href?: string;
  disabled?: boolean;
}

interface DropdownProps {
  label?: string;
  items: DropdownItem[];
  selectedId?: string;
  onSelect?: (item: DropdownItem) => void;
  /**
   * If provided, navigating to this URL pattern with {id} replaced by item.id
   */
  redirectPattern?: string;
  icon?: React.ReactNode;
  className?: string;
  align?: "left" | "right";
  buttonVariant?: "default" | "subtle" | "primary";
}

export function Dropdown({
  label,
  items,
  selectedId,
  onSelect,
  redirectPattern,
  icon,
  className = "",
  align = "left",
  buttonVariant = "default",
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const selectedItem = items.find((i) => i.id === selectedId);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleItemClick = (item: DropdownItem) => {
    if (item.disabled) return;
    setIsOpen(false);

    if (onSelect) {
      onSelect(item);
    }

    if (item.href) {
      router.push(item.href);
    } else if (redirectPattern) {
      const targetUrl = redirectPattern.replace("{id}", encodeURIComponent(item.id));
      router.push(targetUrl);
    }
  };

  const getButtonStyles = () => {
    switch (buttonVariant) {
      case "primary":
        return "bg-[#005CB9] text-white hover:bg-[#004890] shadow-xs";
      case "subtle":
        return "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200";
      default:
        return "bg-white text-slate-800 hover:bg-slate-50 border border-slate-200 shadow-xs";
    }
  };

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className={`inline-flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition focus:outline-hidden focus:ring-2 focus:ring-[#005CB9] ${getButtonStyles()}`}
      >
        <span className="flex items-center gap-1.5 truncate">
          {icon}
          {selectedItem ? selectedItem.label : label || "Select option"}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div
          className={`absolute mt-1.5 w-56 rounded-xl bg-white border border-slate-200 shadow-lg py-1.5 z-50 focus:outline-hidden text-xs animate-in fade-in-50 zoom-in-95 duration-100 ${
            align === "right" ? "right-0" : "left-0"
          }`}
          role="menu"
        >
          {items.map((item) => {
            const isSelected = item.id === selectedId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleItemClick(item)}
                disabled={item.disabled}
                className={`w-full text-left px-3.5 py-2 flex items-center justify-between gap-2 hover:bg-slate-50 transition ${
                  isSelected ? "bg-blue-50/60 font-bold text-[#005CB9]" : "text-slate-700"
                } ${item.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                role="menuitem"
              >
                <div className="flex items-center gap-2 truncate min-w-0">
                  {item.icon && <span className="shrink-0">{item.icon}</span>}
                  <div className="truncate">
                    <p className="truncate font-medium">{item.label}</p>
                    {item.sublabel && (
                      <p className="text-[10px] text-slate-400 truncate font-normal">
                        {item.sublabel}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {item.badge && (
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                        item.badgeColor === "green"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : item.badgeColor === "amber"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-blue-50 text-[#005CB9] border border-blue-200"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#005CB9]" />}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

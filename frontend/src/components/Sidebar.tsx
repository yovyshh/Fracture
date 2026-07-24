import { useRef, type RefObject } from "react";
import { HomeIcon } from "@/components/ui/home";
import { HistoryIcon } from "@/components/ui/history-icon";
import { SettingsIcon } from "@/components/ui/settings";
import { TerminalIcon } from "@/components/ui/terminal";
import { CoffeeIcon } from "@/components/ui/coffee";
import { ToolCaseIcon } from "@/components/ui/tool-case";
import { BlocksIcon } from "@/components/ui/blocks-icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type PageType = "main" | "history" | "settings" | "logs" | "downloads" | "about" | "donate";

interface SidebarProps {
    currentPage: PageType;
    onPageChange: (page: PageType) => void;
}

interface AnimatedIconHandle {
    startAnimation: () => void;
    stopAnimation: () => void;
}

export function Sidebar({ currentPage, onPageChange }: SidebarProps) {
    // Top Navigation
    const homeIconRef = useRef<AnimatedIconHandle>(null);
    const historyIconRef = useRef<AnimatedIconHandle>(null);
    const downloadsIconRef = useRef<AnimatedIconHandle>(null);
    const logsIconRef = useRef<AnimatedIconHandle>(null);

    // Bottom Navigation
    const donateIconRef = useRef<AnimatedIconHandle>(null);
    const aboutIconRef = useRef<AnimatedIconHandle>(null);
    const settingsIconRef = useRef<AnimatedIconHandle>(null);

    const getHandlers = (iconRef: RefObject<AnimatedIconHandle | null>) => ({
        onMouseEnter: () => iconRef.current?.startAnimation(),
        onMouseLeave: () => iconRef.current?.stopAnimation(),
        onFocus: () => iconRef.current?.startAnimation(),
        onBlur: () => iconRef.current?.stopAnimation(),
    });

    const topNav = [
        { id: "main", ref: homeIconRef, component: HomeIcon, label: "Home" },
        { id: "history", ref: historyIconRef, component: HistoryIcon, label: "History" },
        { id: "downloads", ref: downloadsIconRef, component: ToolCaseIcon, label: "Downloads" },
        { id: "logs", ref: logsIconRef, component: TerminalIcon, label: "Logs" },
    ] as const;

    const bottomNav = [
        { id: "donate", ref: donateIconRef, component: CoffeeIcon, label: "Donate" },
        { id: "about", ref: aboutIconRef, component: BlocksIcon, label: "About" },
        { id: "settings", ref: settingsIconRef, component: SettingsIcon, label: "Settings" },
    ] as const;

    return (
        <div className="fixed left-0 top-0 h-full w-[64px] bg-background border-r border-border flex flex-col items-center py-14 z-30">
            <div className="flex flex-col gap-4 flex-1 mt-4">
                {topNav.map((item) => {
                    const IconComp = item.component as any;
                    const isActive = currentPage === item.id;
                    return (
                        <Tooltip key={item.id} delayDuration={0}>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={() => onPageChange(item.id)}
                                    {...getHandlers(item.ref)}
                                    className={cn(
                                        "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-200 group relative",
                                        isActive ? "bg-primary text-white shadow-lg shadow-primary/25 scale-105" : "text-muted-foreground hover:bg-card hover:text-foreground hover:scale-105"
                                    )}
                                >
                                    {/* The SVG internal styling will inherit color from text-current implicitly via shadcn implementation, or we pass class */}
                                    <IconComp ref={item.ref} size={22} className={cn("transition-transform duration-200", !isActive && "group-hover:scale-110")} />
                                    {isActive && (
                                        <div className="absolute inset-0 rounded-2xl border border-white/20" />
                                    )}
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="font-mono text-xs ml-2">
                                {item.label}
                            </TooltipContent>
                        </Tooltip>
                    );
                })}
            </div>

            <div className="mt-auto flex flex-col gap-4 mb-4">
                {bottomNav.map((item) => {
                    const IconComp = item.component as any;
                    const isActive = currentPage === item.id;
                    return (
                        <Tooltip key={item.id} delayDuration={0}>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={() => onPageChange(item.id)}
                                    {...getHandlers(item.ref)}
                                    className={cn(
                                        "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-200 group relative",
                                        isActive ? "bg-primary text-white shadow-lg shadow-primary/25 scale-105" : "text-muted-foreground hover:bg-card hover:text-foreground hover:scale-105"
                                    )}
                                >
                                    <IconComp ref={item.ref} size={22} className={cn("transition-transform duration-200", !isActive && "group-hover:scale-110")} />
                                    {isActive && (
                                        <div className="absolute inset-0 rounded-2xl border border-white/20" />
                                    )}
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="font-mono text-xs ml-2">
                                {item.label}
                            </TooltipContent>
                        </Tooltip>
                    );
                })}
            </div>
        </div>
    );
}

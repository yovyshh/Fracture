import { X, Minus, Maximize } from "lucide-react";
import { WindowMinimise, WindowToggleMaximise, Quit } from "../../wailsjs/runtime/runtime";

export function TitleBar() {
    const handleMinimize = () => {
        WindowMinimise();
    };
    
    const handleMaximize = () => {
        WindowToggleMaximise();
    };
    
    const handleClose = () => {
        Quit();
    };

    return (
        <>
            {/* Draggable Area */}
            <div 
                className="fixed top-0 left-14 right-0 h-10 z-40 bg-background/80 backdrop-blur-sm" 
                style={{ "--wails-draggable": "drag" } as React.CSSProperties} 
                onDoubleClick={handleMaximize}
            />

            {/* Window Controls */}
            <div className="fixed top-1.5 right-2 z-50 flex h-7 gap-0.5 items-center" style={{ "--wails-draggable": "no-drag" } as React.CSSProperties}>
                <button 
                    onClick={handleMinimize} 
                    className="w-8 h-7 flex items-center justify-center hover:bg-muted transition-colors rounded" 
                    aria-label="Minimize"
                >
                    <Minus className="w-3.5 h-3.5"/>
                </button>
                <button 
                    onClick={handleMaximize} 
                    className="w-8 h-7 flex items-center justify-center hover:bg-muted transition-colors rounded" 
                    aria-label="Maximize"
                >
                    <Maximize className="w-3.5 h-3.5"/>
                </button>
                <button 
                    onClick={handleClose} 
                    className="w-8 h-7 flex items-center justify-center hover:bg-destructive hover:text-white transition-colors rounded" 
                    aria-label="Close"
                >
                    <X className="w-3.5 h-3.5"/>
                </button>
            </div>
        </>
    );
}

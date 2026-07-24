import { X, Minus, Maximize, Scissors } from "lucide-react";
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
            {/* Draggable Area — full width, including sidebar */}
            <div 
                className="fixed top-0 left-0 right-0 h-10 z-40 flex items-center bg-background/90 backdrop-blur-md border-b border-border"
                style={{ "--wails-draggable": "drag" } as React.CSSProperties} 
                onDoubleClick={handleMaximize}
            >
                {/* App Brand */}
                <div className="flex items-center gap-2 px-4 h-full select-none" style={{ "--wails-draggable": "no-drag" } as React.CSSProperties}>
                    <div className="w-6 h-6 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <Scissors className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-sm font-bold tracking-tight text-foreground/80">Fracture</span>
                </div>
            </div>

            {/* Window Controls */}
            <div className="fixed top-1.5 right-3 z-50 flex h-7 gap-1 items-center" style={{ "--wails-draggable": "no-drag" } as React.CSSProperties}>
                <button 
                    onClick={handleMinimize} 
                    className="w-8 h-7 flex items-center justify-center hover:bg-muted transition-colors rounded text-muted-foreground hover:text-foreground" 
                    aria-label="Minimize"
                >
                    <Minus className="w-3.5 h-3.5"/>
                </button>
                <button 
                    onClick={handleMaximize} 
                    className="w-8 h-7 flex items-center justify-center hover:bg-muted transition-colors rounded text-muted-foreground hover:text-foreground" 
                    aria-label="Maximize"
                >
                    <Maximize className="w-3.5 h-3.5"/>
                </button>
                <button 
                    onClick={handleClose} 
                    className="w-8 h-7 flex items-center justify-center hover:bg-destructive hover:text-white transition-colors rounded text-muted-foreground" 
                    aria-label="Close"
                >
                    <X className="w-3.5 h-3.5"/>
                </button>
            </div>
        </>
    );
}

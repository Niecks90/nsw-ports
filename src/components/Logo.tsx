interface LogoProps {
    onClick?: () => void;
}

export function Logo({ onClick }: LogoProps) {
    return (
        <div
            className="flex items-center gap-2 cursor-pointer select-none group"
            onClick={onClick}
        >
            <div className="relative w-8 h-8 flex items-center justify-center">
                <svg viewBox="0 0 32 32" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 4C9 4 6 7 6 12V20C6 25 9 28 14 28V4Z" fill="#00C3E3"/>
                    <path d="M18 4V28C23 28 26 25 26 20V12C26 7 23 4 18 4Z" fill="#FF4554"/>
                    <path d="M16 12L20 16L16 20M12 16H20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="translate-y-1 transform group-hover:translate-y-2 transition-transform duration-300"/>
                    <rect x="15" y="10" width="2" height="6" fill="white" className="group-hover:h-8 transition-all duration-300"/>
                </svg>
                {/* A simplified Joy-Con inspired mark with a download/stage arrow */}
                <div className="absolute inset-0 flex items-center justify-center mt-0.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                        <path d="M12 5v14M19 12l-7 7-7-7" />
                    </svg>
                </div>
            </div>
            <div className="flex items-baseline">
                <span className="font-black text-xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-rose-500 tracking-tight">
                    NSW
                </span>
                <span className="font-bold text-xl text-white ml-1 tracking-tight">
                    Ports
                </span>
            </div>
        </div>
    );
}

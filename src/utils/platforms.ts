export function getShortPlatformName(platform: string): string {
    const p = platform.trim();
    switch (p) {
        case "Microsoft Xbox": return "Xbox";
        case "Microsoft Xbox 360": return "Xbox 360";
        case "Nintendo GameCube": return "GameCube";
        case "Nintendo 3DS": return "Nintendo 3DS";    
        case "Nintendo 64": return "Nintendo64";
        case "Nintendo Gameboy": return "Gameboy";
        case "Nintendo Gameboy Advance": return "Gameboy Advance";
        case "Nintendo Gameboy Color": return "Gameboy Color";
        case "Super Nintendo Entertainment System": return "Super Nintendo";
        case "Nintendo Wii": return "Wii";
        case "Nintendo Wii U": return "Wii U";
        case "Sony Playstation": return "Playstation";
        case "Sony Playstation 2": return "Playstation 2";
        case "Sony Playstation 4": return "Playstation 4";
        case "Sony Playstation Portable": return "Playstation Portable";
        case "Sega Dreamcast": return "Dreamcast";
        case "Sega Genesis": return "Megadrive";
        case "Android 32bit": return "Android 32";
        case "Android 64bit": return "Android 64";
        case "Arcade": return "Arcade";
        case "NEC PC Engine (TurboGrafx-16)": return "PC-Engine";
        case "PC": return "PC";
        default: return p;
    }
}

export function getPlatformBadgeClasses(platform: string): string {
    const p = getShortPlatformName(platform);
    switch (p) {
        case "Xbox": return "bg-emerald-600 text-white";
        case "Xbox 360": return "bg-lime-600 text-white";
        case "GameCube": return "bg-purple-700 text-purple-100";
        case "Nintendo 3DS": return "bg-red-600 text-white";
        case "Nintendo64": return "bg-red-600 text-white";
        case "Super Nintendo": return "bg-violet-600 text-white";
        case "Gameboy": return "bg-slate-600 text-slate-100";
        case "Gameboy Advance": return "bg-indigo-600 text-white";
        case "Gameboy Color": return "bg-teal-600 text-white";
        case "Wii":
        case "Wii U": return "bg-sky-600 text-white";
        case "Playstation":
        case "Playstation 2":
        case "Playstation Portable":   
        case "Playstation 4": return "bg-blue-600 text-white";
        case "Dreamcast": return "bg-orange-600 text-white";
        case "Megadrive": return "bg-blue-900 text-blue-100";
        case "Android 32":
        case "Android 64": return "bg-green-600 text-white";
        case "Arcade": return "bg-amber-600 text-white";
        case "NEC PC Engine (TurboGrafx-16)":
        case "PC": return "bg-cyan-800 text-cyan-100";
        default: return "bg-slate-700 text-slate-200";
    }
}

export function Footer() {
    return (
        <footer className="mt-auto border-t border-slate-800 bg-slate-950/80 backdrop-blur text-slate-400 py-8 px-4 text-xs">
            <div className="max-w-7xl mx-auto flex flex-col items-center justify-center text-center space-y-4">
                <div className="space-y-2">
                    <p>
                        Catalog data is automatically synced from RobZilla10001's SwitchPorts repository. Special thanks to RobZilla and all community port maintainers for their incredible work.
                    </p>
                    <div className="flex items-center justify-center gap-4 flex-wrap">
                        <a href="https://github.com/robzilla10001/SwitchPorts" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline underline-offset-2">
                            SwitchPorts GitHub
                        </a>
                        <a href="https://gbatemp.net/threads/ultimate-switch-port-thread.683071/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline underline-offset-2">
                            GBAtemp Thread
                        </a>
                    </div>
                </div>

                <p className="max-w-3xl">
                    NSW Ports is a community hobby project and is not affiliated with, endorsed, sponsored, or approved by Nintendo Co., Ltd., Nintendo of America Inc., or any game publisher. Nintendo Switch is a registered trademark of Nintendo.
                </p>

                <p>
                    Made by <a href="https://github.com/Niecks90" target="_blank" rel="noopener noreferrer" className="font-semibold text-slate-200 hover:text-white underline underline-offset-2">Niecks90</a> with ❤️ and AI.
                </p>
            </div>
        </footer>
    );
}

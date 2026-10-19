/*
 * Telas de demonstração dos 5 apps do S7 ERP.
 * São fragmentos de interface (a própria tela de cada app, em HTML), renderizados
 * dentro do palco da página inicial. Não fazem parte do visual do site.
 */
let currentDemoKey = 'forca_vendas';
let demoTimeline = null;

const appScreenTemplates = {
    forca_vendas: {
        frame: 'frame-phone',
        html: `
            <div class="w-full h-full flex flex-col relative overflow-hidden bg-white">
                <div class="screen-anim bg-[#2a7a1c] px-3 pt-4 pb-0 relative z-10">
                    <div class="flex items-center justify-between mb-3">
                        <div class="flex items-center gap-2">
                            <button type="button" onclick="fvToggleMenu(event)" class="text-white"><i data-lucide="menu" class="w-4 h-4"></i></button>
                            <i data-lucide="smartphone" class="w-3.5 h-3.5 text-white"></i>
                            <h5 class="text-white font-bold text-xs">S7 Mobile</h5>
                        </div>
                        <i data-lucide="filter" class="w-3.5 h-3.5 text-white"></i>
                    </div>
                    <div class="flex gap-4 text-[10.5px] font-bold text-white">
                        <button type="button" onclick="fvSwitchTab('enviados')" id="fv-tab-enviados" class="pb-2 border-b-2 border-white">ENVIADOS</button>
                        <button type="button" onclick="fvSwitchTab('pendentes')" id="fv-tab-pendentes" class="pb-2 text-white/80 border-b-2 border-transparent">PENDENTES</button>
                    </div>
                </div>

                <div class="flex-1 overflow-y-auto bg-slate-50">
                    <div id="fv-list-enviados" class="flex flex-col">
                        <div class="screen-anim border-l-4 border-emerald-400 bg-white m-2 p-2.5 rounded-md shadow-sm">
                            <div class="text-[10.5px] font-bold text-slate-800">Mercado Bom Preço</div>
                            <div class="text-[9px] text-slate-500">Pedido 5521 • 12 itens</div>
                            <div class="text-[10.5px] font-extrabold text-[#2f8520] mt-0.5">R$ 2.340,00</div>
                        </div>
                        <div class="screen-anim border-l-4 border-emerald-400 bg-white m-2 p-2.5 rounded-md shadow-sm">
                            <div class="text-[10.5px] font-bold text-slate-800">Padaria Trigo Dourado</div>
                            <div class="text-[9px] text-slate-500">Pedido 5519 • 8 itens</div>
                            <div class="text-[10.5px] font-extrabold text-[#2f8520] mt-0.5">R$ 1.180,50</div>
                        </div>
                        <div class="screen-anim border-l-4 border-emerald-400 bg-white m-2 p-2.5 rounded-md shadow-sm">
                            <div class="text-[10.5px] font-bold text-slate-800">Supermercado Vitória</div>
                            <div class="text-[9px] text-slate-500">Pedido 5516 • 15 itens</div>
                            <div class="text-[10.5px] font-extrabold text-[#2f8520] mt-0.5">R$ 3.760,00</div>
                        </div>
                        <div class="screen-anim border-l-4 border-emerald-400 bg-white m-2 p-2.5 rounded-md shadow-sm">
                            <div class="text-[10.5px] font-bold text-slate-800">Distrib. Sabor & Cia</div>
                            <div class="text-[9px] text-slate-500">Pedido 5512 • 22 itens</div>
                            <div class="text-[10.5px] font-extrabold text-[#2f8520] mt-0.5">R$ 4.215,00</div>
                        </div>
                        <div class="screen-anim border-l-4 border-emerald-400 bg-white m-2 p-2.5 rounded-md shadow-sm">
                            <div class="text-[10.5px] font-bold text-slate-800">Conveniência VSM</div>
                            <div class="text-[9px] text-slate-500">Pedido 5510 • 6 itens</div>
                            <div class="text-[10.5px] font-extrabold text-[#2f8520] mt-0.5">R$ 868,40</div>
                        </div>
                    </div>
                    <div id="fv-list-pendentes" class="hidden flex-col">
                        <div class="border-l-4 border-amber-400 bg-white m-2 p-2.5 rounded-md shadow-sm">
                            <div class="text-[10.5px] font-bold text-slate-800">Distribuidora Central</div>
                            <div class="text-[9px] text-slate-500">Pedido 5524 • 6 itens</div>
                            <div class="text-[10.5px] font-extrabold text-amber-600 mt-0.5">R$ 940,00</div>
                        </div>
                        <div class="border-l-4 border-amber-400 bg-white m-2 p-2.5 rounded-md shadow-sm">
                            <div class="text-[10.5px] font-bold text-slate-800">Mercadinho da Praça</div>
                            <div class="text-[9px] text-slate-500">Pedido 5523 • 4 itens</div>
                            <div class="text-[10.5px] font-extrabold text-amber-600 mt-0.5">R$ 560,00</div>
                        </div>
                    </div>
                </div>

                <div id="fv-drawer" class="hidden absolute inset-0 z-20 bg-black/30" onclick="fvToggleMenu(event)">
                    <div class="w-[80%] h-full bg-white flex flex-col" onclick="event.stopPropagation()">
                        <div class="bg-[#2a7a1c] p-4 flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full bg-white/25 flex items-center justify-center text-white shrink-0"><i data-lucide="user" class="w-5 h-5"></i></div>
                            <div>
                                <div class="text-white font-bold text-[10.5px] leading-tight">Roberto Almeida Santos</div>
                                <div class="text-white/80 text-[9px] leading-tight">Distribuidora Sabor & Cia</div>
                            </div>
                        </div>
                        <div class="flex flex-col text-[10.5px] font-semibold text-slate-700">
                            <div class="flex items-center gap-3 px-4 py-3 border-b border-slate-100"><i data-lucide="user" class="w-3.5 h-3.5 text-[#3ea62b]"></i> Clientes</div>
                            <div class="flex items-center gap-3 px-4 py-3 border-b border-slate-100"><i data-lucide="users" class="w-3.5 h-3.5 text-[#3ea62b]"></i> Pré-Cadastro</div>
                            <div class="flex items-center gap-3 px-4 py-3 border-b border-slate-100"><i data-lucide="dollar-sign" class="w-3.5 h-3.5 text-[#3ea62b]"></i> Clientes/Preços</div>
                            <div class="flex items-center gap-3 px-4 py-3 border-b border-slate-100"><i data-lucide="bar-chart" class="w-3.5 h-3.5 text-[#3ea62b]"></i> Relatórios</div>
                            <div class="flex items-center gap-3 px-4 py-3 border-b border-slate-100"><i data-lucide="globe" class="w-3.5 h-3.5 text-[#3ea62b]"></i> Comunicação</div>
                            <div class="flex items-center gap-3 px-4 py-3"><i data-lucide="settings" class="w-3.5 h-3.5 text-[#3ea62b]"></i> Configurações</div>
                        </div>
                    </div>
                </div>
            </div>`
    },
    gestor_entregas: {
        frame: 'frame-phone',
        html: `
            <div class="w-full h-full flex flex-col bg-slate-100">
                <div class="screen-anim bg-[#2a7a1c] px-4 pt-4 pb-0">
                    <h5 class="text-white font-bold text-sm mb-3">Gestor de Entrega</h5>
                    <div class="flex gap-5 text-[11px] font-bold text-white">
                        <button type="button" onclick="geSwitchTab('resumo')" id="ge-tab-resumo" class="pb-2 border-b-2 border-white">RESUMO</button>
                        <button type="button" onclick="geSwitchTab('entregas')" id="ge-tab-entregas" class="pb-2 text-white/80 border-b-2 border-transparent">ENTREGAS</button>
                    </div>
                </div>

                <div id="ge-view-resumo" class="flex-1 p-3.5 flex flex-col gap-3">
                    <div class="screen-anim flex flex-col gap-1.5">
                        <span class="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Informação do Carregamento</span>
                        <div class="bg-white rounded-lg p-3 flex flex-col gap-2 border border-slate-200">
                            <div class="flex items-center gap-2 text-[10.5px] text-slate-700 font-semibold">
                                <i data-lucide="building" class="w-3.5 h-3.5 text-slate-400 shrink-0"></i> Padaria Estrela Dourada Ltda
                            </div>
                            <div class="flex items-center gap-2 text-[10.5px] text-slate-700 font-semibold">
                                <i data-lucide="list" class="w-3.5 h-3.5 text-slate-400 shrink-0"></i> Num. Carga: 1147
                            </div>
                            <div class="flex items-center gap-2 text-[10.5px] text-slate-700 font-semibold">
                                <i data-lucide="truck" class="w-3.5 h-3.5 text-slate-400 shrink-0"></i> 7788901 - FIORINO 02
                            </div>
                        </div>
                    </div>
                    <div class="screen-anim flex flex-col gap-1.5 flex-1">
                        <span class="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Acompanhamento</span>
                        <div class="bg-white rounded-lg border border-slate-200 flex-1 flex items-center justify-center">
                            <div class="relative w-24 h-24">
                                <svg viewBox="0 0 100 100" class="w-full h-full -rotate-90">
                                    <circle cx="50" cy="50" r="42" fill="none" stroke="#e2e8f0" stroke-width="9"/>
                                    <circle id="progress-ring" cx="50" cy="50" r="42" fill="none" stroke="#ea580c" stroke-width="9" stroke-linecap="round" stroke-dasharray="264" stroke-dashoffset="264"/>
                                </svg>
                                <div class="absolute inset-0 flex flex-col items-center justify-center text-center px-2">
                                    <span class="text-[10px] font-bold text-slate-700 leading-tight">2 Pedidos<br>entregues</span>
                                    <span class="text-[8.5px] text-slate-400 mt-0.5">de 3 pedidos</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div id="ge-view-entregas" class="hidden flex-1 overflow-y-auto p-2.5 flex flex-col gap-2">
                    <div class="border-l-4 border-emerald-400 bg-white p-2.5 rounded-md shadow-sm">
                        <div class="text-[10.5px] font-bold text-slate-800">Mercado Vitória Ltda</div>
                        <div class="text-[9px] text-slate-500">Bairro Novo Mundo</div>
                        <div class="flex items-center justify-between mt-1">
                            <span class="text-[8.5px] text-slate-500">Nota 40451 • Pedido 5545</span>
                            <span class="text-[10px] font-extrabold text-[#2f8520]">R$ 1.102,00</span>
                        </div>
                    </div>
                    <div class="border-l-4 border-emerald-400 bg-white p-2.5 rounded-md shadow-sm">
                        <div class="text-[10.5px] font-bold text-slate-800">Salão Armond's</div>
                        <div class="text-[9px] text-slate-500">Centro</div>
                        <div class="flex items-center justify-between mt-1">
                            <span class="text-[8.5px] text-slate-500">Nota 40450 • Pedido 5544</span>
                            <span class="text-[10px] font-extrabold text-[#2f8520]">R$ 973,08</span>
                        </div>
                    </div>
                    <div class="border-l-4 border-amber-400 bg-white p-2.5 rounded-md shadow-sm">
                        <div class="text-[10.5px] font-bold text-slate-800">Colégio Batista</div>
                        <div class="text-[9px] text-slate-500">Jardim Marileusa</div>
                        <div class="flex items-center justify-between mt-1">
                            <span class="text-[8.5px] text-slate-500">Nota 40452 • Pedido 5546</span>
                            <span class="text-[10px] font-extrabold text-amber-600">R$ 870,00</span>
                        </div>
                    </div>
                </div>
            </div>`
    },
    portal_b2b: {
        frame: 'frame-phone',
        html: `
            <div class="w-full h-full flex flex-col relative overflow-hidden bg-slate-50">
                <div class="screen-anim bg-white px-3 pt-3 pb-2 border-b border-slate-200 flex items-center gap-2">
                    <div class="flex-1 bg-slate-100 rounded-full px-3 py-1.5 flex items-center gap-2">
                        <i data-lucide="search" class="w-3.5 h-3.5 text-slate-400"></i>
                        <span class="text-[10px] text-slate-400">Procurar produto</span>
                    </div>
                    <i data-lucide="shopping-cart" class="w-4 h-4 text-slate-600"></i>
                </div>

                <div id="pb-view-catalogo" class="flex-1 overflow-y-auto p-2.5 flex flex-col gap-2.5">
                    <div class="screen-anim flex gap-1.5 overflow-x-auto pb-0.5">
                        <span class="shrink-0 px-2.5 py-1.5 rounded-full bg-red-50 text-red-500 text-[9px] font-bold">Pão Francês</span>
                        <span class="shrink-0 px-2.5 py-1.5 rounded-full bg-slate-100 text-slate-600 text-[9px] font-bold">Baguete</span>
                        <span class="shrink-0 px-2.5 py-1.5 rounded-full bg-slate-100 text-slate-600 text-[9px] font-bold">Brioche</span>
                        <span class="shrink-0 px-2.5 py-1.5 rounded-full bg-slate-100 text-slate-600 text-[9px] font-bold">Hambúrguer</span>
                    </div>
                    <div class="screen-anim bg-red-500 text-white text-[10px] font-bold text-center py-2 rounded-md">MAIS COMPRADOS</div>
                    <div class="screen-anim grid grid-cols-2 gap-2">
                        <div class="bg-white rounded-lg p-2 border border-slate-200">
                            <div class="w-full h-11 rounded bg-amber-100 mb-1.5"></div>
                            <div class="text-[8.5px] text-slate-700 font-semibold leading-tight">Hot Dog Tradicional cx 32un</div>
                            <div class="text-[10px] font-extrabold text-red-500 mt-1">R$ 51,20</div>
                        </div>
                        <div class="bg-white rounded-lg p-2 border border-slate-200">
                            <div class="w-full h-11 rounded bg-orange-100 mb-1.5"></div>
                            <div class="text-[8.5px] text-slate-700 font-semibold leading-tight">Pão Brioche 90g cx 48un</div>
                            <div class="text-[10px] font-extrabold text-red-500 mt-1">R$ 114,24</div>
                        </div>
                        <div class="bg-white rounded-lg p-2 border border-slate-200">
                            <div class="w-full h-11 rounded bg-yellow-100 mb-1.5"></div>
                            <div class="text-[8.5px] text-slate-700 font-semibold leading-tight">Pão Australiano cx 40un</div>
                            <div class="text-[10px] font-extrabold text-red-500 mt-1">R$ 120,00</div>
                        </div>
                        <div class="bg-white rounded-lg p-2 border border-slate-200">
                            <div class="w-full h-11 rounded bg-amber-100 mb-1.5"></div>
                            <div class="text-[8.5px] text-slate-700 font-semibold leading-tight">Baguete Congelada cx 24un</div>
                            <div class="text-[10px] font-extrabold text-red-500 mt-1">R$ 48,00</div>
                        </div>
                    </div>
                </div>

                <div id="pb-view-historico" class="hidden flex-1 overflow-y-auto p-2.5 flex flex-col gap-2">
                    <div class="border-l-4 border-amber-400 bg-white p-2.5 rounded-md shadow-sm flex items-center justify-between">
                        <div>
                            <div class="text-[10px] font-bold text-slate-800">Pedido 85210</div>
                            <div class="text-[8.5px] text-slate-500">15/09/2026</div>
                        </div>
                        <div class="text-right">
                            <div class="text-[10px] font-extrabold text-slate-800">R$ 420,00</div>
                            <div class="text-[8.5px] text-amber-600 font-bold">Pendente</div>
                        </div>
                    </div>
                    <div class="border-l-4 border-sky-400 bg-white p-2.5 rounded-md shadow-sm flex items-center justify-between">
                        <div>
                            <div class="text-[10px] font-bold text-slate-800">Pedido 84850</div>
                            <div class="text-[8.5px] text-slate-500">08/09/2026</div>
                        </div>
                        <div class="text-right">
                            <div class="text-[10px] font-extrabold text-slate-800">R$ 680,50</div>
                            <div class="text-[8.5px] text-sky-600 font-bold">Em entrega</div>
                        </div>
                    </div>
                    <div class="border-l-4 border-emerald-400 bg-white p-2.5 rounded-md shadow-sm flex items-center justify-between">
                        <div>
                            <div class="text-[10px] font-bold text-slate-800">Pedido 84102</div>
                            <div class="text-[8.5px] text-slate-500">28/08/2026</div>
                        </div>
                        <div class="text-right">
                            <div class="text-[10px] font-extrabold text-slate-800">R$ 1.150,00</div>
                            <div class="text-[8.5px] text-emerald-600 font-bold">Entregue</div>
                        </div>
                    </div>
                </div>

                <div class="screen-anim bg-red-500 flex items-center justify-around py-2.5">
                    <button type="button" onclick="pbSwitchView('catalogo')" id="pb-nav-catalogo" class="text-white"><i data-lucide="store" class="w-4 h-4"></i></button>
                    <button type="button" onclick="pbSwitchView('historico')" id="pb-nav-historico" class="text-white/80"><i data-lucide="receipt" class="w-4 h-4"></i></button>
                    <i data-lucide="message-circle" class="w-4 h-4 text-white/80"></i>
                </div>
            </div>`
    },
    wms: {
        frame: 'frame-phone',
        html: `
            <div class="w-full h-full flex flex-col">
                <div class="screen-anim bg-[#d97706] px-4 py-4">
                    <h5 class="text-[#0f172a] font-bold text-sm">CONFERÊNCIA WMS</h5>
                </div>
                <div class="flex-1 p-4 flex flex-col gap-4 items-center justify-center">
                    <div class="screen-anim relative w-28 h-28 rounded-lg bg-slate-800 overflow-hidden">
                        <div id="scan-line" class="absolute left-0 right-0 h-0.5 bg-[#3ea62b]" style="top:0;"></div>
                    </div>
                    <div class="screen-anim w-full bg-[#2a7a1c] rounded-xl p-3 flex items-center gap-2 justify-center">
                        <i data-lucide="check" class="w-4 h-4 text-white"></i>
                        <span class="text-white font-bold text-xs">PALLET VALIDADO (FEFO)</span>
                    </div>
                </div>
            </div>`
    },
    bi: {
        frame: 'frame-monitor',
        html: `
            <div class="w-full h-full flex bg-[#eef1f6] relative overflow-hidden text-slate-700">
                <div class="screen-anim w-8 sm:w-9 h-full bg-[#0f172a] flex flex-col items-center py-2.5 gap-1.5 shrink-0">
                    <div class="w-6 h-6 rounded-md bg-white/15 flex items-center justify-center text-white font-black text-[8px] mb-1.5">SN</div>
                    <button type="button" onclick="biSwitchView('home')" id="bi-nav-home" class="bi-nav-btn w-6 h-6 rounded-lg flex items-center justify-center bg-white/20 text-white transition"><i data-lucide="home" class="w-3.5 h-3.5"></i></button>
                    <button type="button" onclick="biSwitchView('geral')" id="bi-nav-geral" class="bi-nav-btn w-6 h-6 rounded-lg flex items-center justify-center text-white/80 transition"><i data-lucide="bar-chart" class="w-3.5 h-3.5"></i></button>
                    <button type="button" onclick="biSwitchView('supervisor')" id="bi-nav-supervisor" class="bi-nav-btn w-6 h-6 rounded-lg flex items-center justify-center text-white/80 transition"><i data-lucide="users" class="w-3.5 h-3.5"></i></button>
                    <button type="button" onclick="biSwitchView('cliente')" id="bi-nav-cliente" class="bi-nav-btn w-6 h-6 rounded-lg flex items-center justify-center text-white/80 transition"><i data-lucide="user" class="w-3.5 h-3.5"></i></button>
                    <button type="button" onclick="biSwitchView('produto')" id="bi-nav-produto" class="bi-nav-btn w-6 h-6 rounded-lg flex items-center justify-center text-white/80 transition"><i data-lucide="package" class="w-3.5 h-3.5"></i></button>
                    <button type="button" onclick="biSwitchView('geral')" class="mt-auto w-6 h-6 rounded-lg flex items-center justify-center text-white/80 transition"><i data-lucide="refresh-cw" class="w-3 h-3"></i></button>
                </div>

                <div class="flex-1 h-full relative overflow-hidden">

                    <div id="bi-view-home" class="absolute inset-0">
                        <div class="h-full flex flex-col items-center justify-center gap-2.5 text-center px-4 bg-[#0f172a]">
                            <span class="text-white/90 font-extrabold text-[9px] tracking-widest uppercase">Dashboard Comercial</span>
                            <div class="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center">
                                <i data-lucide="bar-chart" class="w-5 h-5 text-white"></i>
                            </div>
                            <button type="button" onclick="biSwitchView('geral')" class="px-4 py-1.5 rounded-full bg-white text-[#0891b2] text-[8.5px] font-extrabold shadow">INICIAR</button>
                        </div>
                    </div>

                    <div id="bi-view-geral" class="hidden absolute inset-0">
                        <div class="h-full flex flex-col p-2 gap-1.5">
                            <div class="flex items-center justify-between shrink-0">
                                <span class="text-[7.5px] font-extrabold text-slate-500 tracking-wide">DASHBOARD COMERCIAL</span>
                                <div class="flex gap-1">
                                    <span class="text-[6px] bg-white border border-slate-300 rounded px-1.5 py-0.5 text-slate-500 font-semibold">Todos</span>
                                    <span class="text-[6px] bg-white border border-slate-300 rounded px-1.5 py-0.5 text-slate-500 font-semibold">2026</span>
                                </div>
                            </div>
                            <div class="grid grid-cols-3 gap-1.5 flex-1 min-h-0">
                                <div class="bg-white rounded-lg border border-slate-200 p-1.5 flex flex-col gap-1 overflow-hidden">
                                    <span class="text-[6px] font-extrabold text-slate-400">FAT. POR DEPARTAMENTO</span>
                                    <span class="text-[7px] font-extrabold text-slate-700">Líquido: R$ 4,82 Mi</span>
                                    <span class="text-[6px] text-slate-500">Linha Padaria · R$ 4,51 Mi</span>
                                    <span class="text-[6px] text-slate-500">Linha Varejo · R$ 298 Mil</span>
                                </div>
                                <div class="bg-white rounded-lg border border-slate-200 p-1.5 flex flex-col items-center justify-center gap-1 overflow-hidden">
                                    <span class="text-[6px] font-extrabold text-slate-400 self-start">FAT. X DEVOLUÇÕES</span>
                                    <svg viewBox="0 0 36 36" class="w-9 h-9 shrink-0 -rotate-90"><circle cx="18" cy="18" r="15.9" fill="none" stroke="#f59e0b" stroke-width="6"/><circle cx="18" cy="18" r="15.9" fill="none" stroke="#0891b2" stroke-width="6" stroke-dasharray="96 100"/></svg>
                                    <span class="text-[6px] text-slate-500">96% faturamento líquido</span>
                                </div>
                                <div class="bg-white rounded-lg border border-slate-200 p-1.5 flex flex-col gap-1 overflow-hidden justify-center">
                                    <span class="text-[6px] font-extrabold text-slate-400">POR VENDEDOR</span>
                                    <div class="flex items-center gap-1"><div class="h-1.5 rounded bg-[#3ea62b]" style="width:85%"></div><span class="text-[5.5px] text-slate-500 shrink-0">890 Mil</span></div>
                                    <div class="flex items-center gap-1"><div class="h-1.5 rounded bg-[#3ea62b]/70" style="width:58%"></div><span class="text-[5.5px] text-slate-500 shrink-0">612 Mil</span></div>
                                    <div class="flex items-center gap-1"><div class="h-1.5 rounded bg-[#3ea62b]/50" style="width:40%"></div><span class="text-[5.5px] text-slate-500 shrink-0">459 Mil</span></div>
                                </div>
                            </div>
                            <div class="bg-white rounded-lg border border-slate-200 p-1.5 flex items-end gap-1.5 h-14 shrink-0">
                                <div class="flex-1 flex flex-col items-center gap-0.5"><div class="w-full rounded-t bg-[#0891b2]" style="height:60%"></div><span class="text-[5.5px] text-slate-400">ago</span></div>
                                <div class="flex-1 flex flex-col items-center gap-0.5"><div class="w-full rounded-t bg-[#0891b2]" style="height:68%"></div><span class="text-[5.5px] text-slate-400">set</span></div>
                                <div class="flex-1 flex flex-col items-center gap-0.5"><div class="w-full rounded-t bg-[#0891b2]" style="height:55%"></div><span class="text-[5.5px] text-slate-400">out</span></div>
                                <div class="flex-1 flex flex-col items-center gap-0.5"><div class="w-full rounded-t bg-[#0891b2]" style="height:72%"></div><span class="text-[5.5px] text-slate-400">nov</span></div>
                                <div class="flex-1 flex flex-col items-center gap-0.5"><div class="w-full rounded-t bg-[#3ea62b]" style="height:88%"></div><span class="text-[5.5px] text-slate-400">dez</span></div>
                            </div>
                        </div>
                    </div>

                    <div id="bi-view-supervisor" class="hidden absolute inset-0">
                        <div class="h-full flex flex-col p-2 gap-1.5">
                            <span class="text-[7.5px] font-extrabold text-slate-500 tracking-wide shrink-0">DETALHAMENTO POR SUPERVISOR</span>
                            <div class="bg-white rounded-lg border border-slate-200 overflow-hidden shrink-0">
                                <div class="grid grid-cols-4 bg-[#0f172a] text-white text-[5.5px] font-extrabold px-1.5 py-1">
                                    <span>SUPERVISOR</span><span>FAT. BRUTO</span><span>FAT. LÍQ.</span><span>CRESC.</span>
                                </div>
                                <div class="grid grid-cols-4 px-1.5 py-1 text-[6px] text-slate-600 border-t border-slate-100">
                                    <span class="truncate">R. Almeida</span><span>R$ 139 Mil</span><span>R$ 139 Mil</span><span class="text-emerald-600 font-bold">▲ 9,1%</span>
                                </div>
                                <div class="grid grid-cols-4 px-1.5 py-1 text-[6px] text-slate-600 border-t border-slate-100">
                                    <span class="truncate">F. Lima</span><span>R$ 310 Mil</span><span>R$ 309 Mil</span><span class="text-red-500 font-bold">▼ 8,8%</span>
                                </div>
                                <div class="grid grid-cols-4 px-1.5 py-1 text-[6px] text-slate-600 border-t border-slate-100">
                                    <span class="truncate">P. Henrique</span><span>R$ 21 Mil</span><span>R$ 21 Mil</span><span class="text-emerald-600 font-bold">▲ 22,3%</span>
                                </div>
                            </div>
                            <div class="grid grid-cols-3 gap-1.5 flex-1 min-h-0">
                                <div class="bg-white rounded-lg border border-slate-200 p-1.5 flex flex-col gap-1 overflow-hidden">
                                    <span class="text-[6px] font-extrabold text-slate-400">TOP VENDEDOR</span>
                                    <span class="text-[6px] text-slate-500">R. Almeida · R$ 139 Mil</span>
                                    <span class="text-[6px] text-slate-500">F. Lima · R$ 118 Mil</span>
                                    <span class="text-[6px] text-slate-500">Venda Direta · R$ 72 Mil</span>
                                </div>
                                <div class="bg-white rounded-lg border border-slate-200 p-1.5 flex flex-col items-center justify-center gap-1">
                                    <span class="text-[6px] font-extrabold text-slate-400 self-start">DEVOL. POR VENDEDOR</span>
                                    <span class="text-[6px] text-slate-400 text-center">Sem devoluções no período</span>
                                </div>
                                <div class="bg-white rounded-lg border border-slate-200 p-1.5 flex flex-col gap-1 overflow-hidden">
                                    <span class="text-[6px] font-extrabold text-slate-400">POR CIDADE</span>
                                    <span class="text-[6px] text-slate-500">Goiânia - GO · R$ 905 Mil</span>
                                    <span class="text-[6px] text-slate-500">Aparecida - GO · R$ 209 Mil</span>
                                    <span class="text-[6px] text-slate-500">Anápolis - GO · R$ 88 Mil</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div id="bi-view-cliente" class="hidden absolute inset-0">
                        <div class="h-full flex flex-col p-2 gap-1.5">
                            <div class="flex items-center justify-between shrink-0">
                                <span class="text-[7.5px] font-extrabold text-slate-500 tracking-wide">DETALHAMENTO POR CLIENTE</span>
                                <span class="text-[6px] bg-white border border-slate-300 rounded px-1.5 py-0.5 text-slate-500 font-semibold">Todos</span>
                            </div>
                            <div class="grid grid-cols-3 gap-1.5 flex-1 min-h-0">
                                <div class="bg-white rounded-lg border border-slate-200 p-1.5 flex flex-col gap-1 overflow-hidden">
                                    <span class="text-[6px] font-extrabold text-slate-400">TOP FATURAMENTO</span>
                                    <span class="text-[6px] text-slate-500 truncate">Mercado Bom Preço · R$ 367 Mil</span>
                                    <span class="text-[6px] text-slate-500 truncate">Padaria Trigo Dourado · R$ 237 Mil</span>
                                    <span class="text-[6px] text-slate-500 truncate">Distrib. Sabor & Cia · R$ 179 Mil</span>
                                </div>
                                <div class="bg-white rounded-lg border border-slate-200 p-1.5 flex flex-col gap-1 overflow-hidden">
                                    <span class="text-[6px] font-extrabold text-slate-400">TICKET MÉDIO</span>
                                    <span class="text-[6px] text-slate-500 truncate">Mercado Bom Preço · R$ 11,5 Mil</span>
                                    <span class="text-[6px] text-slate-500 truncate">Supermercado Vitória · R$ 8,1 Mil</span>
                                    <span class="text-[6px] text-slate-500 truncate">Mercadinho da Praça · R$ 4,8 Mil</span>
                                </div>
                                <div class="bg-white rounded-lg border border-slate-200 p-1.5 flex flex-col gap-1 overflow-hidden">
                                    <span class="text-[6px] font-extrabold text-slate-400">POR REGIÃO</span>
                                    <span class="text-[6px] text-slate-500">Região Central · R$ 928 Mil</span>
                                    <span class="text-[6px] text-slate-500">Região Norte · R$ 163 Mil</span>
                                    <span class="text-[6px] text-slate-500">Região Sul · R$ 147 Mil</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div id="bi-view-produto" class="hidden absolute inset-0">
                        <div class="h-full flex flex-col p-2 gap-1.5">
                            <span class="text-[7.5px] font-extrabold text-slate-500 tracking-wide shrink-0">DETALHAMENTO POR PRODUTO</span>
                            <div class="grid grid-cols-2 gap-1.5 flex-1 min-h-0">
                                <div class="bg-white rounded-lg border border-slate-200 overflow-hidden flex flex-col">
                                    <div class="bg-[#0f172a] text-white text-[5.5px] font-extrabold px-1.5 py-1 grid grid-cols-3">
                                        <span>NOTA</span><span>QTD.</span><span>VALOR</span>
                                    </div>
                                    <div class="grid grid-cols-3 px-1.5 py-1 text-[6px] text-slate-600 border-t border-slate-100"><span>0018</span><span>1</span><span>R$ 88,00</span></div>
                                    <div class="grid grid-cols-3 px-1.5 py-1 text-[6px] text-slate-600 border-t border-slate-100"><span>0019</span><span>10</span><span>R$ 750,00</span></div>
                                    <div class="grid grid-cols-3 px-1.5 py-1 text-[6px] text-slate-600 border-t border-slate-100"><span>0020</span><span>7</span><span>R$ 630,00</span></div>
                                </div>
                                <div class="bg-white rounded-lg border border-slate-200 overflow-hidden flex flex-col">
                                    <div class="bg-[#0f172a] text-white text-[5.5px] font-extrabold px-1.5 py-1">MIX CLIENTES</div>
                                    <div class="px-1.5 py-1 text-[6px] text-slate-600 border-t border-slate-100 truncate">2917 · Posto Zonta</div>
                                    <div class="px-1.5 py-1 text-[6px] text-slate-600 border-t border-slate-100 truncate">2981 · Conveniência Vulcânia</div>
                                    <div class="px-1.5 py-1 text-[6px] text-slate-600 border-t border-slate-100 truncate">2301 · Conveniência VSM</div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>`
    }
};

function biSwitchView(view) {
    ['home', 'geral', 'supervisor', 'cliente', 'produto'].forEach(v => {
        const el = document.getElementById('bi-view-' + v);
        if (el) el.classList.toggle('hidden', v !== view);
        const nav = document.getElementById('bi-nav-' + v);
        if (!nav) return;
        nav.classList.toggle('bg-white/20', v === view);
        nav.classList.toggle('text-white', v === view);
        nav.classList.toggle('text-white/80', v !== view);
    });
}

function fvSwitchTab(tab) {
    const tabEnviados = document.getElementById('fv-tab-enviados');
    const tabPendentes = document.getElementById('fv-tab-pendentes');
    if (!tabEnviados || !tabPendentes) return;
    tabEnviados.classList.toggle('border-white', tab === 'enviados');
    tabEnviados.classList.toggle('border-transparent', tab !== 'enviados');
    tabEnviados.classList.toggle('text-white/80', tab !== 'enviados');
    tabPendentes.classList.toggle('border-white', tab === 'pendentes');
    tabPendentes.classList.toggle('border-transparent', tab !== 'pendentes');
    tabPendentes.classList.toggle('text-white/80', tab !== 'pendentes');
    document.getElementById('fv-list-enviados').classList.toggle('hidden', tab !== 'enviados');
    document.getElementById('fv-list-pendentes').classList.toggle('hidden', tab !== 'pendentes');
}

function fvToggleMenu(event) {
    if (event) event.stopPropagation();
    const drawer = document.getElementById('fv-drawer');
    if (drawer) drawer.classList.toggle('hidden');
}

// Navegação dentro do mockup do Portal B2B: troca entre catálogo e histórico
function pbSwitchView(view) {
    const navCatalogo = document.getElementById('pb-nav-catalogo');
    const navHistorico = document.getElementById('pb-nav-historico');
    if (!navCatalogo || !navHistorico) return;
    navCatalogo.classList.toggle('text-white', view === 'catalogo');
    navCatalogo.classList.toggle('text-white/80', view !== 'catalogo');
    navHistorico.classList.toggle('text-white', view === 'historico');
    navHistorico.classList.toggle('text-white/80', view !== 'historico');
    document.getElementById('pb-view-catalogo').classList.toggle('hidden', view !== 'catalogo');
    document.getElementById('pb-view-historico').classList.toggle('hidden', view !== 'historico');
}

// Navegação dentro do mockup do Gestor de Entregas: troca entre resumo e lista de entregas
function geSwitchTab(tab) {
    const tabResumo = document.getElementById('ge-tab-resumo');
    const tabEntregas = document.getElementById('ge-tab-entregas');
    if (!tabResumo || !tabEntregas) return;
    tabResumo.classList.toggle('border-white', tab === 'resumo');
    tabResumo.classList.toggle('border-transparent', tab !== 'resumo');
    tabResumo.classList.toggle('text-white/80', tab !== 'resumo');
    tabEntregas.classList.toggle('border-white', tab === 'entregas');
    tabEntregas.classList.toggle('border-transparent', tab !== 'entregas');
    tabEntregas.classList.toggle('text-white/80', tab !== 'entregas');
    document.getElementById('ge-view-resumo').classList.toggle('hidden', tab !== 'resumo');
    document.getElementById('ge-view-entregas').classList.toggle('hidden', tab !== 'entregas');
}

const demoFrames = ['frame-phone', 'frame-tablet', 'frame-monitor'];

function showAppDemo(serviceKey, btnElement) {
    currentDemoKey = serviceKey;

    document.querySelectorAll('.app-row').forEach((row) => {
        const on = row.dataset.app === serviceKey;
        row.classList.toggle('is-active', on);
        row.setAttribute('aria-pressed', on ? 'true' : 'false');
    });

    const stage = document.getElementById('dive-container');
    if (btnElement && window.innerWidth < 1024) {
        stage.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    const frame = document.getElementById('device-frame');
    frame.classList.remove(...demoFrames);
    frame.classList.add(appScreenTemplates[serviceKey].frame);

    if (demoTimeline) demoTimeline.kill();
    const screen = document.getElementById('app-screen');
    screen.innerHTML = appScreenTemplates[serviceKey].html;
    lucide.createIcons();

    const phase = document.getElementById('dive-phase');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ring = screen.querySelector('#progress-ring');

    if (reduce) {
        phase.textContent = 'Tela pronta';
        if (ring) ring.setAttribute('stroke-dashoffset', '88');
        return;
    }

    phase.textContent = 'Abrindo a tela';
    const items = screen.querySelectorAll('.screen-anim');
    gsap.set(items, { opacity: 0, y: 14 });

    demoTimeline = gsap.timeline({ onComplete: () => { phase.textContent = 'Tela pronta'; } });
    demoTimeline.to(items, { opacity: 1, y: 0, duration: 0.45, stagger: 0.2, ease: 'power3.out' });

    if (serviceKey === 'gestor_entregas' && ring) {
        demoTimeline.to(ring, { strokeDashoffset: 88, duration: 0.9, ease: 'power2.out' }, '-=0.3');
    }
    if (serviceKey === 'wms') {
        const scan = screen.querySelector('#scan-line');
        if (scan) demoTimeline.fromTo(scan, { top: '2%' }, { top: '90%', duration: 0.6, ease: 'power1.inOut', repeat: 1, yoyo: true }, '-=0.4');
    }
}

function replayAppDemo() {
    showAppDemo(currentDemoKey, null);
}

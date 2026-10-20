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
        html: `<div class="fv" id="fv"></div>`
    },
    sn_orbit: {
        frame: 'frame-phone',
        html: `<div class="orb" id="orb"></div>`
    },
    portal_b2b: {
        frame: 'frame-phone',
        html: `<div class="b2b" id="b2b"></div>`
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
        html: `<div class="bi-escala"><div class="bi" id="bi"></div></div>`
    }
};

// Em telas baixas o palco fica menor que o celular (560px): reduz o aparelho
// proporcionalmente para que a tela inteira, com os botões de baixo, sempre apareça.
const PHONE_SIZE = { w: 288, h: 560 };
function fitDeviceFrame() {
    const frame = document.getElementById('device-frame');
    if (!frame) return;
    const body = frame.parentElement;
    const cs = getComputedStyle(body);
    // No celular a página rola normalmente; só no desktop (palco fixo) a altura limita o aparelho
    const altura = window.matchMedia('(min-width: 1024px)').matches
        ? body.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - 8
        : Infinity;
    const largura = body.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const painel = frame.querySelector('.bi');
    if (frame.classList.contains('frame-monitor') && painel) {
        // O painel do BI é desenhado em tamanho fixo e reduzido para caber no palco;
        // abaixo de 60% ele mantém esse tamanho e o monitor rola na horizontal.
        frame.style.transform = '';
        const s = Math.max(0.6, Math.min(1, largura / BI_W, altura / BI_H));
        painel.style.transform = `scale(${s.toFixed(3)})`;
        frame.style.width = Math.min(largura, BI_W * s) + 'px';
        frame.style.height = (BI_H * s) + 'px';
        frame.querySelector('.bi-escala').style.width = (BI_W * s) + 'px';
        frame.querySelector('.bi-escala').style.height = (BI_H * s) + 'px';
        return;
    }
    frame.style.width = '';
    frame.style.height = '';
    if (!frame.classList.contains('frame-phone')) { frame.style.transform = ''; return; }
    const escala = Math.min(1, altura / PHONE_SIZE.h, largura / PHONE_SIZE.w);
    frame.style.transformOrigin = 'top center';
    frame.style.transform = escala < 1 ? `scale(${escala.toFixed(3)})` : '';
}
window.addEventListener('resize', fitDeviceFrame);

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
    fitDeviceFrame();

    if (demoTimeline) demoTimeline.kill();
    const screen = document.getElementById('app-screen');
    screen.innerHTML = appScreenTemplates[serviceKey].html;
    if (serviceKey === 'forca_vendas') fvStart();
    if (serviceKey === 'sn_orbit') orbitStart();
    if (serviceKey === 'portal_b2b') b2bStart();
    if (serviceKey === 'bi') biStart();
    fitDeviceFrame();
    lucide.createIcons();

    const phase = document.getElementById('dive-phase');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduce) {
        phase.textContent = 'Tela pronta';
        return;
    }

    phase.textContent = 'Abrindo a tela';
    const items = screen.querySelectorAll('.screen-anim');
    gsap.set(items, { opacity: 0, y: 14 });

    demoTimeline = gsap.timeline({ onComplete: () => { phase.textContent = 'Tela pronta'; } });
    demoTimeline.to(items, { opacity: 1, y: 0, duration: 0.45, stagger: 0.2, ease: 'power3.out' });

    if (serviceKey === 'wms') {
        const scan = screen.querySelector('#scan-line');
        if (scan) demoTimeline.fromTo(scan, { top: '2%' }, { top: '90%', duration: 0.6, ease: 'power1.inOut', repeat: 1, yoyo: true }, '-=0.4');
    }
}

function replayAppDemo() {
    showAppDemo(currentDemoKey, null);
}

/*
 * Força de Vendas (S7 Mobile): simulação do fluxo real de pré-venda.
 * Telas, campos e menus seguem o app; vendedor, empresa, clientes, produtos e valores são fictícios.
 * Fluxo: cliente -> novo pedido (pedido / produto / itens) -> salvar (pendente) -> comunicação (enviado).
 */
const FV_VENDEDOR = { nome: 'MARCOS', empresa: 'DISTRIBUIDORA AURORA LTDA' };
const FV_CLIENTES = [
    { cod: 3105, razao: 'MERCADO BOM PRECO LTDA', fantasia: 'MERCADO BOM PREÇO', bloqueado: true },
    { cod: 3112, razao: 'PADARIA TRIGO DOURADO ME', fantasia: 'TRIGO DOURADO' },
    { cod: 3118, razao: 'SUPERMERCADO VITORIA LTDA', fantasia: 'SUPER VITÓRIA', marcado: true },
    { cod: 3121, razao: 'CONVENIENCIA VSM EIRELI', fantasia: 'CONVENIÊNCIA VSM' },
    { cod: 3127, razao: 'EMPORIO SABOR E CIA LTDA', fantasia: 'EMPÓRIO SABOR & CIA' },
    { cod: 3134, razao: 'LANCHONETE PONTO CERTO ME', fantasia: 'PONTO CERTO' },
    { cod: 3140, razao: 'MERCADINHO DA PRACA LTDA', fantasia: 'MERCADINHO DA PRAÇA' }
];
// preco 0 = sem preço na tabela do cliente (não pode ser inserido)
const FV_PRODUTOS = [
    { cod: 101, nome: 'BAGUETE TRADICIONAL CX 50 UN', un: 'CX', est: 42, peso: 5.0, preco: 54.00, cx: 4 },
    { cod: 119, nome: 'BOLO DE CENOURA 400G', un: 'UN', est: 25, peso: 0.4, preco: 14.90, cx: 6 },
    { cod: 123, nome: 'BOLO DE CHOCOLATE 400G', un: 'UN', est: -6, peso: 0.4, preco: 15.90, cx: 6 },
    { cod: 127, nome: 'FERMENTO BIOLOGICO 500G', un: 'PCT', est: 210, peso: 0.5, preco: 0, cx: 1 },
    { cod: 104, nome: 'PAO DE ALHO TRADICIONAL 300G', un: 'UN', est: 180, peso: 0.3, preco: 9.90, cx: 12 },
    { cod: 108, nome: 'PAO DE ALHO APIMENTADO 300G', un: 'UN', est: 96, peso: 0.3, preco: 10.50, cx: 12 },
    { cod: 112, nome: 'PAO DE FORMA INTEGRAL 500G', un: 'UN', est: 64, peso: 0.5, preco: 8.40, cx: 10 },
    { cod: 115, nome: 'PAO DE HAMBURGUER CX 24 UN', un: 'CX', est: 30, peso: 1.6, preco: 31.20, cx: 1 },
    { cod: 131, nome: 'SACO KRAFT P/ PAO 1KG', un: 'PCT', est: 520, peso: 0.2, preco: 0, cx: 1 }
];
const FV_OPCOES = {
    empresa: ['1 - DISTRIBUIDORA AURORA LTDA', '2 - AURORA FILIAL SUL'],
    natureza: ['VENDA DE MERCADORIA D1', 'BONIFICACAO', 'TROCA'],
    pgto: ['A VISTA', '7 DIAS', '14 DIAS', '28 DIAS'],
    cobranca: ['DINHEIRO', 'BOLETO', 'PIX'],
    modelo: ['D1', 'NF-E'],
    frete: ['CIF', 'FOB']
};
const FV_MOTIVOS = ['Estabelecimento fechado', 'Comprador ausente', 'Estoque abastecido', 'Sem limite de crédito'];

let fv = null;

// Pedidos fictícios já feitos (antes = minutos atrás), só para a tela inicial não começar vazia
const FV_PEDIDOS_INICIAIS = [
    { cliente: 3140, pgto: '7 DIAS', cob: 'BOLETO', itens: 3, total: 418.60, antes: 18, enviado: false },
    { cliente: 3121, pgto: 'A VISTA', cob: 'PIX', itens: 2, total: 196.80, antes: 55, enviado: false },
    { cliente: 3118, pgto: '28 DIAS', cob: 'BOLETO', itens: 6, total: 1284.30, antes: 99, enviado: true },
    { cliente: 3112, pgto: 'A VISTA', cob: 'DINHEIRO', itens: 4, total: 352.40, antes: 143, enviado: true },
    { cliente: 3127, pgto: '14 DIAS', cob: 'BOLETO', itens: 5, total: 879.50, antes: 186, enviado: true },
    { cliente: 3134, pgto: 'A VISTA', cob: 'PIX', itens: 2, total: 148.20, antes: 224, enviado: true }
];

function fvStart() {
    const pedidos = FV_PEDIDOS_INICIAIS.map(p => ({ cliente: p.cliente, emp: '1', pgto: p.pgto, cob: p.cob, modelo: 'D1',
        itens: p.itens, total: p.total, emissao: fvEmissao(fvAgora(p.antes)), enviado: p.enviado }));
    fv = { tela: 'home', aba: 'enviados', drawer: false, menuCli: null, sheet: null, buscaCli: null, busca: null,
        cliente: null, pedAba: 'pedido', form: null, itens: [], item: null, pedidos, enviando: false, aviso: null, passo: 'menu' };
    fvRender(true);
}

function fvMoeda(v) {
    return 'R$ ' + v.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// Campos numéricos do app aparecem como "54.0"
function fvN(v) {
    const r = Math.round(v * 100) / 100;
    return Number.isInteger(r) ? r.toFixed(1) : String(r);
}

function fvEsc(t) {
    return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

function fvAgora(minutosAtras) {
    const d = new Date(Date.now() - (minutosAtras || 0) * 60000), z = n => String(n).padStart(2, '0');
    return { data: `${z(d.getDate())}/${z(d.getMonth() + 1)}/${d.getFullYear()}`, hora: `${z(d.getHours())}:${z(d.getMinutes())}:${z(d.getSeconds())}` };
}

function fvEmissao(t) {
    return t.data + ' ' + t.hora;
}

function fvAvisar(texto) {
    fv.aviso = texto;
    clearTimeout(fvAvisar.t);
    fvAvisar.t = setTimeout(() => { if (fv) { fv.aviso = null; fvRender(); } }, 1700);
}

// Cálculo do item: o desconto pode ser digitado em % ou em R$, um atualiza o outro
function fvCalcItem() {
    const e = fv.item, p = FV_PRODUTOS.find(x => x.cod === e.cod);
    const qtd = Math.max(0, parseInt(e.qtd, 10) || 0);
    let pct, rs;
    if (e.base === 'rs') { rs = Math.min(p.preco, parseFloat(e.rs) || 0); pct = p.preco ? rs / p.preco * 100 : 0; }
    else { pct = Math.min(100, parseFloat(e.pct) || 0); rs = p.preco * pct / 100; }
    const unit = p.preco - rs;
    return { p, qtd, pct, rs, unit, total: unit * qtd };
}

function fvTotalPedido(itens) {
    return itens.reduce((s, i) => s + i.total, 0);
}

function fvAcao(acao, arg) {
    fv.menuCli = acao === 'menuCliente' ? arg : null;
    fv.aviso = null;
    switch (acao) {
        case 'drawer': fv.drawer = !fv.drawer; if (fv.drawer && fv.passo === 'menu') fv.passo = 'clientes'; break;
        case 'aba': fv.aba = arg; break;
        case 'menuItem':
            fv.drawer = false;
            if (arg === 'Clientes') { fv.tela = 'clientes'; fv.buscaCli = null; if (fv.passo === 'clientes') fv.passo = 'cliente'; }
            else if (arg === 'Comunicação') fv.tela = 'comunicacao';
            else fvAvisar(arg + ': tela não incluída na demonstração');
            break;
        case 'home': fv.tela = 'home'; break;
        case 'menuCliente': if (fv.passo === 'cliente') fv.passo = 'novo'; break;
        case 'buscaCli': fv.buscaCli = fv.buscaCli === null ? '' : null; break;
        case 'detalhes': fv.sheet = { tipo: 'detalhes', cod: arg }; break;
        case 'rota': fvAvisar('Abrindo a rota até o cliente no mapa…'); break;
        case 'motivo': fv.sheet = { tipo: 'motivo', cod: arg }; break;
        case 'registrarMotivo': fv.sheet = null; fvAvisar('Motivo registrado: ' + arg); break;
        case 'inadimplencia': fv.sheet = { tipo: 'inadimplencia', cod: arg }; break;
        case 'fecharSheet': fv.sheet = null; break;
        case 'novoPedido': {
            const hoje = fvAgora().data;
            fv.cliente = arg; fv.tela = 'pedido'; fv.pedAba = 'pedido'; fv.itens = []; fv.busca = null;
            fv.form = { empresa: FV_OPCOES.empresa[0], natureza: FV_OPCOES.natureza[0], pgto: FV_OPCOES.pgto[0], cobranca: FV_OPCOES.cobranca[0],
                modelo: FV_OPCOES.modelo[0], frete: FV_OPCOES.frete[0], entrega: hoje, compra: '', obs: '' };
            fv.passo = 'produto';
            break;
        }
        case 'pedAba':
            fv.pedAba = arg;
            if (arg === 'produto' && fv.passo === 'produto') fv.passo = 'escolher';
            if (arg === 'itens' && fv.passo === 'itens') fv.passo = 'salvar';
            break;
        case 'buscaProd': fv.busca = fv.busca === null ? '' : null; break;
        case 'produto': {
            const p = FV_PRODUTOS.find(x => x.cod === arg);
            if (!p.preco) { fvAvisar('Produto sem preço na tabela do cliente'); break; }
            const ja = fv.itens.find(i => i.cod === arg);
            fv.item = ja ? { cod: arg, qtd: String(ja.qtd), pct: fvN(ja.pct), rs: fvN(ja.rs), base: 'pct', campo: 'qtd', novo: true }
                : { cod: arg, qtd: '1', pct: '0', rs: '0', base: 'pct', campo: 'qtd', novo: true };
            fv.tela = 'item';
            if (fv.passo === 'escolher') fv.passo = 'gravarItem';
            break;
        }
        case 'campo': fv.item.campo = arg; fv.item.novo = true; break;
        case 'tecla': fvTecla(arg); break;
        case 'seta': {
            const e = fv.item, c = fvCalcItem();
            if (arg[0] === 'qtd') e.qtd = String(Math.max(1, c.qtd + arg[1]));
            if (arg[0] === 'pct') { e.base = 'pct'; e.pct = fvN(Math.min(100, Math.max(0, Math.round(c.pct) + arg[1]))); e.rs = fvN(c.p.preco * parseFloat(e.pct) / 100); }
            if (arg[0] === 'rs') { e.base = 'rs'; e.rs = fvN(Math.min(c.p.preco, Math.max(0, Math.round(c.rs) + arg[1]))); e.pct = fvN(c.p.preco ? parseFloat(e.rs) / c.p.preco * 100 : 0); }
            e.campo = arg[0]; e.novo = true;
            break;
        }
        case 'gravarItem': {
            const c = fvCalcItem();
            if (c.qtd < 1) { fvAvisar('Informe a quantidade'); break; }
            const linha = { cod: c.p.cod, nome: c.p.nome, un: c.p.un, qtd: c.qtd, preco: c.p.preco, pct: c.pct, rs: c.rs, unit: c.unit, total: c.total };
            const i = fv.itens.findIndex(x => x.cod === c.p.cod);
            if (i >= 0) fv.itens[i] = linha; else fv.itens.push(linha);
            fv.tela = 'pedido'; fv.pedAba = 'produto';
            if (fv.passo === 'gravarItem') fv.passo = 'itens';
            fvAvisar('Item inserido no pedido');
            break;
        }
        case 'voltarItem': fv.tela = 'pedido'; break;
        case 'removerItem': fv.itens = fv.itens.filter(i => i.cod !== arg); break;
        case 'salvarPedido': {
            if (!fv.itens.length) { fvAvisar('Insira ao menos um item no pedido'); break; }
            const agora = fvAgora();
            fv.pedidos.unshift({ cliente: fv.cliente, emp: fv.form.empresa.split(' - ')[0], pgto: fv.form.pgto, cob: fv.form.cobranca,
                modelo: fv.form.modelo, itens: fv.itens.length, total: fvTotalPedido(fv.itens), emissao: fvEmissao(agora), enviado: false });
            fv.tela = 'home'; fv.aba = 'pendentes'; fv.itens = [];
            fv.passo = 'comunicar';
            fvAvisar('Pedido salvo em Pendentes');
            break;
        }
        case 'voltarPedido': fv.tela = 'clientes'; break;
        case 'enviar': {
            if (fv.enviando || !fv.pedidos.some(p => !p.enviado)) break;
            fv.enviando = true;
            setTimeout(() => {
                if (!fv) return;
                fv.pedidos.forEach(p => { p.enviado = true; });
                fv.enviando = false; fv.tela = 'home'; fv.aba = 'enviados'; fv.passo = 'fim';
                fvAvisar('Pedidos enviados ao ERP');
                fvRender();
            }, 1300);
            break;
        }
    }
    fvRender();
}

function fvTecla(k) {
    const e = fv.item;
    let v = e.novo ? '' : String(e[e.campo]);
    e.novo = false;
    if (k === 'prox') { e.campo = { qtd: 'pct', pct: 'rs', rs: 'qtd' }[e.campo]; e.novo = true; return; }
    if (k === 'apaga') v = v.slice(0, -1);
    else if (v.length < 6) v = (v === '0' ? '' : v) + k;
    e[e.campo] = v;
    if (e.campo !== 'qtd') {
        e.base = e.campo;
        const c = fvCalcItem();
        if (e.campo === 'pct') e.rs = fvN(c.rs); else e.pct = fvN(c.pct);
    }
}

function fvBuscar(alvo, valor) {
    fv[alvo] = valor;
    fvRender();
    const input = document.querySelector('#fv .fv-busca input');
    if (input) { input.focus(); input.setSelectionRange(valor.length, valor.length); }
}

function fvCampoForm(nome, valor) {
    fv.form[nome] = valor;
}

function fvNext(passo) {
    return fv.passo === passo ? ' fv-next' : '';
}

function fvBarra(titulo, icone, esquerda, direita) {
    return `<div class="fv-bar">${esquerda}<span class="fv-bar__tit"><i data-lucide="${icone}"></i>${titulo}</span><span class="fv-bar__acts">${direita || ''}</span></div>`;
}

function fvBotao(acao, icone, rotulo, extra) {
    return `<button type="button" class="fv-ic${extra || ''}" onclick="fvAcao(${acao})" aria-label="${rotulo}"><i data-lucide="${icone}"></i></button>`;
}

function fvCartao(p) {
    const c = FV_CLIENTES.find(x => x.cod === p.cliente);
    return `<div class="fv-ped">
        <b>${c.cod} - ${fvEsc(c.razao)}</b>
        <small>${fvEsc(c.fantasia)}</small>
        <span><em>Emp:</em> ${p.emp} &nbsp;<em>Pgto:</em> ${p.pgto} &nbsp;<em>Cob.:</em> ${p.cob}</span>
        <span><em>Itens:</em> ${p.itens} &nbsp;<em>Vl. Total:</em> ${fvMoeda(p.total)}</span>
        <span><em>Modelo:</em> ${p.modelo} &nbsp;<em>Emissão:</em> ${p.emissao}</span>
        <div class="fv-ped__tags"><i class="fv-chip">Pré-venda</i><i class="fv-chip fv-chip--amarelo">Pendente</i></div>
    </div>`;
}

function fvHome() {
    const lista = fv.pedidos.filter(p => p.enviado === (fv.aba === 'enviados'));
    const vazio = `<div class="fv-vazio"><i data-lucide="shopping-cart"></i>Nenhum Pedido encontrado</div>`;
    return `<div class="fv-topo">
            ${fvBarra('S7 Mobile', 'smartphone', fvBotao("'drawer'", 'menu', 'Menu', fvNext('menu') + fvNext('comunicar')), fv.aba === 'enviados' ? `<span class="fv-ic" aria-hidden="true"><i data-lucide="list-filter"></i></span>` : '')}
            <div class="fv-abas">
                <button type="button" class="${fv.aba === 'enviados' ? 'is-on' : ''}" onclick="fvAcao('aba','enviados')">ENVIADOS</button>
                <button type="button" class="${fv.aba === 'pendentes' ? 'is-on' : ''}" onclick="fvAcao('aba','pendentes')">PENDENTES</button>
            </div>
        </div>
        <div class="fv-scroll">${lista.length ? lista.map(fvCartao).join('') : vazio}</div>`;
}

function fvDrawer() {
    const itens = [['user', 'Clientes'], ['users', 'Pré-Cadastro'], ['dollar-sign', 'Clientes/Preços'], ['file-chart-column', 'Relatórios'], ['globe', 'Comunicação'], ['settings', 'Configurações']];
    const pend = fv.pedidos.filter(p => !p.enviado).length;
    return `<div class="fv-overlay" onclick="if(event.target===this)fvAcao('drawer')"><div class="fv-drawer">
        <div class="fv-drawer__head"><span><i data-lucide="user-round"></i></span><div><b>${FV_VENDEDOR.nome}</b><b>${FV_VENDEDOR.empresa}</b></div></div>
        ${itens.map(([ic, nome]) => {
            const destaque = (nome === 'Clientes' && fv.passo === 'clientes') || (nome === 'Comunicação' && fv.passo === 'comunicar');
            return `<button type="button" class="fv-drawer__item${destaque ? ' fv-next' : ''}" onclick="fvAcao('menuItem','${nome}')"><i data-lucide="${ic}"></i>${nome}${nome === 'Comunicação' && pend ? `<em>${pend}</em>` : ''}</button>`;
        }).join('')}
    </div></div>`;
}

function fvClientes() {
    const termo = (fv.buscaCli || '').trim().toLowerCase();
    const lista = FV_CLIENTES.filter(c => !termo || (c.cod + ' ' + c.razao + ' ' + c.fantasia).toLowerCase().includes(termo));
    const menu = c => `<div class="fv-pop">
        <button type="button" class="${fv.passo === 'novo' ? 'fv-next' : ''}" onclick="fvAcao('novoPedido',${c.cod})"><i data-lucide="shopping-cart"></i>Novo Pedido</button>
        <button type="button" onclick="fvAcao('detalhes',${c.cod})"><i data-lucide="user-round-search"></i>Detalhes do Cliente</button>
        <button type="button" onclick="fvAcao('rota',${c.cod})"><i data-lucide="map-pin"></i>Rota</button>
        <button type="button" onclick="fvAcao('motivo',${c.cod})"><i data-lucide="circle-help"></i>Motivo Não Atendimento</button>
        <button type="button" onclick="fvAcao('inadimplencia',${c.cod})"><i data-lucide="contact-round"></i>Inadimplência</button>
    </div>`;
    const linhas = lista.map((c, i) => `<div class="fv-cli${fv.menuCli === c.cod ? ' is-open' : ''}">
        <button type="button" class="fv-cli__abre${i === 0 && fv.passo === 'cliente' ? ' fv-next' : ''}" onclick="fvAcao('menuCliente',${c.cod})">
            <span class="fv-av${c.bloqueado ? ' is-bloq' : ''}">C</span>
            <span class="fv-cli__txt"><b${c.bloqueado ? ' class="is-bloq"' : ''}>${c.cod} - ${fvEsc(c.razao)}</b><small>${fvEsc(c.fantasia)}</small>
            <span class="fv-cli__ics">${c.bloqueado ? '<i class="fv-chip fv-chip--verm">Bloqueado</i>' : ''}<i data-lucide="mail-x"></i>${c.marcado ? '<i data-lucide="flag"></i>' : ''}</span></span>
        </button>
        ${fv.menuCli === c.cod ? menu(c) : ''}
    </div>`).join('');
    const busca = fv.buscaCli !== null ? `<label class="fv-busca"><i data-lucide="search"></i><input type="search" placeholder="Código, razão ou fantasia" value="${fvEsc(fv.buscaCli)}" oninput="fvBuscar('buscaCli', this.value)" aria-label="Procurar cliente"></label>` : '';
    return `<div class="fv-topo">${fvBarra('Clientes', 'user', fvBotao("'home'", 'arrow-left', 'Voltar'), fvBotao("'buscaCli'", 'search', 'Procurar cliente') + '<span class="fv-ic" aria-hidden="true"><i data-lucide="list-filter"></i></span>')}</div>
        ${busca}
        <div class="fv-scroll fv-lista">${fv.menuCli !== null ? `<div class="fv-fecha" onclick="fvAcao('fecharMenu')"></div>` : ''}${linhas || '<p class="fv-vazio fv-vazio--txt">Nenhum cliente encontrado.</p>'}</div>`;
}

function fvSelect(nome, rotulo) {
    const atual = fv.form[nome];
    return `<label class="fv-campo"><span>${rotulo}</span><select onchange="fvCampoForm('${nome}', this.value)">${FV_OPCOES[nome].map(o => `<option${o === atual ? ' selected' : ''}>${o}</option>`).join('')}</select></label>`;
}

function fvAbaPedido() {
    const c = FV_CLIENTES.find(x => x.cod === fv.cliente);
    return `<div class="fv-scroll fv-form">
        <label class="fv-campo"><span>Cliente</span><input type="text" value="${c.cod} - ${fvEsc(c.razao)}" readonly></label>
        ${fvSelect('empresa', 'Empresa')}
        ${fvSelect('natureza', 'Natureza Operação')}
        ${fvSelect('pgto', 'Plano de Pagamento')}
        ${fvSelect('cobranca', 'Cobrança')}
        ${fvSelect('modelo', 'Modelo da Nota')}
        ${fvSelect('frete', 'Tipo de Frete')}
        <label class="fv-campo"><span>Data previsão da entrega</span><input type="text" value="${fv.form.entrega}" readonly></label>
        <label class="fv-campo"><span>Nº Pedido Compra</span><input type="text" inputmode="numeric" value="${fvEsc(fv.form.compra)}" oninput="fvCampoForm('compra', this.value)"></label>
        <label class="fv-campo"><span>Obs. Nota Fiscal</span><input type="text" value="${fvEsc(fv.form.obs)}" oninput="fvCampoForm('obs', this.value)"></label>
    </div>`;
}

function fvAbaProduto() {
    const termo = (fv.busca || '').trim().toLowerCase();
    const lista = FV_PRODUTOS.filter(p => !termo || (p.cod + ' ' + p.nome).toLowerCase().includes(termo));
    const busca = fv.busca !== null ? `<label class="fv-busca"><i data-lucide="search"></i><input type="search" placeholder="Código ou descrição" value="${fvEsc(fv.busca)}" oninput="fvBuscar('busca', this.value)" aria-label="Procurar produto"></label>` : '';
    const cards = lista.map((p, i) => {
        const no = fv.itens.find(x => x.cod === p.cod);
        return `<button type="button" class="fv-prod${i === 0 && fv.passo === 'escolher' ? ' fv-next' : ''}${no ? ' is-no' : ''}" onclick="fvAcao('produto',${p.cod})">
            <b>${p.cod} - ${p.nome}</b>
            <span>Est.: ${fvN(p.est)} &nbsp;UN: ${p.un} &nbsp;Peso: ${fvN(p.peso)} KG</span>
            <span>Valor: ${fvMoeda(p.preco)}</span>
            <span class="fv-prod__ics${p.preco ? ' is-ok' : ''}"><i class="fv-cifrao">$</i><i data-lucide="${p.preco ? 'shopping-cart' : 'ban'}"></i>${no ? `<em>${no.qtd} ${p.un} no pedido</em>` : ''}</span>
        </button>`;
    }).join('');
    return `${busca}<div class="fv-scroll fv-prods">${cards || '<p class="fv-vazio fv-vazio--txt">Nenhum produto encontrado.</p>'}</div>`;
}

function fvAbaItens() {
    if (!fv.itens.length) return `<div class="fv-scroll"><div class="fv-vazio"><i data-lucide="shopping-cart"></i>Nenhum item no pedido</div></div>`;
    const linhas = fv.itens.map(i => `<div class="fv-it">
        <div><b>${i.cod} - ${i.nome}</b>
        <span>${i.qtd} ${i.un} x ${fvMoeda(i.unit)}${i.pct ? ` &nbsp;(desc. ${fvN(i.pct)}%)` : ''}</span>
        <strong>${fvMoeda(i.total)}</strong></div>
        <button type="button" class="fv-ic fv-ic--escuro" onclick="fvAcao('removerItem',${i.cod})" aria-label="Remover item"><i data-lucide="trash-2"></i></button>
    </div>`).join('');
    return `<div class="fv-scroll">${linhas}</div>
        <div class="fv-total"><span>Itens: ${fv.itens.length}</span><b>Total: ${fvMoeda(fvTotalPedido(fv.itens))}</b></div>`;
}

function fvPedido() {
    const salvar = fvBotao("'salvarPedido'", 'save', 'Salvar pedido', fvNext('salvar'));
    const acoes = fv.pedAba === 'produto'
        ? fvBotao("'buscaProd'", 'search', 'Procurar produto') + '<span class="fv-ic" aria-hidden="true"><i data-lucide="list-filter"></i></span>'
        : salvar + '<span class="fv-ic" aria-hidden="true"><i data-lucide="ellipsis-vertical"></i></span>';
    const aba = (id, nome) => `<button type="button" class="${fv.pedAba === id ? 'is-on' : ''}${(id === 'produto' && fv.passo === 'produto') || (id === 'itens' && fv.passo === 'itens') ? ' fv-next' : ''}" onclick="fvAcao('pedAba','${id}')">${nome}${id === 'itens' && fv.itens.length ? ` (${fv.itens.length})` : ''}</button>`;
    const corpo = { pedido: fvAbaPedido, produto: fvAbaProduto, itens: fvAbaItens }[fv.pedAba]();
    return `<div class="fv-topo">
            ${fvBarra('Realizar Pedido', 'shopping-cart', fvBotao("'voltarPedido'", 'arrow-left', 'Voltar'), acoes)}
            <div class="fv-abas fv-abas--3">${aba('pedido', 'PEDIDO')}${aba('produto', 'PRODUTO')}${aba('itens', 'ITENS')}</div>
        </div>${corpo}`;
}

function fvItem() {
    const e = fv.item, c = fvCalcItem(), p = c.p;
    const ed = (campo, valor) => `<button type="button" class="fv-num${e.campo === campo ? ' is-on' : ''}" onclick="fvAcao('campo','${campo}')">${valor || '&nbsp;'}</button>`;
    const setas = campo => `<span class="fv-setas"><button type="button" onclick="fvAcao('seta',['${campo}',1])" aria-label="Aumentar"><i data-lucide="circle-arrow-up"></i></button><button type="button" onclick="fvAcao('seta',['${campo}',-1])" aria-label="Diminuir"><i data-lucide="circle-arrow-down"></i></button></span>`;
    const ro = (rotulo, valor) => `<div class="fv-ro"><span>${rotulo}</span><div>${valor}</div></div>`;
    const teclas = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'apaga', '0', 'prox'].map(k =>
        `<button type="button" onclick="fvAcao('tecla','${k}')"${k === 'apaga' ? ' aria-label="Apagar"' : ''}>${k === 'apaga' ? '<i data-lucide="delete"></i>' : k === 'prox' ? '<em>Próx.</em>' : k}</button>`).join('');
    return `<div class="fv-topo">${fvBarra('Inserir Item', 'shopping-cart', fvBotao("'voltarItem'", 'arrow-left', 'Voltar'),
            fvBotao("'gravarItem'", 'save', 'Gravar item', fvNext('gravarItem')) + '<span class="fv-ic" aria-hidden="true"><i data-lucide="info"></i></span>')}</div>
        <div class="fv-scroll fv-itemform">
            <div class="fv-itcard"><b>${p.cod} - ${p.nome}</b><span>${fvMoeda(p.preco)}<i class="fv-est${p.est <= 0 ? ' is-neg' : ''}">Est.: ${fvN(p.est)}</i></span></div>
            <div class="fv-lin"><div class="fv-ed"><span>Quantidade</span><div>${ed('qtd', e.qtd)}${setas('qtd')}</div></div></div>
            <div class="fv-lin fv-lin--2">${ro('Valor', fvN(p.preco))}${ro(`Valor Un. Cx. (${p.cx})`, fvN(p.preco / p.cx))}</div>
            <div class="fv-lin fv-lin--2">
                <div class="fv-ed"><span>Desc.(%)</span><div>${ed('pct', e.pct)}${setas('pct')}</div></div>
                <div class="fv-ed"><span>Desc.(R$)</span><div>${ed('rs', e.rs)}${setas('rs')}</div></div>
            </div>
            <div class="fv-lin fv-lin--2">${ro('Valor Unit. Final', fvN(c.unit))}${ro('Valor Tot. Frete', '0.0')}</div>
            <div class="fv-lin fv-lin--2">${ro('Valor Unit. C/ Frete', fvN(c.unit))}${ro('Total C/ Frete', fvN(c.total))}</div>
            <div class="fv-lin fv-lin--2">${ro('Total S/ Frete', fvN(c.total))}</div>
        </div>
        <div class="fv-teclado">${teclas}</div>`;
}

function fvComunicacao() {
    const pend = fv.pedidos.filter(p => !p.enviado).length;
    return `<div class="fv-topo">${fvBarra('Comunicação', 'globe', fvBotao("'home'", 'arrow-left', 'Voltar'))}</div>
        <div class="fv-scroll fv-com">
            <div class="fv-com__box"><i data-lucide="cloud-upload"></i><b>${pend ? pend + ' pedido(s) pendente(s)' : 'Nenhum pedido pendente'}</b><span>Os pedidos salvos no aparelho são enviados para o ERP.</span></div>
            <button type="button" class="fv-btn${pend && !fv.enviando ? ' fv-next' : ''}" onclick="fvAcao('enviar')" ${pend && !fv.enviando ? '' : 'disabled'}>${fv.enviando ? 'Enviando…' : 'Enviar pedidos'}</button>
        </div>`;
}

function fvSheet() {
    const s = fv.sheet, c = FV_CLIENTES.find(x => x.cod === s.cod);
    let corpo = '';
    if (s.tipo === 'detalhes') {
        corpo = `<b>Detalhes do Cliente</b>
            <dl class="fv-dl"><dt>Código</dt><dd>${c.cod}</dd><dt>Razão social</dt><dd>${fvEsc(c.razao)}</dd><dt>Fantasia</dt><dd>${fvEsc(c.fantasia)}</dd>
            <dt>Situação</dt><dd>${c.bloqueado ? 'Bloqueado' : 'Liberado'}</dd><dt>Endereço</dt><dd>RUA EXEMPLO, 100 - CENTRO</dd></dl>`;
    } else if (s.tipo === 'motivo') {
        corpo = `<b>Motivo Não Atendimento</b><small>${c.cod} - ${fvEsc(c.fantasia)}</small>
            ${FV_MOTIVOS.map(m => `<button type="button" class="fv-opt" onclick="fvAcao('registrarMotivo','${m}')">${m}</button>`).join('')}`;
    } else {
        corpo = `<b>Inadimplência</b><small>${c.cod} - ${fvEsc(c.fantasia)}</small>
            ${c.bloqueado ? `<div class="fv-tit"><span>Título 3105-1 · venc. 05/10/2026</span><b>R$ 312,40</b></div>` : '<p class="fv-vazio--txt">Nenhum título em aberto.</p>'}`;
    }
    return `<div class="fv-overlay fv-overlay--sheet" onclick="if(event.target===this)fvAcao('fecharSheet')"><div class="fv-sheet">${corpo}
        <button type="button" class="fv-link" onclick="fvAcao('fecharSheet')">Fechar</button></div></div>`;
}

function fvRender(primeira) {
    const el = document.getElementById('fv');
    if (!el || !fv) return;
    const a = primeira ? ' screen-anim' : '';
    const telas = { home: fvHome, clientes: fvClientes, pedido: fvPedido, item: fvItem, comunicacao: fvComunicacao };
    el.innerHTML = `<div class="fv-tela${a}">${telas[fv.tela]()}</div>${fv.drawer ? fvDrawer() : ''}${fv.sheet ? fvSheet() : ''}${fv.aviso ? `<div class="fv-aviso">${fvEsc(fv.aviso)}</div>` : ''}`;
    lucide.createIcons();
}

/*
 * SN Orbit (app do motorista): simulação do fluxo real de uma carga.
 * Etapas, textos e botões seguem as telas do app; clientes, pedidos e notas são fictícios.
 * Cada parada passa por: pendente -> rota aberta -> chegada confirmada -> canhoto enviado -> entregue.
 */
const ORBIT_CARGA = '1147';
const ORBIT_PARADAS = [
    { cliente: 'Mercado Bom Preço', pedido: '5521', nota: '21052', valor: 'R$ 420,00', x: 150, y: 150 },
    { cliente: 'Padaria Trigo Dourado', pedido: '5519', nota: '21043', valor: 'R$ 320,00', x: 96, y: 96 },
    { cliente: 'Supermercado Vitória', pedido: '5516', nota: '21038', valor: 'R$ 1.180,50', x: 70, y: 66 },
    { cliente: 'Distrib. Sabor & Cia', pedido: '5512', nota: '21031', valor: 'R$ 2.340,00', x: 52, y: 104 },
    { cliente: 'Conveniência VSM', pedido: '5510', nota: '21027', valor: 'R$ 868,40', x: 204, y: 84 }
];
let orbit = null;

function orbitStart() {
    orbit = {
        tab: 'entregas',
        etapa: ORBIT_PARADAS.map(() => 'pendente'), // pendente | rota | chegou | canhoto | entregue
        modal: null,       // navegar | chegada | canhoto | finalizar | fechar
        externo: null,     // 'Google Maps' ou 'Waze' enquanto a rota está aberta fora do app
        fechada: false,
        enviando: false
    };
    orbitRender(true);
}

function orbitAtual() {
    return orbit.etapa.findIndex(e => e !== 'entregue');
}

function orbitAcao(acao, arg) {
    const i = orbitAtual();
    switch (acao) {
        case 'tab': orbit.tab = arg; break;
        case 'abrirMapa': orbit.tab = 'mapa'; break;
        case 'navegar': orbit.modal = 'navegar'; break;
        case 'abrirApp':
            orbit.modal = null;
            orbit.externo = arg;
            if (orbit.etapa[i] === 'pendente') orbit.etapa[i] = 'rota';
            break;
        case 'voltarOrbit': orbit.externo = null; orbit.tab = 'mapa'; break;
        case 'chegada': orbit.modal = 'chegada'; break;
        case 'confirmarChegada': orbit.modal = null; orbit.etapa[i] = 'chegou'; break;
        case 'canhoto': orbit.modal = 'canhoto'; break;
        case 'enviarCanhoto':
            orbit.enviando = true;
            orbitRender();
            setTimeout(() => {
                if (!orbit || !orbit.enviando) return;
                orbit.enviando = false;
                orbit.modal = null;
                orbit.etapa[i] = 'canhoto';
                orbitRender();
            }, 900);
            return;
        case 'finalizar': orbit.modal = 'finalizar'; break;
        case 'confirmarFinalizar': orbit.modal = null; orbit.etapa[i] = 'entregue'; break;
        case 'fecharCarga': if (i === -1) orbit.modal = 'fechar'; break;
        case 'confirmarFechar': orbit.modal = null; orbit.fechada = true; break;
        case 'cancelar': orbit.modal = null; orbit.enviando = false; break;
        case 'reiniciar': orbitStart(); return;
    }
    orbitRender();
}

function orbitEsc(t) {
    return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

function orbitProximaAcao(etapa) {
    return { pendente: 'chegar no cliente', rota: 'chegar no cliente', chegou: 'enviar canhoto', canhoto: 'finalizar entrega' }[etapa] || '';
}

// Botões da parada atual, na ordem em que aparecem no app
function orbitBotoes(i, origem) {
    const etapa = orbit.etapa[i];
    if (origem === 'mapa' && etapa === 'pendente') {
        return `<button type="button" class="orb-btn orb-btn--nav orb-next" onclick="orbitAcao('navegar')">Iniciar navegação</button>`;
    }
    const segundo = origem === 'lista' ? ['abrirMapa', 'Abrir mapa'] : ['navegar', 'Abrir rota'];
    const principal = {
        pendente: ['chegada', 'Cheguei na entrega', 'orb-btn--blue'],
        rota: ['chegada', 'Cheguei na entrega', 'orb-btn--blue'],
        chegou: ['canhoto', 'Enviar canhoto', 'orb-btn--orange'],
        canhoto: ['finalizar', 'Finalizei a entrega', 'orb-btn--green']
    }[etapa];
    return `<div class="orb-row">
        <button type="button" class="orb-btn orb-btn--ghost" onclick="orbitAcao('${segundo[0]}')">${segundo[1]}</button>
        <button type="button" class="orb-btn ${principal[2]} orb-next" onclick="orbitAcao('${principal[0]}')">${principal[1]}</button>
    </div>`;
}

function orbitLista() {
    const atual = orbitAtual();
    const idx = ORBIT_PARADAS.map((_, i) => i);
    const ordem = idx.filter(i => orbit.etapa[i] !== 'entregue').concat(idx.filter(i => orbit.etapa[i] === 'entregue'));
    return ordem.map(i => {
        const p = ORBIT_PARADAS[i];
        const etapa = orbit.etapa[i];
        const entregue = etapa === 'entregue';
        const agora = i === atual;
        const selo = entregue ? '' : agora ? '<span class="orb-tag orb-tag--now">AGORA</span>' : '<span class="orb-tag">PROXIMO</span>';
        const status = entregue ? '<span class="orb-status orb-status--done">Entregue</span>' : '<span class="orb-status">Pendente</span>';
        const acoes = entregue ? '' : agora ? orbitBotoes(i, 'lista')
            : `<div class="orb-row"><button type="button" class="orb-btn orb-btn--ghost" disabled>Abrir mapa</button><button type="button" class="orb-btn orb-btn--blue" disabled>Cheguei na entrega</button></div>`;
        return `<article class="orb-card${agora ? ' is-now' : ''}${entregue ? ' is-done' : ''}">
            ${selo}
            <div class="orb-card__top">
                <span class="orb-num">${i + 1}</span>
                <div class="orb-card__id"><b>${orbitEsc(p.cliente.toUpperCase())}</b><span>Pedido ${p.pedido} · Nota ${p.nota}</span></div>
                ${status}
            </div>
            <p class="orb-valor">${p.valor}</p>
            ${entregue ? '' : `<p class="orb-prox">Próxima ação: ${orbitProximaAcao(etapa)}</p>`}
            ${acoes}
        </article>`;
    }).join('');
}

function orbitMapa() {
    const atual = orbitAtual();
    const p = ORBIT_PARADAS[atual];
    const chegou = orbit.etapa[atual] === 'chegou' || orbit.etapa[atual] === 'canhoto';
    const pins = ORBIT_PARADAS.map((q, i) => {
        if (orbit.etapa[i] === 'entregue') return '';
        const agora = i === atual;
        const cor = agora && chegou ? '#1a73e8' : '#f2a516';
        return `<g transform="translate(${q.x} ${q.y})">
            ${agora ? '<circle r="17" fill="#1a73e8" opacity="0.18"/>' : ''}
            <path d="M-4 8 L0 15 L4 8 Z" fill="${cor}"/>
            <rect x="-10" y="-10" width="20" height="20" rx="7" fill="${cor}" stroke="#fff" stroke-width="2"/>
            <text y="3.5" text-anchor="middle" font-size="10" font-weight="700" fill="#fff">${i + 1}</text>
            ${agora ? '<rect x="11" y="-18" width="34" height="13" rx="6.5" fill="#1a73e8"/><text x="28" y="-9" text-anchor="middle" font-size="7" font-weight="700" fill="#fff">AGORA</text>' : ''}
        </g>`;
    }).join('');
    const quadras = [120, 135, 150, 165].map(y => `<path d="M100 ${y} H190"/>`).join('')
        + [110, 130, 150, 170].map(x => `<path d="M${x} 115 V180"/>`).join('');
    return `<div class="orb-map">
        <svg viewBox="0 0 260 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <rect width="260" height="300" fill="#f4efe0"/>
            <path d="M0 40 C60 60 110 90 150 150 S210 250 260 270" stroke="#eca98a" stroke-width="5" fill="none"/>
            <path d="M140 0 C130 80 150 200 130 300" stroke="#eca98a" stroke-width="4" fill="none"/>
            <path d="M0 200 C70 190 140 170 260 110" stroke="#eccfb8" stroke-width="3" fill="none"/>
            <path d="M40 0 L90 120 L60 300" stroke="#e8ddc8" stroke-width="2" fill="none"/>
            <g stroke="#e6dccb" stroke-width="1">${quadras}</g>
            ${pins}
        </svg>
        <div class="orb-chip orb-chip--sel"><b>Entrega selecionada</b><span>Parada ${atual + 1}</span></div>
        <button type="button" class="orb-chip orb-chip--full" onclick="this.closest('.orb').classList.toggle('is-full')">Tela cheia</button>
        <div class="orb-sheet">
            <span class="orb-sheet__grip"></span>
            <div class="orb-sheet__top">
                <div><small>ENTREGA ATUAL</small><b>${orbitEsc(p.cliente.toUpperCase())}</b><span>Nota ${p.nota} | Pedido ${p.pedido}</span></div>
                <span class="orb-num orb-num--lg">${atual + 1}</span>
            </div>
            ${orbitBotoes(atual, 'mapa')}
        </div>
    </div>`;
}

function orbitResumo() {
    const feitas = orbit.etapa.filter(e => e === 'entregue').length;
    const total = ORBIT_PARADAS.length;
    const linhas = ORBIT_PARADAS.map((p, i) => `<div class="orb-line"><span class="orb-num">${i + 1}</span><span>${orbitEsc(p.cliente)}</span>${orbit.etapa[i] === 'entregue' ? '<span class="orb-status orb-status--done">Entregue</span>' : '<span class="orb-status">Pendente</span>'}</div>`).join('');
    return `<div class="orb-card"><small class="orb-label">CARGA</small><p class="orb-big">#${ORBIT_CARGA}</p></div>
        <div class="orb-grid2">
            <div class="orb-card"><small class="orb-label">ENTREGUES</small><p class="orb-big">${feitas}/${total}</p></div>
            <div class="orb-card"><small class="orb-label">PENDENTES</small><p class="orb-big">${total - feitas}</p></div>
        </div>
        <div class="orb-card">${linhas}</div>`;
}

function orbitModal() {
    if (!orbit.modal) return '';
    const i = orbitAtual();
    const p = ORBIT_PARADAS[i === -1 ? 0 : i];
    const alvo = `<p class="orb-alvo">${orbitEsc(p.cliente.toUpperCase())} | Nota ${p.nota}</p>`;
    const cancelar = `<button type="button" class="orb-btn orb-btn--ghost" onclick="orbitAcao('cancelar')">Cancelar</button>`;
    const telas = {
        navegar: `<h4><i class="orb-dot"></i>Iniciar navegação</h4><p>Escolha onde abrir a rota desta entrega.</p>${alvo}
            <button type="button" class="orb-opt orb-next" onclick="orbitAcao('abrirApp','Google Maps')"><span class="orb-opt__ic"><i data-lucide="locate-fixed"></i></span><span><b>Google Maps</b>Abrir rota com navegação pelo Google Maps</span></button>
            <button type="button" class="orb-opt" onclick="orbitAcao('abrirApp','Waze')"><span class="orb-opt__ic"><i data-lucide="car-front"></i></span><span><b>Waze</b>Abrir rota com navegação pelo Waze</span></button>
            ${cancelar}`,
        chegada: `<h4><i class="orb-dot"></i>Cheguei na entrega</h4><p>Confirme a chegada ao cliente para liberar o envio do canhoto.</p>${alvo}
            <div class="orb-row">${cancelar}<button type="button" class="orb-btn orb-btn--blue orb-next" onclick="orbitAcao('confirmarChegada')">Confirmar chegada</button></div>`,
        canhoto: `<h4><i class="orb-dot orb-dot--orange"></i>Enviar canhoto</h4><p>Registre o canhoto assinado desta entrega.</p>${alvo}
            <div class="orb-foto"><i data-lucide="camera"></i><span>Foto do canhoto</span></div>
            <div class="orb-row">${cancelar}<button type="button" class="orb-btn orb-btn--orange orb-next" onclick="orbitAcao('enviarCanhoto')" ${orbit.enviando ? 'disabled' : ''}>${orbit.enviando ? 'Enviando…' : 'Enviar canhoto'}</button></div>`,
        finalizar: `<h4><i class="orb-dot orb-dot--green"></i>Finalizar entrega</h4><p>Deseja concluir esta entrega e avançar para a próxima parada da rota?</p><p class="orb-alvo orb-alvo--green">${orbitEsc(p.cliente.toUpperCase())} | Nota ${p.nota}</p>
            <div class="orb-row">${cancelar}<button type="button" class="orb-btn orb-btn--green orb-next" onclick="orbitAcao('confirmarFinalizar')">Finalizar entrega</button></div>`,
        fechar: `<h4><i class="orb-dot orb-dot--red"></i>Fechar carga</h4><p>Todas as entregas da carga #${ORBIT_CARGA} foram finalizadas.</p>
            <div class="orb-row">${cancelar}<button type="button" class="orb-btn orb-btn--red orb-next" onclick="orbitAcao('confirmarFechar')">Fechar carga</button></div>`
    };
    return `<div class="orb-overlay"><div class="orb-modal" role="dialog" aria-modal="true">${telas[orbit.modal]}</div></div>`;
}

// Tela do app de navegação externo (Google Maps ou Waze), em versão neutra
function orbitExterno() {
    const p = ORBIT_PARADAS[orbitAtual()];
    return `<div class="orb-ext">
        <div class="orb-ext__top"><i data-lucide="corner-up-right"></i><div><b>200 m</b><span>Siga a rota até o cliente</span></div></div>
        <div class="orb-ext__map"><svg viewBox="0 0 260 260" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="260" height="260" fill="#e9eef3"/><path d="M110 260 V150 C110 120 130 110 160 100 L260 66" stroke="#c9d3de" stroke-width="18" fill="none"/><path d="M110 260 V150 C110 120 130 110 160 100 L196 88" stroke="#1a73e8" stroke-width="7" fill="none" stroke-linecap="round"/><circle cx="110" cy="225" r="8" fill="#1a73e8" stroke="#fff" stroke-width="3"/><circle cx="196" cy="88" r="7" fill="#e5252a"/></svg></div>
        <div class="orb-ext__card">
            <small>Rota aberta no ${orbit.externo}</small>
            <b>${orbitEsc(p.cliente)}</b>
            <span>Nota ${p.nota} | Pedido ${p.pedido}</span>
            <button type="button" class="orb-btn orb-btn--blue orb-next" onclick="orbitAcao('voltarOrbit')">Voltar ao Orbit</button>
        </div>
    </div>`;
}

function orbitRender(primeira) {
    const el = document.getElementById('orb');
    if (!el || !orbit) return;
    if (orbit.externo) { el.innerHTML = orbitExterno(); lucide.createIcons(); return; }
    const a = primeira ? ' screen-anim' : '';
    const atual = orbitAtual();
    const feitas = orbit.etapa.filter(e => e === 'entregue').length;
    const total = ORBIT_PARADAS.length;
    const sub = { entregas: 'Operação de entregas', mapa: 'Mapa visual da carga', resumo: 'Resumo da carga' }[orbit.tab];
    let corpo;
    if (orbit.fechada) {
        corpo = `<div class="orb-fim"><span class="orb-fim__ic"><i data-lucide="check"></i></span><b>Carga #${ORBIT_CARGA} fechada</b><span>${total} de ${total} entregas finalizadas.</span><button type="button" class="orb-btn orb-btn--blue" onclick="orbitAcao('reiniciar')">Começar de novo</button></div>`;
    } else if (orbit.tab === 'mapa' && atual === -1) {
        corpo = `<div class="orb-fim"><b>Todas as paradas concluídas</b><span>Volte para Entregas e feche a carga.</span><button type="button" class="orb-btn orb-btn--blue orb-next" onclick="orbitAcao('tab','entregas')">Ir para Entregas</button></div>`;
    } else if (orbit.tab === 'mapa') {
        corpo = orbitMapa();
    } else if (orbit.tab === 'resumo') {
        corpo = orbitResumo();
    } else {
        corpo = `<div class="orb-carga">
                <span class="orb-carga__ic"><i data-lucide="truck"></i></span>
                <div><small>CARGA ATIVA</small><b>#${ORBIT_CARGA}</b><span${feitas === total ? ' class="is-ok"' : ''}>${total - feitas} pendentes · ${feitas}/${total}</span></div>
                <button type="button" class="orb-btn orb-btn--red${atual === -1 ? ' orb-next' : ''}" onclick="orbitAcao('fecharCarga')">Fechar carga</button>
            </div>${orbitLista()}`;
    }
    const nav = [['entregas', 'truck', 'Entregas'], ['mapa', 'map-pin', 'Mapa'], ['resumo', 'file-text', 'Resumo']]
        .map(([k, ic, t]) => `<button type="button" class="orb-tab${orbit.tab === k ? ' is-on' : ''}" onclick="orbitAcao('tab','${k}')" ${orbit.fechada ? 'disabled' : ''}><span><i data-lucide="${ic}"></i></span>${t}</button>`).join('');
    el.innerHTML = `
        <header class="orb-head${a}">
            <span class="orb-logo">SN</span>
            <div class="orb-head__txt"><p><b>Orbit</b><span class="orb-pill">ENTREGAS</span><i class="orb-on"></i></p><span>${sub}</span></div>
            <span class="orb-more"><i data-lucide="more-horizontal"></i></span>
        </header>
        <div class="orb-body orb-body--${orbit.tab}${a}">${corpo}</div>
        <nav class="orb-nav${a}">${nav}</nav>
        ${orbitModal()}`;
    lucide.createIcons();
}

/*
 * Portal B2B (app de pedidos do cliente): simulação do fluxo real.
 * Telas, textos e botões seguem o app; produtos, preços e descontos são fictícios.
 * Loja -> categoria -> detalhes do item (quantidade e desconto progressivo) -> Seu Pedido -> Fechar pedido.
 */
const B2B_CATEGORIAS = [
    { id: 'bolos', nome: 'Bolos', icone: 'cake-slice' },
    { id: 'alho', nome: 'Pão de alho', icone: 'wheat' },
    { id: 'forma', nome: 'Pão de forma', icone: 'sandwich' },
    { id: 'hamburguer', nome: 'Pão de hambúrguer', icone: 'hamburger' },
    { id: 'lanche', nome: 'Pão de lanche', icone: 'croissant' }
];
const B2B_PRODUTOS = [
    { id: 1, cat: 'alho', nome: 'Pão de alho tradicional 400g', preco: 10.90, cor: '#f39c34' },
    { id: 2, cat: 'alho', nome: 'Pão de alho com queijo 400g', preco: 11.90, cor: '#e8b630' },
    { id: 3, cat: 'alho', nome: 'Pão de alho apimentado 400g', preco: 11.90, cor: '#e2483d' },
    { id: 4, cat: 'bolos', nome: 'Bolo de chocolate 500g', preco: 18.50, cor: '#7a4a2e' },
    { id: 5, cat: 'bolos', nome: 'Bolo de cenoura 500g', preco: 16.90, cor: '#f08a24' },
    { id: 6, cat: 'forma', nome: 'Pão de forma tradicional 500g', preco: 8.40, cor: '#d9a35b' },
    { id: 7, cat: 'forma', nome: 'Pão de forma integral 500g', preco: 9.20, cor: '#9c6b3d' },
    { id: 8, cat: 'hamburguer', nome: 'Pão de hambúrguer com gergelim 6 un', preco: 7.80, cor: '#c98a3c' },
    { id: 9, cat: 'lanche', nome: 'Pão de lanche 10 un', preco: 9.90, cor: '#d4a050' }
];
const B2B_MAIS_COMPRADOS = [1, 6, 8];
// Desconto progressivo por quantidade (faixas de exemplo)
const B2B_DESCONTOS = [
    { de: 10, ate: 19, pct: 5 },
    { de: 20, ate: 39, pct: 8 },
    { de: 40, ate: 79, pct: 10 },
    { de: 80, ate: 9999, pct: 12 }
];
let b2b = null;

function b2bStart() {
    b2b = { tela: 'loja', cat: null, item: null, busca: '', carrinho: {}, favoritos: {}, pedidos: [], sheet: false, aviso: null };
    b2bRender(true);
}

function b2bMoeda(v) {
    return 'R$ ' + v.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function b2bDesconto(qtd) {
    const f = B2B_DESCONTOS.find(d => qtd >= d.de && qtd <= d.ate);
    return f ? f.pct : 0;
}

function b2bTotalItem(p, qtd) {
    return p.preco * qtd * (1 - b2bDesconto(qtd) / 100);
}

function b2bItensCarrinho() {
    return Object.entries(b2b.carrinho).filter(([, q]) => q > 0).map(([id, q]) => ({ p: B2B_PRODUTOS.find(x => x.id === Number(id)), q }));
}

function b2bTotal() {
    return b2bItensCarrinho().reduce((s, { p, q }) => s + b2bTotalItem(p, q), 0);
}

function b2bAcao(acao, arg) {
    switch (acao) {
        case 'loja': b2b.tela = 'loja'; b2b.cat = null; b2b.busca = ''; break;
        case 'categoria': b2b.tela = 'lista'; b2b.cat = arg; b2b.busca = ''; break;
        case 'item':
            b2b.tela = 'item'; b2b.item = arg;
            if (!b2b.carrinho[arg]) b2b.carrinho[arg] = 1;
            break;
        case 'voltarItem': b2b.tela = b2b.cat || b2b.busca ? 'lista' : 'loja'; break;
        case 'mais': b2b.carrinho[b2b.item] = Math.min(9999, (b2b.carrinho[b2b.item] || 0) + 1); break;
        case 'menos': b2b.carrinho[b2b.item] = Math.max(0, (b2b.carrinho[b2b.item] || 0) - 1); break;
        case 'favorito': b2b.favoritos[arg] = !b2b.favoritos[arg]; break;
        case 'carrinho': b2b.tela = 'carrinho'; break;
        case 'remover': delete b2b.carrinho[arg]; break;
        case 'fecharPedido': {
            const itens = b2bItensCarrinho();
            if (!itens.length) break;
            b2b.pedidos.unshift({ numero: 1000 + b2b.pedidos.length + 1, itens: itens.length, total: b2bTotal() });
            b2b.carrinho = {};
            b2b.tela = 'enviado';
            break;
        }
        case 'historico': b2b.tela = 'historico'; break;
        case 'whatsapp': b2b.sheet = true; break;
        case 'fecharSheet': b2b.sheet = false; break;
        case 'abrirWhats':
            b2b.sheet = false;
            b2b.aviso = 'Abrindo conversa no ' + arg + '…';
            setTimeout(() => { if (b2b) { b2b.aviso = null; b2bRender(); } }, 1600);
            break;
    }
    b2bRender();
}

function b2bEsc(t) {
    return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

// Embalagem genérica do produto (sem marca)
function b2bFoto(p, tam) {
    return `<span class="b2b-foto b2b-foto--${tam}" style="--c:${p.cor}"><i></i><i></i><i></i></span>`;
}

function b2bTopo(voltar) {
    const qtd = b2bItensCarrinho().length;
    return `<div class="b2b-top">
        ${voltar ? `<button type="button" class="b2b-round" onclick="b2bAcao('${voltar}')" aria-label="Voltar"><i data-lucide="arrow-left"></i></button>`
            : `<span class="b2b-round" aria-hidden="true"><i data-lucide="menu"></i></span>`}
        <label class="b2b-busca"><i data-lucide="search"></i><input type="search" placeholder="Procurar produto" value="${b2bEsc(b2b.busca)}" oninput="b2bBuscar(this.value)" aria-label="Procurar produto"></label>
        <button type="button" class="b2b-round b2b-cart" onclick="b2bAcao('carrinho')" aria-label="Carrinho"><i data-lucide="shopping-cart"></i>${qtd ? `<b>${qtd}</b>` : ''}</button>
    </div>`;
}

function b2bBuscar(valor) {
    b2b.busca = valor;
    if (b2b.tela !== 'lista') { b2b.tela = 'lista'; b2b.cat = null; }
    b2bRender();
    const input = document.querySelector('#b2b .b2b-busca input');
    if (input) { input.focus(); input.setSelectionRange(valor.length, valor.length); }
}

function b2bLinhas(lista) {
    if (!lista.length) return '<p class="b2b-vazio">Nenhum produto encontrado.</p>';
    return lista.map(p => `<div class="b2b-linha">
        <button type="button" class="b2b-linha__abre" onclick="b2bAcao('item', ${p.id})">
            ${b2bFoto(p, 'sm')}
            <span><b>${b2bEsc(p.nome)}</b><span>${b2bMoeda(p.preco)}</span></span>
        </button>
        <button type="button" class="b2b-star${b2b.favoritos[p.id] ? ' is-on' : ''}" onclick="b2bAcao('favorito', ${p.id})" aria-label="Favoritar"><i data-lucide="star"></i></button>
    </div>`).join('');
}

function b2bLoja() {
    const cats = B2B_CATEGORIAS.map(c => `<button type="button" class="b2b-cat" onclick="b2bAcao('categoria','${c.id}')"><span><i data-lucide="${c.icone}"></i></span>${c.nome}</button>`).join('');
    return `${b2bTopo(null)}
        <div class="b2b-scroll">
            <div class="b2b-cats">${cats}</div>
            <p class="b2b-faixa">Especialmente para você</p>
            <div class="b2b-banner"><b>Ofertas da semana</b><span>Pão de alho com desconto progressivo</span><button type="button" onclick="b2bAcao('categoria','alho')">Ver produtos</button></div>
            <p class="b2b-faixa">Mais Comprados</p>
            ${b2bLinhas(B2B_MAIS_COMPRADOS.map(id => B2B_PRODUTOS.find(p => p.id === id)))}
        </div>`;
}

function b2bLista() {
    const termo = b2b.busca.trim().toLowerCase();
    const lista = B2B_PRODUTOS.filter(p => (b2b.cat ? p.cat === b2b.cat : true) && (!termo || p.nome.toLowerCase().includes(termo)));
    return `${b2bTopo('loja')}<div class="b2b-scroll">${b2bLinhas(lista)}</div>`;
}

function b2bItem() {
    const p = B2B_PRODUTOS.find(x => x.id === b2b.item);
    const qtd = b2b.carrinho[p.id] || 0;
    const pct = b2bDesconto(qtd);
    const faixas = B2B_DESCONTOS.map(d => `<li${pct === d.pct && qtd >= d.de ? ' class="is-on"' : ''}>${d.de} a ${d.ate} produtos - ${d.pct.toFixed(2).replace('.', ',')} %</li>`).join('');
    return `<div class="b2b-head">
            <button type="button" class="b2b-back" onclick="b2bAcao('voltarItem')" aria-label="Voltar"><i data-lucide="chevron-left"></i></button>
            <b>Detalhes do item</b>
            <button type="button" class="b2b-star b2b-star--lg${b2b.favoritos[p.id] ? ' is-on' : ''}" onclick="b2bAcao('favorito', ${p.id})" aria-label="Favoritar"><i data-lucide="star"></i></button>
        </div>
        <div class="b2b-scroll b2b-scroll--item">
            <div class="b2b-hero">${b2bFoto(p, 'lg')}</div>
            <div class="b2b-ficha">
                <h5>${b2bEsc(p.nome)}</h5>
                <div class="b2b-precos">
                    <div><small>A partir de</small><b>${b2bMoeda(p.preco)}</b></div>
                    <div class="b2b-qtd-box">
                        <div class="b2b-qtd">
                            <button type="button" onclick="b2bAcao('menos')" aria-label="Diminuir"><i data-lucide="circle-minus"></i></button>
                            <span>${qtd}<i data-lucide="keyboard"></i></span>
                            <button type="button" class="b2b-next" onclick="b2bAcao('mais')" aria-label="Aumentar"><i data-lucide="circle-plus"></i></button>
                        </div>
                        <b>${b2bMoeda(b2bTotalItem(p, qtd))}</b>
                    </div>
                </div>
                <p class="b2b-sub">Desconto Progressivo:</p>
                <ul class="b2b-faixas">${faixas}</ul>
                <p class="b2b-sub">Descrição:</p>
                <p class="b2b-desc">${b2bEsc(p.nome)}</p>
                ${qtd ? `<button type="button" class="b2b-ir b2b-next" onclick="b2bAcao('carrinho')">Ver pedido</button>` : ''}
            </div>
        </div>`;
}

function b2bCarrinho() {
    const itens = b2bItensCarrinho();
    const linhas = itens.map(({ p, q }) => `<div class="b2b-ped">
        ${b2bFoto(p, 'sm')}
        <div><b>${b2bEsc(p.nome)}</b><span>${b2bMoeda(p.preco)} &nbsp;x&nbsp; ${q} UND</span><strong>Total: ${b2bMoeda(b2bTotalItem(p, q))}</strong></div>
        <button type="button" class="b2b-lixo" onclick="b2bAcao('remover', ${p.id})" aria-label="Remover"><i data-lucide="trash-2"></i></button>
    </div>`).join('');
    return `<div class="b2b-head b2b-head--ped">
            <button type="button" class="b2b-back" onclick="b2bAcao('loja')" aria-label="Voltar"><i data-lucide="arrow-left"></i></button>
            <div><b>Seu Pedido</b><span>${itens.length} item(s)</span></div>
        </div>
        <div class="b2b-scroll">${linhas || '<p class="b2b-vazio">Seu pedido está vazio.</p>'}</div>
        <div class="b2b-rodape">
            <button type="button" class="b2b-amarelo" onclick="b2bAcao('loja')">Continuar comprando</button>
            <div class="b2b-fechar"><div><small>Total:</small><b>${b2bMoeda(b2bTotal())}</b></div><button type="button" class="b2b-preto${itens.length ? ' b2b-next' : ''}" onclick="b2bAcao('fecharPedido')" ${itens.length ? '' : 'disabled'}>Fechar pedido</button></div>
        </div>`;
}

function b2bHistorico() {
    const lista = b2b.pedidos.map(p => `<div class="b2b-hist"><div><b>Pedido ${p.numero}</b><span>${p.itens} item(s)</span></div><strong>${b2bMoeda(p.total)}</strong></div>`).join('');
    return `<div class="b2b-red"><button type="button" onclick="b2bAcao('loja')" aria-label="Voltar"><i data-lucide="arrow-left"></i></button><b>Histórico pedidos</b></div>
        <div class="b2b-scroll">${lista || '<p class="b2b-vazio">Não foram encontrados Pedidos.</p>'}</div>`;
}

function b2bEnviado() {
    const p = b2b.pedidos[0];
    return `<div class="b2b-ok"><span><i data-lucide="check"></i></span><b>Pedido ${p.numero} enviado</b><small>${b2bMoeda(p.total)}</small>
        <button type="button" class="b2b-amarelo b2b-next" onclick="b2bAcao('historico')">Ver histórico</button>
        <button type="button" class="b2b-link" onclick="b2bAcao('loja')">Voltar para a loja</button></div>`;
}

function b2bRender(primeira) {
    const el = document.getElementById('b2b');
    if (!el || !b2b) return;
    const a = primeira ? ' screen-anim' : '';
    const telas = { loja: b2bLoja, lista: b2bLista, item: b2bItem, carrinho: b2bCarrinho, historico: b2bHistorico, enviado: b2bEnviado };
    const comNav = ['loja', 'lista', 'item', 'historico'].includes(b2b.tela);
    const nav = comNav ? `<nav class="b2b-nav${a}">
            <button type="button" class="${b2b.tela !== 'historico' ? 'is-on' : ''}" onclick="b2bAcao('loja')" aria-label="Loja"><i data-lucide="store"></i></button>
            <button type="button" class="${b2b.tela === 'historico' ? 'is-on' : ''}" onclick="b2bAcao('historico')" aria-label="Histórico de pedidos"><i data-lucide="receipt-text"></i></button>
            <button type="button" onclick="b2bAcao('whatsapp')" aria-label="WhatsApp"><i data-lucide="message-circle"></i></button>
        </nav>` : '';
    const sheet = b2b.sheet ? `<div class="b2b-overlay" onclick="if(event.target===this)b2bAcao('fecharSheet')"><div class="b2b-sheet">
            <b>Abrir com</b>
            <div class="b2b-apps">
                <button type="button" onclick="b2bAcao('abrirWhats','WhatsApp Business')"><span class="b2b-wa b2b-wa--biz"><i data-lucide="message-circle"></i></span>WhatsApp Business</button>
                <button type="button" onclick="b2bAcao('abrirWhats','WhatsApp')"><span class="b2b-wa"><i data-lucide="message-circle"></i></span>WhatsApp</button>
            </div>
            <div class="b2b-sheet__acts"><button type="button" onclick="b2bAcao('abrirWhats','WhatsApp')">Apenas uma vez</button><button type="button" onclick="b2bAcao('abrirWhats','WhatsApp')">Sempre</button></div>
        </div></div>` : '';
    const aviso = b2b.aviso ? `<div class="b2b-aviso">${b2b.aviso}</div>` : '';
    el.innerHTML = `<div class="b2b-tela${a}">${telas[b2b.tela]()}</div>${nav}${sheet}${aviso}`;
    lucide.createIcons();
}

/*
 * BI Diretoria (Dashboard Comercial): simulação do painel real, com as 7 páginas.
 * Layout, páginas e indicadores seguem o painel; a empresa (Distribuidora Aurora),
 * vendedores, regiões, clientes, produtos e valores são fictícios. Os totais batem entre si.
 */
const BI_W = 800, BI_H = 476; // relatório 16:9 (800x450) + abas de página
const BI_EMPRESAS = [
    { id: 1, nome: '1 - DISTRIBUIDORA AURORA', f: 1 },
    { id: 2, nome: '2 - AURORA FILIAL SUL', f: 0.58 }
];
const BI_PAGINAS = [
    ['inicio', 'INÍCIO'], ['geral', 'GERAL'], ['vendedor', 'VENDEDOR'], ['cliente', 'CLIENTE'],
    ['produto', 'PRODUTO'], ['frequencia', 'FREQUÊNCIA'], ['cadastros', 'CADASTROS TOTAIS']
];
const BI_DADOS = {
    kpi: { bruto: 128460, dev: 4150, desc: 1120, pedidos: 302 },
    departamento: [['AURORA', 86020], ['REVENDA', 38290]],
    tabelaPreco: [['VAREJO', 98400], ['ATACADO', 25910]],
    ramo: [['PADARIAS', 46200], ['SUPERMERCADOS', 38700], ['BARES', 18900], ['DISTRIBUIDORES', 11300], ['RESTAURANTES', 6400], ['(Em branco)', 2810]],
    meses: [['Agosto', 112400, 3100], ['Setembro', 118900, 2870], ['Outubro', 124310, 4150]],
    regiao: [['REGIÃO CENTRO', 48900], ['REGIÃO NORTE', 33400], ['REGIÃO SUL', 26100], ['REGIÃO LESTE', 15910]],
    // nome, fat. bruto, devoluções, bonificação, fat. líquido mês anterior, pedidos, clientes
    vendedores: [['ANA', 43500, 1320, 420, 39800, 98, 64], ['BRUNO', 36700, 1100, 300, 37900, 86, 58], ['CARLA', 29800, 860, 250, 26400, 72, 51], ['DIEGO', 18460, 870, 150, 18100, 46, 33]],
    // nome fantasia, departamento, fat. bruto, devoluções, mix de produtos, pedidos, peso bruto (kg)
    clientes: [
        ['Padaria Sol Nascente', 'AURORA', 6840, 120, 12, 14, 312.4], ['Mercado Bom Preço', 'REVENDA', 5930, 90, 9, 13, 268.1],
        ['Supermercado Vitória', 'AURORA', 5410, 150, 11, 12, 241.8], ['Padaria Trigo Dourado', 'AURORA', 4620, 60, 8, 11, 205.3],
        ['Bar do Centro', 'REVENDA', 3180, 40, 5, 8, 120.6], ['Mercearia Boa Vista', 'REVENDA', 2770, 30, 6, 7, 109.2],
        ['Restaurante Sabor Caseiro', 'AURORA', 2380, 20, 4, 6, 98.7], ['Conveniência VSM', 'REVENDA', 1960, 40, 4, 5, 76.4],
        ['Empório Santa Luz', 'AURORA', 1820, 40, 5, 5, 70.1], ['Bar Esquina', 'REVENDA', 1570, 30, 3, 4, 58.9]
    ],
    novosAtendidos: [['Ana', 6], ['Carla', 5], ['Bruno', 4], ['Diego', 2]],
    novosCadastros: [['Ana', 4], ['Bruno', 3], ['Carla', 3], ['Diego', 1]],
    // produto, qtd vendida, pedidos, mix de clientes, clientes que não compraram, fat. líquido
    produtos: [
        ['PÃO DE ALHO TRADICIONAL 400G', 1460, 118, 84, 50, 15910], ['PÃO DE FORMA TRADICIONAL 500G', 1820, 142, 96, 38, 15290],
        ['BOLO DE CHOCOLATE 500G', 620, 77, 52, 82, 11470], ['PÃO DE HAMBÚRGUER COM GERGELIM', 1390, 104, 71, 63, 10840],
        ['PÃO DE ALHO COM QUEIJO 400G', 820, 71, 49, 85, 9760], ['PÃO DE LANCHE 10 UN', 980, 88, 60, 74, 9700],
        ['BOLO DE CENOURA 500G', 540, 58, 41, 93, 9130], ['PÃO DE FORMA INTEGRAL 500G', 710, 66, 45, 89, 6530]
    ],
    semCompraRegiao: [['REGIÃO CENTRO', 18, 9, 4], ['REGIÃO NORTE', 22, 14, 7], ['REGIÃO SUL', 15, 11, 9], ['REGIÃO LESTE', 12, 6, 8], ['INTERIOR', 9, 7, 5], ['OUTROS', 6, 3, 2]],
    semCompraVendedor: [['Ana', 14, 7, 3], ['Bruno', 19, 12, 8], ['Carla', 11, 8, 6], ['Diego', 16, 11, 12], ['Vendedor Central', 22, 12, 6]],
    cadastrosRegiao: [['REGIÃO CENTRO', 410], ['REGIÃO NORTE', 320], ['REGIÃO SUL', 270], ['REGIÃO LESTE', 160], ['OUTROS', 80]],
    cadastrosVendedor: [['Ana', 380], ['Bruno', 340], ['Carla', 310], ['Diego', 210]]
};
let bi = null;

function biStart() {
    bi = { pagina: 'inicio', empresa: 1, depto: 'TODOS' };
    biRender();
}

function biAcao(acao, arg) {
    if (acao === 'pagina') bi.pagina = arg;
    if (acao === 'empresa') bi.empresa = Number(arg);
    if (acao === 'depto') bi.depto = arg;
    if (acao === 'atualizar') { bi.empresa = 1; bi.depto = 'TODOS'; }
    biRender();
}

// Valores da empresa selecionada (a filial usa a mesma estrutura em outra escala)
function biV(v) { return Math.round(v * BI_EMPRESAS.find(e => e.id === bi.empresa).f); }
function biReal(v) { return 'R$ ' + v.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
function biMil(v) { return 'R$ ' + (v / 1000).toFixed(2).replace('.', ',') + ' Mil'; }
function biNum(v, casas) { return v.toFixed(casas || 0).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
function biPct(v) { return (v > 0 ? '+' : '') + v.toFixed(2).replace('.', ',') + '%'; }

function biBarras(lista, fmt, opts) {
    const o = opts || {};
    const max = Math.max(...lista.map(l => l[1]));
    return `<div class="bi-bars${o.cls ? ' ' + o.cls : ''}">${lista.map(([nome, v]) => `
        <div class="bi-bar" title="${nome}: ${fmt(v)}">
            <span class="bi-bar__nome">${nome}</span>
            <span class="bi-bar__trilho"><i style="width:${Math.max(2, v / max * 100)}%"></i><em>${fmt(v)}</em></span>
        </div>`).join('')}</div>`;
}

function biEmpilhado(lista) {
    const max = Math.max(...lista.map(l => l[1] + l[2] + l[3]));
    return `<div class="bi-bars bi-bars--stack">${lista.map(([nome, a, b, c]) => `
        <div class="bi-bar" title="${nome}: ${a} (30d) · ${b} (60d) · ${c} (90d)">
            <span class="bi-bar__nome">${nome}</span>
            <span class="bi-bar__trilho"><span class="bi-stack" style="width:${(a + b + c) / max * 100}%"><i class="s30" style="flex:${a}">${a}</i><i class="s60" style="flex:${b}">${b}</i><i class="s90" style="flex:${c}">${c}</i></span></span>
        </div>`).join('')}</div>`;
}

function biCard(titulo, corpo, cls) {
    return `<section class="bi-card${cls ? ' ' + cls : ''}"><h6>${titulo}</h6>${corpo}</section>`;
}

function biArvore() {
    const [a, b] = BI_DADOS.departamento.map(([n, v]) => [n, biV(v)]);
    return `<div class="bi-tree">
        <div class="bi-tree__hd">DEPARTAM.</div>
        <div class="bi-tree__body">
            <div class="bi-tree__raiz"><i></i><span>Faturamento Líqui...</span><b>${biReal(a[1] + b[1])}</b></div>
            <svg viewBox="0 0 40 60" aria-hidden="true"><path d="M0 30 C20 30 20 8 40 8 M0 30 C20 30 20 52 40 52" stroke="#d9a520" fill="none" stroke-width="1.5"/></svg>
            <div class="bi-tree__folhas">
                <div><i></i><span>${a[0]}</span><b>${biReal(a[1])}</b></div>
                <div><i></i><span>${b[0]}</span><b>${biReal(b[1])}</b></div>
            </div>
        </div>
    </div>`;
}

function biTabela(cab, linhas, total) {
    return `<div class="bi-tabela"><table><thead><tr>${cab.map(c => `<th>${c}</th>`).join('')}</tr></thead>
        <tbody>${linhas.map(l => `<tr>${l.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>
        ${total ? `<tfoot><tr>${total.map(c => `<td>${c}</td>`).join('')}</tr></tfoot>` : ''}</table></div>`;
}

function biFiltros(extra) {
    const emp = BI_EMPRESAS.map(e => `<option value="${e.id}"${e.id === bi.empresa ? ' selected' : ''}>${e.nome}</option>`).join('');
    return `<div class="bi-filtros">
        <label class="bi-filtro"><span>EMPRESA</span><select onchange="biAcao('empresa', this.value)">${emp}</select></label>
        <div class="bi-datas"><span>01/10/2026</span><span>31/10/2026</span></div>
        ${extra || ''}
    </div>`;
}

function biPaginaGeral() {
    const k = BI_DADOS.kpi;
    const bruto = biV(k.bruto), dev = biV(k.dev), desc = biV(k.desc), liq = bruto - dev, ped = biV(k.pedidos);
    const meses = BI_DADOS.meses.map(([m, l, d]) => [m, biV(l), biV(d)]);
    const maxM = Math.max(...meses.map(m => m[1]));
    return `${biFiltros()}
        <div class="bi-grid bi-grid--geral">
            <section class="bi-card bi-kpi"><h6>FATURAMENTO BRUTO</h6><b>${biReal(bruto)}</b>
                <div class="bi-kpi__cols"><span style="height:100%"><em>FAT</em></span><span style="height:${Math.max(30, dev / bruto * 900)}%" title="Devoluções: ${biReal(dev)}"><em>DEV</em></span><span style="height:${Math.max(22, desc / bruto * 900)}%" title="Descontos: ${biReal(desc)}"><em>DESC</em></span></div></section>
            <section class="bi-card bi-kpi"><h6>FATURAMENTO LÍQUIDO</h6><b>${biReal(liq)}</b><small>Bruto − devoluções</small></section>
            <section class="bi-card bi-kpi"><h6>TICKET MÉDIO</h6><b>${biReal(liq / ped)}</b><h6>NÚMERO DE PEDIDOS</h6><b>${biNum(ped)}</b></section>
            ${biCard('Faturamento Por Departamento', biArvore())}
            ${biCard('Faturamento Por Vendedor', biBarras(BI_DADOS.vendedores.map(v => [v[0], biV(v[1] - v[2])]), biMil))}
            ${biCard('Faturamento Por Tabela de preço', biBarras(BI_DADOS.tabelaPreco.map(([n, v]) => [n, biV(v)]), biMil))}
            ${biCard('Faturamento X Devol. e Trocas por Mês', `<p class="bi-legenda"><i class="l1"></i>Faturamento Líquido <i class="l2"></i>Vl. Devoluções e Trocas</p>
                <div class="bi-colunas">${meses.map(([m, l, d]) => `<div title="${m}: ${biMil(l)} · devoluções ${biReal(d)}"><span class="c1" style="height:${l / maxM * 100}%"><em>${biMil(l)}</em></span><span class="c2" style="height:${Math.max(3, d / maxM * 100 * 6)}%"></span><small>${m}</small></div>`).join('')}</div>`, 'bi-span2')}
            ${biCard('Faturamento Por Ramo de Atividade', biBarras(BI_DADOS.ramo.map(([n, v]) => [n, biV(v)]), biMil))}
        </div>`;
}

function biPaginaVendedor() {
    let t = [0, 0, 0, 0, 0, 0, 0];
    const linhas = BI_DADOS.vendedores.map(([n, br, dv, bo, ant, pe, cl]) => {
        const [b, d, bon, a, p, c] = [br, dv, bo, ant, pe, cl].map(biV);
        const atual = b - d;
        t = [t[0] + b, t[1] + d, t[2] + bon, t[3] + a, t[4] + atual, t[5] + p, t[6] + c];
        const cres = (atual / a - 1) * 100;
        return [n, biReal(b), biReal(d), biNum(d / b * 100, 2), biReal(bon), biReal(a), biReal(atual), `<span class="${cres >= 0 ? 'bi-up' : 'bi-down'}">${cres >= 0 ? '▲' : '▼'} ${biPct(cres)}</span>`, p, biReal(atual / p), c];
    });
    const cresT = (t[4] / t[3] - 1) * 100;
    const total = ['Total', biReal(t[0]), biReal(t[1]), biNum(t[1] / t[0] * 100, 2), biReal(t[2]), biReal(t[3]), biReal(t[4]), biPct(cresT), t[5], biReal(t[4] / t[5]), t[6]];
    return `${biFiltros()}
        <div class="bi-grid bi-grid--vendedor">
            ${biCard('DETALHAMENTO POR SUPERVISOR/VENDEDOR', biTabela(['VENDEDOR', 'FATURAMENTO BRUTO', 'VL. TOT. DEVOLUÇÕES', '% DEVOLUÇÃO', 'TOT. BONIFICAÇÃO', 'FAT. LÍQUIDO MÊS ANTERIOR', 'FAT. LÍQUIDO MÊS ATUAL', '% CRES. FATURAMENTO', 'NUM. PEDIDOS', 'VL. TICKET MÉDIO', 'QTDE. CLIENTE'], linhas, total), 'bi-span3 bi-card--tabela')}
            ${biCard('Faturamento Por Departamento', biArvore())}
            ${biCard('Faturamento Líquido Por Região', biBarras(BI_DADOS.regiao.map(([n, v]) => [n, biV(v)]), biMil))}
            ${biCard('Faturamento Por Tabela de preço', biBarras(BI_DADOS.tabelaPreco.map(([n, v]) => [n, biV(v)]), biMil))}
        </div>`;
}

function biPaginaCliente() {
    const deptos = ['TODOS', 'AURORA', 'REVENDA'];
    const sel = `<label class="bi-filtro"><span>DEPARTAMENTO</span><select onchange="biAcao('depto', this.value)">${deptos.map(d => `<option${d === bi.depto ? ' selected' : ''}>${d}</option>`).join('')}</select></label>`;
    const lista = BI_DADOS.clientes.filter(c => bi.depto === 'TODOS' || c[1] === bi.depto);
    let t = [0, 0, 0, 0, 0];
    const linhas = lista.map(([n, , br, dv, mix, pe, peso]) => {
        const [b, d, p] = [br, dv, pe].map(biV);
        const kg = peso * BI_EMPRESAS.find(e => e.id === bi.empresa).f;
        t = [t[0] + b, t[1] + d, t[2] + p, t[3] + kg, t[4] + mix];
        return [n, biReal(b), biReal(d), biReal(b - d), biReal((b - d) / p), mix, p, biNum(kg, 2)];
    });
    const total = ['Total', biReal(t[0]), biReal(t[1]), biReal(t[0] - t[1]), biReal((t[0] - t[1]) / t[2]), '', t[2], biNum(t[3], 2)];
    const top = lista.map(c => [c[0], biV(c[2]) - biV(c[3])]).sort((a, b) => b[1] - a[1]).slice(0, 10);
    return `${biFiltros(sel)}
        <button type="button" class="bi-ir" onclick="biAcao('pagina','frequencia')">IR P/..</button>
        <div class="bi-grid bi-grid--cliente">
            ${biCard('', biTabela(['NOME FANTASIA', 'FATURAMENTO BRUTO', 'VL. TOT. DEVOLUÇÕES', 'FATURAMENTO LÍQUIDO', 'VL. TICKET MÉDIO', 'MIX PRODUTOS', 'NUM. PEDIDOS', 'TOT. PESO BRUTO'], linhas, total), 'bi-span3 bi-card--tabela bi-card--sem-titulo')}
            ${biCard('Top 10 Faturamento X Cliente', biBarras(top, biMil, { cls: 'bi-bars--mini' }))}
            ${biCard('Novos Clientes Atendidos', biBarras(BI_DADOS.novosAtendidos.map(([n, v]) => [n, Math.max(1, biV(v))]), v => v))}
            ${biCard('Novos Cadastros', biBarras(BI_DADOS.novosCadastros.map(([n, v]) => [n, Math.max(1, biV(v))]), v => v))}
        </div>`;
}

function biPaginaProduto() {
    const linhas = BI_DADOS.produtos.map(([n, q, pe, mix, nao, fat]) => [n, biNum(biV(q), 2), biV(pe), biV(mix), biV(nao), biReal(biV(fat))]);
    return `${biFiltros()}
        <div class="bi-grid bi-grid--produto">
            ${biCard('DETALHAMENTO POR PRODUTO', biTabela(['NOME', 'QT. TOT. VENDIDA', 'QTD. PEDIDOS', 'MIX CLIENTES', 'CLIENTES QUE NÃO COMPRARAM', 'FATURAMENTO LÍQUIDO'], linhas), 'bi-span3 bi-card--tabela')}
            ${biCard('Faturamento Por Departamento', biArvore())}
            ${biCard('Faturamento Líquido Por Região', biBarras(BI_DADOS.regiao.map(([n, v]) => [n, biV(v)]), biMil))}
            ${biCard('Top 10 Faturamento X Vendedor', biBarras(BI_DADOS.vendedores.map(v => [v[0], biV(v[1] - v[2])]), biMil))}
        </div>`;
}

function biPaginaFrequencia() {
    const esc = l => l.map(([n, a, b, c]) => [n, biV(a), biV(b), biV(c)]);
    const leg = '<p class="bi-legenda"><i class="s30"></i>ClientesSemCompra30d <i class="s60"></i>ClientesSemCompra60d <i class="s90"></i>ClientesSemCompra90d</p>';
    return `<button type="button" class="bi-ir" onclick="biAcao('pagina','cadastros')">IR P/..</button>
        <div class="bi-grid bi-grid--duas">
            ${biCard('Clientes sem compra Por Região', leg + biEmpilhado(esc(BI_DADOS.semCompraRegiao)))}
            ${biCard('Clientes sem compra por Vendedor', leg + biEmpilhado(esc(BI_DADOS.semCompraVendedor)))}
        </div>`;
}

function biPaginaCadastros() {
    const reg = BI_DADOS.cadastrosRegiao.map(([n, v]) => [n, biV(v)]);
    const total = reg.reduce((s, r) => s + r[1], 0);
    return `<div class="bi-grid bi-grid--cad">
            ${biCard('Clientes Geral', biBarras([['', total]], v => biNum(v), { cls: 'bi-bars--geral' }), 'bi-card--geral')}
            ${biCard('Clientes por Região', biBarras(reg, v => biNum(v)))}
            ${biCard('Clientes por Vendedor', biBarras(BI_DADOS.cadastrosVendedor.map(([n, v]) => [n, biV(v)]), v => biNum(v)))}
        </div>`;
}

function biRender() {
    const el = document.getElementById('bi');
    if (!el || !bi) return;
    const paginas = { geral: biPaginaGeral, vendedor: biPaginaVendedor, cliente: biPaginaCliente, produto: biPaginaProduto, frequencia: biPaginaFrequencia, cadastros: biPaginaCadastros };
    const lado = [['inicio', 'house', 'Início'], ['geral', 'chart-column', 'Geral'], ['vendedor', 'clipboard-list', 'Vendedor'], ['cliente', 'user-round', 'Cliente'], ['produto', 'chart-pie', 'Produto']]
        .map(([p, ic, t]) => `<button type="button" class="${bi.pagina === p ? 'is-on' : ''}" onclick="biAcao('pagina','${p}')" title="${t}" aria-label="${t}"><i data-lucide="${ic}"></i></button>`).join('');
    const voltar = { frequencia: 'cliente', cadastros: 'frequencia' }[bi.pagina];
    let conteudo;
    if (bi.pagina === 'inicio') {
        conteudo = `<div class="bi-capa">
            <h3>DASHBOARD COMERCIAL</h3>
            <div class="bi-marca"><i data-lucide="sun"></i><b>Aurora</b><span>· DISTRIBUIDORA ·</span></div>
            <button type="button" class="bi-iniciar" onclick="biAcao('pagina','geral')">INICIAR</button>
        </div>`;
    } else {
        conteudo = `<header class="bi-topo">${voltar ? `<button type="button" class="bi-voltar" onclick="biAcao('pagina','${voltar}')" aria-label="Voltar"><i data-lucide="circle-arrow-left"></i></button>` : ''}<h3>DASHBOARD COMERCIAL</h3></header>
            <div class="bi-pagina">${paginas[bi.pagina]()}</div>`;
    }
    const abas = BI_PAGINAS.map(([p, t]) => `<button type="button" class="${bi.pagina === p ? 'is-on' : ''}" onclick="biAcao('pagina','${p}')">${t}</button>`).join('');
    el.innerHTML = `
        <div class="bi-relatorio">
            <aside class="bi-lado"><span class="bi-sn">SN</span>${lado}<button type="button" class="bi-refresh" onclick="biAcao('atualizar')" title="Atualizar" aria-label="Atualizar"><i data-lucide="rotate-cw"></i></button></aside>
            <div class="bi-main">${conteudo}</div>
        </div>
        <nav class="bi-abas">${abas}<span>Página ${BI_PAGINAS.findIndex(p => p[0] === bi.pagina) + 1} de ${BI_PAGINAS.length}</span></nav>`;
    lucide.createIcons();
}

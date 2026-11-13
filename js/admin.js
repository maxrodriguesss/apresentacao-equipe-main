// Admin da equipe: edita data/equipe.json direto no GitHub (sem servidor).
// As gravações usam a API de conteúdo do GitHub com um token do próprio usuário,
// e o GitHub Pages publica a nova versão sozinho.

// ── Configuração do repositório ──────────────────────────────────────
// No GitHub Pages (usuario.github.io/repositorio) o dono e o repositório
// saem da própria URL; fora dele, usa os valores abaixo.
const REPO_PADRAO = { dono: 'maxrodriguesss', repo: 'apresentacao-equipe-main' };
const BRANCH = 'main';
const ARQUIVO_DADOS = 'data/equipe.json';
const PASTA_FOTOS = 'assets/img';
const CHAVE_TOKEN = 'admin-equipe-token';

const REPO = (() => {
    const host = location.hostname;
    const primeiroDir = location.pathname.split('/').filter(Boolean)[0];
    if (host.endsWith('.github.io') && primeiroDir && !primeiroDir.endsWith('.html')) {
        return { dono: host.replace('.github.io', ''), repo: primeiroDir };
    }
    return REPO_PADRAO;
})();

const FOTO_VAZIA = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" fill="#E6EBF1"/>' +
    '<circle cx="60" cy="46" r="22" fill="#B5C2D1"/><path d="M20 112c6-26 24-38 40-38s34 12 40 38" fill="#B5C2D1"/></svg>'
);

// ── Estado ───────────────────────────────────────────────────────────
let token = lerToken();
let shaDados = null;          // sha atual do equipe.json no GitHub (evita sobrescrever edição de outra pessoa)
let colaboradores = [];       // lista editável
let salvoComoTexto = '';      // snapshot do último estado salvo, para saber se há mudanças
let salvando = false;

// ── Elementos ────────────────────────────────────────────────────────
const $ = (sel) => document.querySelector(sel);
const telaLogin = $('#tela-login');
const telaEditor = $('#tela-editor');
const carregando = $('#carregando');
const lista = $('#lista');
const status = $('#status');
const btnSalvar = $('#btn-salvar');
const modelo = $('#modelo-colaborador');

$('#nome-repo').textContent = `${REPO.dono}/${REPO.repo}`;

// ── Utilidades ───────────────────────────────────────────────────────
function lerToken() {
    try { return localStorage.getItem(CHAVE_TOKEN) || ''; } catch { return ''; }
}

function gravarToken(valor) {
    try {
        if (valor) localStorage.setItem(CHAVE_TOKEN, valor);
        else localStorage.removeItem(CHAVE_TOKEN);
    } catch { /* navegador sem armazenamento: o token vale só nesta aba */ }
}

function bytesParaBase64(bytes) {
    let binario = '';
    for (let i = 0; i < bytes.length; i += 0x8000) {
        binario += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    }
    return btoa(binario);
}

function textoParaBase64(texto) {
    return bytesParaBase64(new TextEncoder().encode(texto));
}

function base64ParaTexto(b64) {
    const binario = atob(b64.replace(/\s/g, ''));
    const bytes = Uint8Array.from(binario, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
}

function slug(texto) {
    return (texto || 'colaborador')
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
        .slice(0, 40) || 'colaborador';
}

function definirStatus(texto, tipo = '') {
    status.textContent = texto;
    status.className = 'status' + (tipo ? ' ' + tipo : '');
}

// Só o que vai para o JSON (sem arquivos de foto pendentes nem URLs de prévia)
function dadosParaSalvar() {
    return {
        colaboradores: colaboradores.map((c) => ({
            nome: c.nome.trim(),
            cargo: c.cargo.trim(),
            atividades: c.atividades,
            foto: c.foto,
            ativo: c.ativo,
        })),
    };
}

function haMudancas() {
    return colaboradores.some((c) => c.arquivoFoto) ||
        JSON.stringify(dadosParaSalvar()) !== salvoComoTexto;
}

function atualizarEstadoSalvar() {
    const pendente = haMudancas();
    btnSalvar.disabled = salvando || !pendente;
    if (!salvando) {
        if (pendente) definirStatus('Alterações não salvas', 'pendente');
        else if (status.classList.contains('pendente')) definirStatus('');
    }
}

// ── API do GitHub ────────────────────────────────────────────────────
async function github(caminho, opcoes = {}) {
    const resp = await fetch(`https://api.github.com/repos/${REPO.dono}/${REPO.repo}${caminho}`, {
        ...opcoes,
        headers: {
            Accept: 'application/vnd.github+json',
            Authorization: `Bearer ${token}`,
            'X-GitHub-Api-Version': '2022-11-28',
            ...(opcoes.body ? { 'Content-Type': 'application/json' } : {}),
        },
        cache: 'no-store',
    });
    if (!resp.ok) {
        let detalhe = '';
        try { detalhe = (await resp.json()).message || ''; } catch { /* sem corpo */ }
        const erro = new Error(detalhe || `HTTP ${resp.status}`);
        erro.status = resp.status;
        throw erro;
    }
    return resp.json();
}

function mensagemDeErro(erro) {
    if (erro.status === 401) return 'Token inválido ou expirado. Entre de novo com um token válido.';
    if (erro.status === 403) return 'O token não tem permissão de escrita (Contents: Read and write) neste repositório.';
    if (erro.status === 404) return 'Repositório ou arquivo não encontrado para este token.';
    if (erro.status === 409 || erro.status === 422) {
        return 'Os dados foram alterados por outra pessoa enquanto você editava. Recarregue a página e refaça as alterações.';
    }
    if (erro instanceof TypeError) return 'Sem conexão com o GitHub. Verifique a internet e tente de novo.';
    return `Erro do GitHub: ${erro.message}`;
}

async function carregarDados() {
    const arquivo = await github(`/contents/${ARQUIVO_DADOS}?ref=${BRANCH}`);
    shaDados = arquivo.sha;
    const dados = JSON.parse(base64ParaTexto(arquivo.content));
    colaboradores = (dados.colaboradores || []).map((c) => ({
        nome: c.nome || '',
        cargo: c.cargo || '',
        atividades: Array.isArray(c.atividades) ? [...c.atividades] : [],
        foto: c.foto || '',
        ativo: c.ativo !== false,
        arquivoFoto: null,
        previaFoto: null,
    }));
    salvoComoTexto = JSON.stringify(dadosParaSalvar());
}

// Reduz a foto para no máximo 1200px e JPEG, para o site continuar leve
async function prepararFoto(arquivo) {
    const imagem = await createImageBitmap(arquivo);
    const escala = Math.min(1, 1200 / Math.max(imagem.width, imagem.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(imagem.width * escala);
    canvas.height = Math.round(imagem.height * escala);
    canvas.getContext('2d').drawImage(imagem, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((ok) => canvas.toBlob(ok, 'image/jpeg', 0.88));
    return new Uint8Array(await blob.arrayBuffer());
}

// ── Tela ─────────────────────────────────────────────────────────────
function mostrar(tela) {
    carregando.hidden = tela !== 'carregando';
    telaLogin.hidden = tela !== 'login';
    telaEditor.hidden = tela !== 'editor';
    $('#acoes-sessao').hidden = tela !== 'editor';
}

function urlDaFoto(c) {
    if (c.previaFoto) return c.previaFoto;
    if (!c.foto) return FOTO_VAZIA;
    return c.foto;
}

function renderizar() {
    lista.innerHTML = '';
    colaboradores.forEach((c, indice) => lista.appendChild(criarItem(c, indice)));
    atualizarEstadoSalvar();
}

function renderizarChips(container, c) {
    container.innerHTML = '';
    c.atividades.forEach((atividade, i) => {
        const chip = document.createElement('span');
        chip.className = 'chip';
        chip.textContent = atividade;
        const remover = document.createElement('button');
        remover.type = 'button';
        remover.textContent = '×';
        remover.title = `Remover "${atividade}"`;
        remover.setAttribute('aria-label', `Remover ${atividade}`);
        remover.onclick = () => {
            c.atividades.splice(i, 1);
            renderizarChips(container, c);
            atualizarEstadoSalvar();
        };
        chip.appendChild(remover);
        container.appendChild(chip);
    });
}

function criarItem(c, indice) {
    const item = modelo.content.firstElementChild.cloneNode(true);
    item.classList.toggle('oculto', !c.ativo);

    const img = item.querySelector('.colab-foto img');
    img.src = urlDaFoto(c);
    img.alt = c.nome ? `Foto de ${c.nome}` : 'Sem foto';
    // Foto recém-enviada pode ainda não estar publicada no Pages: busca direto do repositório
    img.onerror = () => {
        if (c.foto && !img.dataset.tentouRaw) {
            img.dataset.tentouRaw = '1';
            img.src = `https://raw.githubusercontent.com/${REPO.dono}/${REPO.repo}/${BRANCH}/${c.foto}`;
        } else {
            img.onerror = null;
            img.src = FOTO_VAZIA;
        }
    };

    item.querySelector('.campo-foto').onchange = (e) => {
        const arquivo = e.target.files[0];
        if (!arquivo) return;
        if (c.previaFoto) URL.revokeObjectURL(c.previaFoto);
        c.arquivoFoto = arquivo;
        c.previaFoto = URL.createObjectURL(arquivo);
        img.src = c.previaFoto;
        atualizarEstadoSalvar();
    };

    const nome = item.querySelector('.campo-nome');
    nome.value = c.nome;
    nome.oninput = () => { c.nome = nome.value; atualizarEstadoSalvar(); };

    const cargo = item.querySelector('.campo-cargo');
    cargo.value = c.cargo;
    cargo.oninput = () => { c.cargo = cargo.value; atualizarEstadoSalvar(); };

    const chips = item.querySelector('.chips');
    renderizarChips(chips, c);

    const campoAtividade = item.querySelector('.campo-atividade');
    const adicionarAtividade = () => {
        const texto = campoAtividade.value.trim().toUpperCase();
        if (!texto) return;
        if (!c.atividades.includes(texto)) c.atividades.push(texto);
        campoAtividade.value = '';
        renderizarChips(chips, c);
        atualizarEstadoSalvar();
        campoAtividade.focus();
    };
    campoAtividade.onkeydown = (e) => {
        if (e.key === 'Enter') { e.preventDefault(); adicionarAtividade(); }
    };
    item.querySelector('.btn-add-atividade').onclick = adicionarAtividade;

    const ativo = item.querySelector('.campo-ativo');
    ativo.checked = c.ativo;
    ativo.onchange = () => {
        c.ativo = ativo.checked;
        item.classList.toggle('oculto', !c.ativo);
        atualizarEstadoSalvar();
    };

    const subir = item.querySelector('.btn-subir');
    const descer = item.querySelector('.btn-descer');
    subir.disabled = indice === 0;
    descer.disabled = indice === colaboradores.length - 1;
    subir.onclick = () => mover(indice, -1);
    descer.onclick = () => mover(indice, +1);

    item.querySelector('.btn-remover').onclick = () => {
        const quem = c.nome.trim() || 'este colaborador';
        if (!confirm(`Excluir ${quem}? Para só tirar da TV, desmarque "Na TV".`)) return;
        colaboradores.splice(indice, 1);
        renderizar();
    };

    return item;
}

function mover(indice, direcao) {
    const destino = indice + direcao;
    if (destino < 0 || destino >= colaboradores.length) return;
    [colaboradores[indice], colaboradores[destino]] = [colaboradores[destino], colaboradores[indice]];
    renderizar();
}

// ── Ações ────────────────────────────────────────────────────────────
$('#btn-adicionar').onclick = () => {
    colaboradores.push({
        nome: '', cargo: '', atividades: [], foto: '', ativo: true, arquivoFoto: null, previaFoto: null,
    });
    renderizar();
    const ultimo = lista.lastElementChild;
    ultimo.scrollIntoView({ behavior: 'smooth', block: 'center' });
    ultimo.querySelector('.campo-nome').focus();
};

function validar() {
    for (const c of colaboradores) {
        if (!c.nome.trim()) return 'Há um colaborador sem nome.';
        if (c.ativo && !c.foto && !c.arquivoFoto) return `${c.nome.trim()} está na TV mas não tem foto.`;
    }
    return null;
}

btnSalvar.onclick = async () => {
    const problema = validar();
    if (problema) { definirStatus(problema, 'erro'); return; }

    salvando = true;
    btnSalvar.disabled = true;
    try {
        // 1) Envia as fotos novas
        const comFotoNova = colaboradores.filter((c) => c.arquivoFoto);
        for (const [i, c] of comFotoNova.entries()) {
            definirStatus(`Enviando foto ${i + 1} de ${comFotoNova.length}…`);
            const bytes = await prepararFoto(c.arquivoFoto);
            const caminho = `${PASTA_FOTOS}/${slug(c.nome)}-${Date.now()}.jpg`;
            await github(`/contents/${caminho}`, {
                method: 'PUT',
                body: JSON.stringify({
                    message: `Admin: nova foto de ${c.nome.trim()}`,
                    content: bytesParaBase64(bytes),
                    branch: BRANCH,
                }),
            });
            c.foto = caminho;
            c.arquivoFoto = null; // já enviada; a prévia local continua aparecendo
        }

        // 2) Grava os dados
        definirStatus('Salvando dados…');
        const texto = JSON.stringify(dadosParaSalvar(), null, 2) + '\n';
        const resposta = await github(`/contents/${ARQUIVO_DADOS}`, {
            method: 'PUT',
            body: JSON.stringify({
                message: 'Admin: atualiza dados da equipe',
                content: textoParaBase64(texto),
                sha: shaDados,
                branch: BRANCH,
            }),
        });
        shaDados = resposta.content.sha;
        salvoComoTexto = JSON.stringify(dadosParaSalvar());
        definirStatus('Salvo! O site atualiza em cerca de 1 minuto.', 'ok');
    } catch (erro) {
        console.error(erro);
        definirStatus(mensagemDeErro(erro), 'erro');
        if (erro.status === 401) gravarToken('');
    } finally {
        salvando = false;
        atualizarEstadoSalvar();
    }
};

$('#form-login').onsubmit = async (e) => {
    e.preventDefault();
    const erroLogin = $('#erro-login');
    erroLogin.hidden = true;
    token = $('#campo-token').value.trim();
    mostrar('carregando');
    try {
        await carregarDados();
        gravarToken(token);
        $('#campo-token').value = '';
        mostrar('editor');
        renderizar();
    } catch (erro) {
        token = '';
        erroLogin.textContent = mensagemDeErro(erro);
        erroLogin.hidden = false;
        mostrar('login');
    }
};

$('#btn-sair').onclick = () => {
    if (haMudancas() && !confirm('Há alterações não salvas. Sair mesmo assim?')) return;
    gravarToken('');
    token = '';
    colaboradores = [];
    salvoComoTexto = '';
    definirStatus('');
    mostrar('login');
};

window.addEventListener('beforeunload', (e) => {
    if (haMudancas()) { e.preventDefault(); e.returnValue = ''; }
});

// ── Início ───────────────────────────────────────────────────────────
(async () => {
    if (!token) { mostrar('login'); return; }
    mostrar('carregando');
    try {
        await carregarDados();
        mostrar('editor');
        renderizar();
    } catch (erro) {
        const erroLogin = $('#erro-login');
        erroLogin.textContent = mensagemDeErro(erro);
        erroLogin.hidden = false;
        if (erro.status === 401) gravarToken('');
        mostrar('login');
    }
})();

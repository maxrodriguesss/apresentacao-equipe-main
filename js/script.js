let wakeLock = null;
 
async function requestWakeLock() {
    if (!("wakeLock" in navigator)) return;
    try {
        wakeLock = await navigator.wakeLock.request("screen");
        wakeLock.addEventListener("release", () => requestWakeLock());
    } catch (err) {}
}
 
document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") requestWakeLock();
});
 
requestWakeLock();

// ── Dados da equipe ──────────────────────────────────────────────
async function carregarEquipe() {
    try {
        // no-store: a TV sempre pega a versão mais recente salva pelo admin
        const resp = await fetch('data/equipe.json', { cache: 'no-store' });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const texto = await resp.text();
        equipeCarregada = texto;
        return JSON.parse(texto).colaboradores || [];
    } catch (err) {
        console.error('Não foi possível carregar data/equipe.json:', err);
        return [];
    }
}

// A cada 2 minutos confere se o admin salvou alterações; se sim, recarrega a TV
let equipeCarregada = null;
setInterval(async () => {
    try {
        const resp = await fetch('data/equipe.json', { cache: 'no-store' });
        if (!resp.ok) return;
        const texto = await resp.text();
        if (equipeCarregada !== null && texto !== equipeCarregada) location.reload();
    } catch (err) {}
}, 2 * 60 * 1000);

function escapeHtml(texto) {
    return String(texto ?? '').replace(/[&<>"']/g, ch => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
    ));
}

document.addEventListener('DOMContentLoaded', async () => {
    // Os colaboradores ficam em data/equipe.json (editável pela página admin.html)
    const colaboradores = await carregarEquipe();
    const teamMembers = [
        // Página só com a foto da equipe no fundo (sem card na frente)
        { group: true, name: "Equipe Suporte CCL" },
        ...colaboradores
            .filter(c => c.ativo !== false)
            .map(c => ({ name: c.nome, role: c.cargo, bio: c.atividades || [], image: c.foto })),
    ];

const carousel = document.getElementById('carousel');
    const carouselIndicators = document.getElementById('carousel-indicators');
 
    const total = teamMembers.length;
    let currentIndex = 0;  // índice real (0..total-1)
    let domIndex = total;   // posição no DOM (inclui clones no início = total cards)
    let isTransitioning = false;
    let autoplayInterval;
 
    // ── Criação de card ──────────────────────────────────────────────
    function createMemberCard(member, realIndex) {
        const card = document.createElement('div');
        card.classList.add('team-member-card', 'flex-shrink-0', 'w-full');
        card.dataset.realIndex = realIndex;
 
        if (member.group) {
            card.classList.add('group-card');
            card.setAttribute('aria-label', member.name);
            return card;
        }

        const assignmentsHtml = member.bio
            .map((a, i) => `<span class="assignment-item" style="animation-delay:${50 * i}ms;">${escapeHtml(a)}</span>`)
            .join('');
 
        card.innerHTML = `
            <div class="photo-wrapper">
                <img src="${escapeHtml(member.image)}" class="profile-photo" alt="${escapeHtml(member.name)}">
            </div>
            <h4 class="member-name">${escapeHtml(member.name)}</h4>
            <p class="role-text-color member-role">${escapeHtml(member.role)}</p>
            <div class="assignments-list">${assignmentsHtml}</div>
        `;
        return card;
    }
 
    // ── Indicadores ──────────────────────────────────────────────────
    function buildIndicators() {
        carouselIndicators.innerHTML = '';
        teamMembers.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.classList.add('carousel-indicator');
            if (index === currentIndex) dot.classList.add('active');
            carouselIndicators.appendChild(dot);
        });
    }
 
    // Na página da equipe, esconde os cards e tira o véu azul do fundo
    function updateTeamMode() {
        document.body.classList.toggle('show-team', !!teamMembers[currentIndex].group);
    }

    function updateIndicators() {
        updateTeamMode();
        carouselIndicators.querySelectorAll('.carousel-indicator').forEach((dot, i) => {
            dot.classList.toggle('active', i === currentIndex);
        });
    }
 
    // ── Montar DOM: [clones-fim] [originais] [clones-início] ─────────
    // Estrutura: total clones do fim | total originais | total clones do início
    // domIndex=total aponta para o primeiro original
    function buildCarousel() {
        carousel.innerHTML = '';
 
        // Clones do fim (para permitir scroll infinito para a esquerda)
        for (let i = total - 1; i >= 0; i--) {
            const clone = createMemberCard(teamMembers[i], i);
            clone.classList.add('clone');
            carousel.appendChild(clone);
        }
        // Originais
        teamMembers.forEach((member, i) => {
            const card = createMemberCard(member, i);
            if (i === currentIndex) card.classList.add('active');
            carousel.appendChild(card);
        });
        // Clones do início (para permitir scroll infinito para a direita)
        teamMembers.forEach((member, i) => {
            const clone = createMemberCard(member, i);
            clone.classList.add('clone');
            carousel.appendChild(clone);
        });
 
        domIndex = total + currentIndex;
        positionNow();
        buildIndicators();
        updateTeamMode();
    }
 
    // ── Posicionamento ───────────────────────────────────────────────
    function getCardWidth() {
        return carousel.children[0]?.offsetWidth || 0;
    }
 
    function positionNow() {
        carousel.style.transition = 'none';
        carousel.style.transform = `translateX(${-domIndex * getCardWidth()}px)`;
    }
 
    function positionAnimated() {
        carousel.style.transition = 'transform 1.5s cubic-bezier(0.68, -0.55, 0.27, 1.55)';
        carousel.style.transform = `translateX(${-domIndex * getCardWidth()}px)`;
    }
 
    // ── Chips ────────────────────────────────────────────────────────
    function activateChips() {
        const active = carousel.querySelector('.team-member-card.active');
        if (active) active.querySelector('.assignments-list')?.classList.add('animate-chips');
    }
 
    function setActiveCard() {
        carousel.querySelectorAll('.team-member-card').forEach(card => {
            const ri = parseInt(card.dataset.realIndex);
            const isActive = !card.classList.contains('clone') && ri === currentIndex;
            card.classList.toggle('active', isActive);
            if (!isActive) card.querySelector('.assignments-list')?.classList.remove('animate-chips');
        });
    }
 
    // ── Navegação ────────────────────────────────────────────────────
    function goNext() {
        if (isTransitioning) return;
        isTransitioning = true;
        domIndex++;
        currentIndex = (currentIndex + 1) % total;
        setActiveCard();
        updateIndicators();
        positionAnimated();
    }
 
 
    // ── Salto silencioso ao atingir clone ────────────────────────────
    carousel.addEventListener('transitionend', (e) => {
        if (e.target !== carousel) return;
 
        // Chegou nos clones do fim → salta de volta para os originais
        if (domIndex >= total * 2) {
            domIndex = total + (domIndex - total * 2);
            positionNow();
        }
        // Chegou nos clones do início → salta de volta para os originais
        else if (domIndex < total) {
            domIndex = total + ((domIndex + total) % total);
            positionNow();
        }
 
        activateChips();
        isTransitioning = false;
    });
 
    // ── Autoplay sincronizado com o Papai Noel ───────────────────────
    // O colaborador muda toda vez que o trenó termina de atravessar a tela
    // (fim de cada volta da animação CSS "voarPapaiNoel").
    const papaiNoel = document.getElementById('papai-noel');
 
    function startAutoplay() {
        if (papaiNoel) {
            papaiNoel.addEventListener('animationiteration', goNext);
        } else {
            autoplayInterval = setInterval(goNext, 13000); // reserva, se o GIF não existir
        }
    }
 
 
 
    buildCarousel();
    setTimeout(activateChips, 150);
    startAutoplay();
 
    window.addEventListener('resize', positionNow);
});
 
setInterval(() => {
    window.scrollBy(0, 1);
    window.scrollBy(0, -1);
}, 30000);
 
setInterval(() => {
    const evTouch = new Event("touchstart", { bubbles: true });
    document.dispatchEvent(evTouch);
    const evMouse = new MouseEvent("mousemove", { clientX: 1, clientY: 1, bubbles: true });
    document.dispatchEvent(evMouse);
    const evKey = new KeyboardEvent("keydown", { key: "Shift", bubbles: true });
    document.dispatchEvent(evKey);
}, 45000);
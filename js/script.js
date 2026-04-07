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

document.addEventListener('DOMContentLoaded', () => {
    const teamMembers = [
        {
            name: "Edio Levi da Silva Lopes",
            role: "Analista de Suporte de Sistemas Sênior",
            bio: [
                    "BANCO DE OFERTAS",
                    "FATURAMENTO / EMISSÃO DE CONTRATOS",
                    "FECHAMENTO",
                    "GERENCIAL",
                    "REEMBOLSO",
                    "SUGESTÃO DE MELHORIA",
                    "SUPORTE N3",
                    "TRANSFERENCIAS - MOVIMENTAÇÕES FINANCEIRAS"
            ],
            image: "assets/img/Edio.png",
        },
        {
            name: "Gabrielle Amatte Santos",
            role: "Jovem Aprendiz",
            bio: [
                    "CADASTRO DE APÓLICE",
                    "CHAVE DE REGISTRO",
                    "INSTALAÇÕES EM GERAL",
                    "SMTP",
                    "SUGESTÕES DE MELHORIA",
                    "SUPORTE A CONSULTORES"
            ],
            image: "assets/img/Gabrielle.png",
        },
        {
            name: "Jeannelis Marquez Napoles",
            role: "Analista de Suporte de Sistemas Junior (Expansão Internacional)",
            bio: [
                    "CADASTRO DE APÓLICE",
                    "CHAVE DE REGISTRO",
                    "GERAR RELATÓRIOS",
                    "INSTALAÇÕES EM GERAL",
                    "ORIENTAÇÃO DE ACESSOS",
                    "SMTP",
                    "SUPORTE A CONSULTORES (INTERNACIONAL)"
            ],
            image: "assets/img/Jeannelis.png",
        },
        {
            name: "Maxwell Rodrigues",
            role: "Analista de Suporte de Sistemas Junior",
            bio: [
                    "CADASTRO DE APÓLICE",
                    "CHAVE DE REGISTRO",
                    "CONTRATO DIGITAL",
                    "ERRO BOLETOS",
                    "ERRO PIX DINAMICO E LINK DE PAGAMENTO",
                    "ERROS DEVOLUÇÃO",
                    "HOMOLOGAÇÃO BOLETOS",
                    "HOMOLOGAÇÃO PIX DINAMICO",
                    "MOVIMENTAÇÕES FINANCEIRAS",
                    "NFE EM GERAL",
                    "NFSE EM GERAL",
                    "ROTEIRO DIGITAL",
                    "SANKHYA",
                    "SMTP",
                    "TRANSFERENCIAS ESTOQUE - ERROS DE MOVIMENTAÇÕES"
            ],
            image: "assets/img/Max.png",
        },
        {
            name: "Pablo Ramos",
            role: "Analista de Suporte de Sistemas Junior",
            bio: [
                    "AFASTAMENTO DIGITAL",
                    "CADASTRO DE APÓLICE",
                    "CADASTRO DE EQUIPAMENTOS",
                    "CONTAGEM DIGTAL",
                    "CONTRATO DIGITAL",
                    "ERRO BOLETOS",
                    "ERRO PIX DINAMICO E LINK DE PAGAMENTO",
                    "ERROS DEVOLUÇÃO",
                    "FATURAMENTO / EMISSÃO DE CONTRATOS",
                    "HOMOLOGAÇÃO BOLETOS",
                    "HOMOLOGAÇÃO PIX DINAMICO",
                    "ROTEIRO DIGITAL",
                    "SANKHYA",
                    "SUPORTE A CONSULTORES"
            ],
            image: "assets/img/Pablo.png",
        },
        {
            name: "Teilor Apolinário",
            role: "Analista de Suporte de Sistemas Junior",
            bio: [
                    "AFASTAMENTO DIGITAL",
                    "BANCO DE OFERTAS",
                    "CADASTRO DE APÓLICE",
                    "CONTAGEM DIGITAL",
                    "ERRO RELATORIOS",
                    "ERROS DEVOLUÇÃO",
                    "FECHAMENTO",
                    "GERENCIAL",
                    "NFE EM GERAL",
                    "REEMBOLSO",
            ],
            image: "assets/img/Teilor.png",
        }
    ];

const carousel = document.getElementById('carousel');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
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
 
        const assignmentsHtml = member.bio
            .map((a, i) => `<span class="assignment-item" style="animation-delay:${50 * i}ms;">${a}</span>`)
            .join('');
 
        card.innerHTML = `
            <div class="photo-wrapper">
                <img src="${member.image}" class="profile-photo" alt="${member.name}">
            </div>
            <h4 class="member-name">${member.name}</h4>
            <p class="role-text-color member-role">${member.role}</p>
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
            dot.onclick = () => { jumpTo(index); resetAutoplay(); };
            carouselIndicators.appendChild(dot);
        });
    }
 
    function updateIndicators() {
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
 
    function goPrev() {
        if (isTransitioning) return;
        isTransitioning = true;
        domIndex--;
        currentIndex = (currentIndex - 1 + total) % total;
        setActiveCard();
        updateIndicators();
        positionAnimated();
    }
 
    function jumpTo(index) {
        if (isTransitioning) return;
        isTransitioning = true;
        currentIndex = index;
        domIndex = total + currentIndex;
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
 
    // ── Autoplay ─────────────────────────────────────────────────────
    function startAutoplay() {
        autoplayInterval = setInterval(goNext, 13000);
    }
 
    function resetAutoplay() {
        clearInterval(autoplayInterval);
        startAutoplay();
    }
 
    nextBtn.onclick = () => { goNext(); resetAutoplay(); };
    prevBtn.onclick = () => { goPrev(); resetAutoplay(); };
 
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
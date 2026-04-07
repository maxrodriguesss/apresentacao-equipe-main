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
                "TRANSFERENCIAS - MOVIMENTAÇÕES FINANCEIRAS",
                "GERENCIAL",
                "CADASTRO DE EQUIPAMENTOS",
                "FECHAMENTO",
                "REEMBOLSO",
                "SUGESTÃO DE MELHORIA",
                "SUPORTE N3",
                "FATURAMENTO / EMISSÃO DE CONTRATOS"
            ],
            image: "assets/img/Edio.png",
        },
        {
            name: "Gabrielle Amatte Santos",
            role: "Jovem Aprendiz",
            bio: [
                "SMTP",
                "CHAVE DE REGISTRO",
                "SUPORTE A CONSULTORES",
                "SUGESTÕES DE MELHORIA",
                "INSTALAÇÕES EM GERAL"
            ],
            image: "assets/img/Gabrielle.png",
        },
        {
            name: "Jeannelis Marquez Napoles",
            role: "Analista de Suporte de Sistemas Junior (Expansão Internacional)",
            bio: [
                "SMTP",
                "CHAVE DE REGISTRO",
                "SUPORTE A CONSULTORES",
                "SUGESTÕES DE MELHORIA",
                "INSTALAÇÕES EM GERAL"
            ],
            image: "assets/img/Jeannelis.png",
        },
        {
            name: "Maxwell Rodrigues",
            role: "Analista de Suporte de Sistemas Junior",
            bio: [
                "TRANSFERENCIAS ESTOQUE - ERROS DE MOVIMENTAÇÕES",
                "MOVIMENTAÇÕES FINANCEIRAS",
                "ROTEIRO DIGITAL",
                "CONTRATO DIGITAL",
                "SMTP",
                "SANKHYA",
                "HOMOLOGAÇÃO BOLETOS",
                "ERRO BOLETOS",
                "HOMOLOGAÇÃO PIX DINAMICO",
                "ERRO PIX DINAMICO E LINK DE PAGAMENTO",
                "NFE EM GERAL",
                "ERROS DEVOLUÇÃO",
                "CHAVE DE REGISTRO"
            ],
            image: "assets/img/Max.png",
        },
        {
            name: "Pablo Ramos",
            role: "Analista de Suporte de Sistemas Junior",
            bio: [
                "FATURAMENTO / EMISSÃO DE CONTRATOS",
                "CONTAGEM DIGTAL",
                "ROTEIRO DIGITAL",
                "AFASTAMENTO DIGITAL",
                "CONTRATO DIGITAL",
                "SANKHYA",
                "HOMOLOGAÇÃO BOLETOS",
                "ERRO BOLETOS",
                "HOMOLOGAÇÃO PIX DINAMICO",
                "ERRO PIX DINAMICO E LINK DE PAGAMENTO",
                "CADASTRO DE EQUIPAMENTOS",
                "SUPORTE A CONSULTORES",
                "ERROS DEVOLUÇÃO"
            ],
            image: "assets/img/Pablo.png",
        },
        {
            name: "Teilor Apolinário",
            role: "Analista de Suporte de Sistemas Junior",
            bio: [
                "BANCO DE OFERTAS",
                "GERENCIAL",
                "FECHAMENTO",
                "REEMBOLSO",
                "ERROS DEVOLUÇÃO",
                "NFE EM GERAL",
                "AFASTAMENTO DIGITAL",
                "CONTAGEM DIGITAL",
                "ERRO RELATORIOS"
            ],
            image: "assets/img/Teilor.png",
        }
    ];

    const carousel = document.getElementById('carousel');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const carouselIndicators = document.getElementById('carousel-indicators');

    let currentIndex = 0;
    let autoplayInterval;

    function createMemberCard(member) {
        const card = document.createElement('div');

        card.classList.add('team-member-card', 'flex-shrink-0', 'w-full');

        const assignmentsHtml = member.bio
            .map((assignment, idx) => `<span class="assignment-item" style="animation-delay:${50 * idx}ms;">${assignment}</span>`)
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

    function renderCarousel() {
        const activeBefore = carousel.querySelector('.team-member-card.active');
        if (activeBefore) {
            activeBefore.querySelector('.assignments-list')?.classList.remove('animate-chips');
        }

        carousel.innerHTML = '';
        carouselIndicators.innerHTML = '';

        teamMembers.forEach((member, index) => {
            const card = createMemberCard(member);
            if (index === currentIndex) card.classList.add('active');
            carousel.appendChild(card);

            const indicator = document.createElement('div');
            indicator.classList.add('carousel-indicator');
            if (index === currentIndex) indicator.classList.add('active');
            indicator.onclick = () => { goToSlide(index); resetAutoplay(); };
            carouselIndicators.appendChild(indicator);
        });

        if (carousel.children.length > 0) {
            const cardWidth = carousel.children[0].offsetWidth;
            const offset = (carousel.offsetWidth / 2) - (cardWidth / 2) - (currentIndex * cardWidth);
            carousel.style.transform = `translateX(${offset}px)`;

            carousel.addEventListener('transitionend', function handler(e) {
                if (e.target === carousel) {
                    const activeCard = carousel.querySelector('.team-member-card.active');
                    activeCard.querySelector('.assignments-list')?.classList.add('animate-chips');
                    carousel.removeEventListener('transitionend', handler);
                }
            }, { once: true });
        }
    }

    function goToSlide(index) {
        currentIndex = (index + teamMembers.length) % teamMembers.length;
        renderCarousel();
    }

    function showNextSlide() {
        goToSlide(currentIndex + 1);
    }

    function showPrevSlide() {
        goToSlide(currentIndex - 1);
    }

    function startAutoplay() {
        autoplayInterval = setInterval(showNextSlide, 13000);
    }

    function resetAutoplay() {
        clearInterval(autoplayInterval);
        startAutoplay();
    }

    nextBtn.onclick = () => { showNextSlide(); resetAutoplay(); };
    prevBtn.onclick = () => { showPrevSlide(); resetAutoplay(); };

    renderCarousel();

    setTimeout(() => {
        const initial = carousel.querySelector('.team-member-card.active');
        initial.querySelector('.assignments-list')?.classList.add('animate-chips');
    }, 100);

    startAutoplay();

    window.addEventListener('resize', () => {
        resetAutoplay();
        renderCarousel();
    });
});

setInterval(() => {
    window.scrollBy(0, 1);
    window.scrollBy(0, -1);
}, 30000);

setInterval(() => {
    const evTouch = new Event("touchstart", { bubbles: true });
    document.dispatchEvent(evTouch);
    const evMouse = new MouseEvent("mousemove", {
        clientX: 1,
        clientY: 1,
        bubbles: true
    });
    document.dispatchEvent(evMouse);
    const evKey = new KeyboardEvent("keydown", { key: "Shift", bubbles: true });
    document.dispatchEvent(evKey);
}, 45000);
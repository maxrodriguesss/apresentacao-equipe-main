// Neve caindo sobre o fundo da página (por trás dos cards)
(function () {
    const canvas = document.getElementById('neve');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let largura, altura, flocos = [];

    function novoFloco(noTopo) {
        const r = Math.random() * 3 + 1;            // raio 1–4px
        return {
            x: Math.random() * largura,
            y: noTopo ? -r * 2 : Math.random() * altura,
            r,
            vy: r * 0.35 + Math.random() * 0.4,     // flocos maiores caem mais rápido
            balanco: Math.random() * Math.PI * 2,
            amplitude: Math.random() * 0.6 + 0.2,
            alpha: Math.random() * 0.5 + 0.5,
        };
    }

    function redimensionar() {
        largura = canvas.width = window.innerWidth;
        altura = canvas.height = window.innerHeight;
        const quantidade = Math.round((largura * altura) / 12000); // ~170 flocos em 1920x1080
        flocos = Array.from({ length: quantidade }, () => novoFloco(false));
    }

    function desenhar() {
        ctx.clearRect(0, 0, largura, altura);
        for (const f of flocos) {
            f.balanco += 0.01;
            f.y += f.vy;
            f.x += Math.sin(f.balanco) * f.amplitude;
            if (f.y > altura + f.r) Object.assign(f, novoFloco(true));
            if (f.x > largura + f.r) f.x = -f.r;
            if (f.x < -f.r) f.x = largura + f.r;

            ctx.beginPath();
            ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${f.alpha})`;
            ctx.fill();
        }
        requestAnimationFrame(desenhar);
    }

    window.addEventListener('resize', redimensionar);
    redimensionar();
    requestAnimationFrame(desenhar);
})();

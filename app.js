if (typeof window !== 'undefined') {
    // Your existing code starts here
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isHashLanding = Boolean(window.location.hash);

    /* ===== LOADER ===== */
    const loader = document.getElementById('loader');
    // ... [KEEP ALL THE REST OF YOUR ORIGINAL CODE HERE] ...

    /* ===== PREMIUM DEPTH INTERACTIONS ===== */
    (() => {
        const cards = [...document.querySelectorAll('.depth-card[data-depth]')];
        if (!cards.length) return;
        const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduce) return;
        cards.forEach((card) => {
            const max = 7;
            card.addEventListener('mousemove', (e) => {
                const r = card.getBoundingClientRect();
                const px = (e.clientX - r.left) / r.width;
                const py = (e.clientY - r.top) / r.height;
                const rx = (0.5 - py) * max;
                const ry = (px - 0.5) * max;
                card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
            });
            card.addEventListener('mouseleave', () => { card.style.transform = ''; });
        });
    })();
}

// Add this at the VERY end to stop Vercel from crashing
if (typeof module !== 'undefined') {
    module.exports = (req, res) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain');
        res.end('Frontend script loaded');
    };
}

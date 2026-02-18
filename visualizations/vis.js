// Straw Hat Crew Bounty
// https://clementbenezech.hashnode.dev/creating-a-bar-chart-component-with-svg-and-javascript
function createBountyChart() {
    const svg = document.getElementById('bounty-chart');
    if (!svg) return;

    const crew = [
        { name: 'Luffy', bounty: 3000000000 },
        { name: 'Zoro', bounty: 1111000000 },
        { name: 'Sanji', bounty: 1032000000 },
        { name: 'Jinbe', bounty: 1100000000 },
        { name: 'Robin', bounty: 930000000 },
        { name: 'Usopp', bounty: 500000000 },
        { name: 'Franky', bounty: 394000000 },
        { name: 'Brook', bounty: 383000000 },
        { name: 'Nami', bounty: 366000000 },
        { name: 'Chopper', bounty: 1000 }
    ];

    const width = 700;
    const height = 450;
    const barHeight = 35;
    const barSpacing = 8;
    const maxBarWidth = 450;
    const leftMargin = 100;
    // https://stackoverflow.com/questions/21255138/how-does-the-math-max-apply-work
    const maxBounty = Math.max(...crew.map(c => c.bounty));

    crew.forEach((member, index) => {
        const y = index * (barHeight + barSpacing) + 20;
        const barWidth = (member.bounty / maxBounty) * maxBarWidth;

        // Create label
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', leftMargin - 10);
        label.setAttribute('y', y + barHeight / 2 + 5);
        label.setAttribute('text-anchor', 'end');
        label.setAttribute('fill', '#333');
        label.setAttribute('font-size', '13');
        label.setAttribute('font-weight', '600');
        label.textContent = member.name;
        svg.appendChild(label);

        // Create bar background
        const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bgRect.setAttribute('x', leftMargin);
        bgRect.setAttribute('y', y);
        bgRect.setAttribute('width', maxBarWidth);
        bgRect.setAttribute('height', barHeight);
        bgRect.setAttribute('fill', '#f0f0f0');
        bgRect.setAttribute('rx', '4');
        svg.appendChild(bgRect);

        // Create animated bar
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', leftMargin);
        rect.setAttribute('y', y);
        rect.setAttribute('width', '0');
        rect.setAttribute('height', barHeight);
        rect.setAttribute('fill', '#D4153D');
        rect.setAttribute('rx', '4');
        svg.appendChild(rect);

        // https://stackoverflow.com/questions/11815207/how-do-i-make-a-bar-chart-in-svg-have-animated-bars-growing-upwards
        // https://css-tricks.com/staggering-animations/
        // Animate bar
        setTimeout(() => {
            rect.setAttribute('width', barWidth);
            rect.style.transition = 'width 1s ease-out';
        }, index * 100);

        // Add bounty text
        const bountyText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        bountyText.setAttribute('x', leftMargin + barWidth + 10);
        bountyText.setAttribute('y', y + barHeight / 2 + 5);
        bountyText.setAttribute('fill', '#666');
        bountyText.setAttribute('font-size', '12');
        
        // Calculate bounty Billion and Million
        let displayBounty;
        if (member.bounty >= 1000000000) {
            displayBounty = (member.bounty / 1000000000).toFixed(1) + 'B';
        } else if (member.bounty >= 1000000) {
            displayBounty = (member.bounty / 1000000).toFixed(0) + 'M';
        } else {
            displayBounty = member.bounty.toLocaleString();
        }
        bountyText.textContent = '฿' + displayBounty;
        
        setTimeout(() => {
            svg.appendChild(bountyText);
        }, index * 100 + 1000);
    });
}

// Creative SVG Art - One Piece X Mark
// https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Basic_Shapes
function createXMarkArt() {
    const svg = document.getElementById('x-mark-art');
    if (!svg) return;

    const centerX = 350;
    const centerY = 200;

    const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line1.setAttribute('x1', centerX - 80);
    line1.setAttribute('y1', centerY - 80);
    line1.setAttribute('x2', centerX + 80);
    line1.setAttribute('y2', centerY + 80);
    line1.setAttribute('stroke', '#000000');
    line1.setAttribute('stroke-width', '25');
    line1.setAttribute('stroke-linecap', 'round');
    svg.appendChild(line1);

    const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line2.setAttribute('x1', centerX + 80);
    line2.setAttribute('y1', centerY - 80);
    line2.setAttribute('x2', centerX - 80);
    line2.setAttribute('y2', centerY + 80);
    line2.setAttribute('stroke', '#000000');
    line2.setAttribute('stroke-width', '25');
    line2.setAttribute('stroke-linecap', 'round');
    svg.appendChild(line2);
}

document.addEventListener('DOMContentLoaded', function() {
    createBountyChart();
    createXMarkArt();
});
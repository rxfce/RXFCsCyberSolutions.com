// SPA navigation: show only the selected section
document.addEventListener('DOMContentLoaded', function () {
    const sections = document.querySelectorAll('main section');
    const navLinks = document.querySelectorAll('nav a');

    function showSection(id) {
        sections.forEach(section => {
            section.style.display = section.id === id ? 'block' : 'none';
        });
    }

    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').replace('#', '');
            showSection(targetId);
            history.replaceState(null, '', '#' + targetId);
        });
    });

    // Show section based on URL hash on load
    const initialId = window.location.hash.replace('#', '') || 'about';
    showSection(initialId);
});

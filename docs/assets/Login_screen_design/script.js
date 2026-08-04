// Vogel Kopfbewegung
document.querySelector('.logo').addEventListener('mouseenter', () => {
    document.querySelector('.logo-bird').style.transform = "rotate(-6deg)";
});

document.querySelector('.logo').addEventListener('mouseleave', () => {
    document.querySelector('.logo-bird').style.transform = "";
});

// Goblin kleine Bewegung
document.querySelector('.goblin').addEventListener('mouseenter', () => {
    document.querySelector('.goblin').style.transform = "translateX(4px)";
});

document.querySelector('.goblin').addEventListener('mouseleave', () => {
    document.querySelector('.goblin').style.transform = "";
});

const root = document.documentElement;
const navigation = document.querySelector(".primary-navigation");
const menuToggle = document.querySelector(".menu-toggle");
const themeToggle = document.querySelector(".theme-toggle");
const themeLabel = document.querySelector(".theme-label");

function setMenuOpen(isOpen) {
	menuToggle.setAttribute("aria-expanded", String(isOpen));
	navigation.classList.toggle("is-open", isOpen);
}

menuToggle.addEventListener("click", () => {
	setMenuOpen(menuToggle.getAttribute("aria-expanded") !== "true");
});

navigation.addEventListener("click", (event) => {
	if (event.target.closest("a")) setMenuOpen(false);
});

document.addEventListener("keydown", (event) => {
	if (event.key === "Escape") setMenuOpen(false);
});

let savedTheme;
try {
	savedTheme = localStorage.getItem("portfolio-theme");
} catch {
	savedTheme = null;
}
const preferredTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

function setTheme(theme) {
	const isDark = theme === "dark";
	root.dataset.theme = isDark ? "dark" : "light";
	themeToggle.setAttribute("aria-pressed", String(isDark));
	themeToggle.setAttribute("aria-label", `Switch to ${isDark ? "light" : "dark"} mode`);
	themeLabel.textContent = isDark ? "Light" : "Dark";
}

setTheme(savedTheme || preferredTheme);
themeToggle.addEventListener("click", () => {
	const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
	try {
		localStorage.setItem("portfolio-theme", nextTheme);
	} catch {
		// Theme changes still apply for this page even when persistence is blocked.
	}
	setTheme(nextTheme);
});

const navigationLinks = [...navigation.querySelectorAll("a[href^='#']")];
const observedSections = navigationLinks
	.map((link) => document.querySelector(link.getAttribute("href")))
	.filter(Boolean);

if ("IntersectionObserver" in window) {
	const sectionVisibility = new Map();
	const sectionObserver = new IntersectionObserver((entries) => {
		entries.forEach((entry) => sectionVisibility.set(entry.target, entry));
		const visibleSections = [...sectionVisibility.values()].filter((entry) => entry.isIntersecting);
		if (!visibleSections.length) return;
		const currentSection = visibleSections.reduce((top, entry) =>
			entry.intersectionRatio > top.intersectionRatio ? entry : top
		);
		navigationLinks.forEach((link) => {
			if (link.hash === `#${currentSection.target.id}`) {
				link.setAttribute("aria-current", "location");
			} else {
				link.removeAttribute("aria-current");
			}
		});
	}, { rootMargin: "-20% 0px -55% 0px", threshold: [0, 0.15, 0.35] });

	observedSections.forEach((section) => sectionObserver.observe(section));
}

const typedText = document.querySelector(".typed-text");
const roles = typedText.dataset.roles.split(",").map((role) => role.trim()).filter(Boolean);
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (roles.length && !reducedMotion) {
	let roleIndex = 0;
	let characterIndex = roles[0].length;
	let deleting = true;

	function typeNextCharacter() {
		const currentRole = roles[roleIndex];
		typedText.textContent = currentRole.slice(0, characterIndex);

		if (deleting) {
			characterIndex -= 1;
			if (characterIndex < 0) {
				deleting = false;
				roleIndex = (roleIndex + 1) % roles.length;
				characterIndex = 0;
				window.setTimeout(typeNextCharacter, 300);
				return;
			}
		} else {
			characterIndex += 1;
			if (characterIndex > roles[roleIndex].length) {
				deleting = true;
				window.setTimeout(typeNextCharacter, 1500);
				return;
			}
		}

		window.setTimeout(typeNextCharacter, deleting ? 55 : 95);
	}

	window.setTimeout(typeNextCharacter, 1800);
}

const contactForm = document.querySelector(".contact-form");
const formFields = [...contactForm.querySelectorAll("input, textarea")];
const formFeedback = contactForm.querySelector(".form-feedback");

function validateField(field) {
	const errorElement = document.getElementById(`${field.id}-error`);
	let message = "";

	if (field.validity.valueMissing) {
		message = "Please fill out this field.";
	} else if (field.validity.typeMismatch) {
		message = "Please enter a valid email address.";
	} else if (field.validity.tooShort) {
		message = `Please enter at least ${field.minLength} characters.`;
	}

	field.setAttribute("aria-invalid", String(Boolean(message)));
	errorElement.textContent = message;
	return !message;
}

formFields.forEach((field) => {
	field.addEventListener("blur", () => validateField(field));
	field.addEventListener("input", () => {
		if (field.hasAttribute("aria-invalid")) validateField(field);
		formFeedback.textContent = "";
	});
});

contactForm.addEventListener("submit", (event) => {
	event.preventDefault();
	const isValid = formFields.map(validateField).every(Boolean);

	if (!isValid) {
		formFeedback.textContent = "Please check the highlighted fields.";
		contactForm.querySelector('[aria-invalid="true"]').focus();
		return;
	}

	formFeedback.textContent = "Your details look good. This demo form is not connected to a mail service yet.";
	contactForm.reset();
	formFields.forEach((field) => field.removeAttribute("aria-invalid"));
});

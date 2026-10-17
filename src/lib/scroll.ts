export function scrollToSection(id: string) {
 const section = document.getElementById(id);
 section?.scrollIntoView({behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start"});
 const heading=section?.querySelector<HTMLElement>("h2");
 heading?.setAttribute("tabindex","-1"); heading?.focus({preventScroll:true});
}

// Models sometimes write a page anchor as a full address on this site (sultalfaifi.com/#skills,
// https://www.sultalfaifi.com/ar/#about, /#skills). The Worker's citation check and the console renderer
// both read those as the anchor itself; every other href passes through unchanged.
const OWN_PAGE_ANCHOR = /^(?:(?:https?:\/\/)?(?:www\.)?sultalfaifi\.com(?:\/ar)?\/?|\/(?:ar\/)?)(#[\w-]+)$/i;

export const pageAnchor = (href: string) => OWN_PAGE_ANCHOR.exec(href)?.[1] ?? href;

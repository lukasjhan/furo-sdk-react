const CODE_RE = /[?&]code=[^&]+/;
const UID_RE = /[?&]uid=[^&]+/;
const ERROR_RE = /[?&]error=[^&]+/;

export const hasAuthParams = (searchParams = window.location.search) =>
  CODE_RE.test(searchParams) || ERROR_RE.test(searchParams);

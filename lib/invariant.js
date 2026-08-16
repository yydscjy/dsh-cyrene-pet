/**
 * Package-owned invariant companion for `@cyrene/dsh-pet`.
 */
const PACKAGE_NAME = '@cyrene/dsh-pet';

/** Cordis companion plugin name. */
export const name = 'cyrene-pet-invariant';

/** Service required before the companion can reserve package ownership. */
export const inject = ['invariants'];

/** No runtime invariants today. */
const install = () => {};

/**
 * Register this package's invariant companion.
 * @param ctx - Cordis context carrying the invariant service.
 */
export const apply = (ctx) => Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install));

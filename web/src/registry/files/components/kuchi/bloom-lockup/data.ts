/*! Portions Copyright (c) 2026 Sri Nath (snap-cn). MIT License. See THIRD_PARTY_LICENSES. */
/**
 * Measured frame by frame off a screen recording, scaled to a 1920x1080 stage with
 * the logo's first resting place at its centre. Tables hold one sample per 1/30s.
 */

/** Length of the bloom, then of the lockup, in seconds. The join is a hard cut. */
export const BLOOM_SECONDS = 1.825;
export const LOCKUP_SECONDS = 2.063;
/** The last frame holds this long. */
export const HOLD_SECONDS = 0.1;

/** Cards on the bloom board: x, y, width, height. */
export const BLOOM_CARDS = [
  [43.1, -65.8, 226.5, 221.1],
  [310.0, -65.8, 229.2, 347.9],
  [582.4, -65.8, 223.8, 172.6],
  [846.7, -65.8, 229.2, 366.7],
  [1116.3, -65.8, 226.5, 245.4],
  [1653.0, -65.8, 226.5, 226.5],
  [1386.0, 39.3, 226.5, 391.0],
  [579.7, 147.2, 226.5, 391.0],
  [43.1, 195.7, 226.5, 391.0],
  [1653.0, 201.1, 226.5, 142.9],
  [310.0, 322.5, 229.2, 151.0],
  [1653.0, 384.5, 226.5, 124.0],
  [1383.3, 473.5, 229.2, 207.6],
  [310.0, 514.0, 229.2, 199.6],
  [1653.0, 551.7, 229.2, 124.0],
  [579.7, 592.2, 229.2, 453.0],
  [40.4, 629.9, 229.2, 391.0],
  [1113.6, 651.5, 229.2, 391.0],
  [1653.0, 716.2, 229.2, 159.1],
  [1383.3, 721.6, 229.2, 275.1],
  [849.4, 729.7, 223.8, 110.6],
  [310.0, 754.0, 229.2, 183.4],
  [849.4, 880.7, 223.8, 264.3],
  [1653.0, 915.7, 226.5, 229.2],
  [310.0, 977.8, 229.2, 167.2],
  [1383.3, 1037.1, 229.2, 107.9],
  [849.4, 352.2, 223.8, 334.4],
  [1116.3, 220.0, 226.5, 391.0],
] as const;
/** When each bloom card starts, in seconds: a wave leaving the logo. */
export const BLOOM_DELAY = [
  0.669, 0.466, 0.366, 0.271, 0.406, 0.68, 0.388, 0.217, 0.548, 0.58, 0.348,
  0.55, 0.34, 0.34, 0.552, 0.249, 0.577, 0.262, 0.583, 0.411, 0.166, 0.386,
  0.317, 0.58, 0.567, 0.478, 0.071, 0.196,
] as const;
/** How long each bloom card takes to arrive. */
export const BLOOM_FADE = [
  0.239, 0.409, 0.395, 0.334, 0.389, 0.298, 0.42, 0.414, 0.394, 0.42, 0.401,
  0.37, 0.42, 0.412, 0.42, 0.42, 0.385, 0.42, 0.42, 0.384, 0.203, 0.42, 0.391,
  0.42, 0.353, 0.42, 0.124, 0.42,
] as const;
export const BLOOM_ZOOM = [
  0.9847, 0.9848, 0.9848, 0.9849, 0.9849, 0.9849, 0.985, 0.985, 0.9851, 0.9851,
  0.9852, 0.9852, 0.9852, 0.9853, 0.9853, 0.9854, 0.9854, 0.9854, 0.9855,
  0.9855, 0.9856, 0.9856, 0.9856, 0.9857, 0.9857, 0.9858, 0.9858, 0.9858, 0.986,
  0.9863, 0.9865, 0.9867, 0.9868, 0.987, 0.9874, 0.9877, 0.9879, 0.9883, 0.9887,
  0.9892, 0.9897, 0.9903, 0.9909, 0.9916, 0.9922, 0.993, 0.9938, 0.9943, 0.9953,
  0.9962, 0.9972, 0.9981, 0.9993, 1.0003, 1.0014, 1.0016,
] as const;

/** The same grid at 1.33x. */
export const LOCKUP_CARDS = [
  [103.7, -61.8, 302.0, 231.9],
  [457.0, -61.8, 302.0, 172.6],
  [813.0, -61.8, 299.3, 83.6],
  [1160.8, -61.8, 304.7, 563.6],
  [1516.8, -61.8, 302.0, 196.9],
  [1870.0, 56.9, 110.6, 358.7],
  [810.3, 75.7, 302.0, 649.9],
  [457.0, 164.7, 302.0, 275.1],
  [-68.8, 175.5, 121.3, 512.4],
  [1516.8, 186.3, 302.0, 364.0],
  [106.4, 221.4, 299.3, 515.1],
  [1870.0, 472.2, 110.6, 186.1],
  [457.0, 488.3, 302.0, 288.5],
  [1158.1, 545.0, 304.7, 596.0],
  [1514.1, 604.3, 304.7, 229.2],
  [1870.0, 712.2, 110.6, 164.5],
  [-68.8, 741.8, 121.3, 399.1],
  [103.7, 790.4, 302.0, 199.6],
  [807.6, 820.0, 304.7, 218.4],
  [454.3, 828.1, 304.7, 312.8],
  [1516.8, 884.7, 463.8, 256.2],
  [106.4, 1041.1, 299.3, 99.8],
] as const;
/**
 * The wall leaves through a lens, then a flash, then a cut to the bare page. One row
 * per frame from `LENS_FROM` seconds into the lockup. A point `r` radii out shows what
 * sat at `r / sqrt(1 + q r^2)`: the edges stretch and the middle pulls back.
 */
export const LENS_FROM = 0.02;
export const LENS_RADIUS = 960;
export const LENS = [
  0.01313, 0.01484, 0.01758, 0.02186, 0.02722, 0.03385, 0.04192, 0.05143,
  0.06274, 0.07689, 0.09468, 0.11714, 0.14713, 0.19098, 0.25382, 0.34701,
  0.5287, 1.56386,
] as const;
export const LENS_ZOOM = [
  1.0, 0.99627, 0.9925, 0.98863, 0.98457, 0.98025, 0.97571, 0.97095, 0.96603,
  0.96092, 0.95548, 0.94957, 0.94291, 0.93499, 0.92518, 0.91473, 0.89903,
  0.85653,
] as const;
/** The last two rows: channel gain and blur in stage px. */
export const LENS_FLASH = [
  [1.424, 1.491, 1.47, 1.67],
  [1.403, 1.45, 1.437, 1.79],
] as const;

/** The slot under the logo on each board stays empty unless you fill it. */
export const BEHIND_LOGO = { bloom: 26, lockup: 6 } as const;

export const CARD_HALO = { bloom: 12, lockup: 16 } as const;

export const LOGO_FADE = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0.089, 0.204, 0.379, 0.541, 0.737, 0.834, 0.91,
  0.971, 0.981, 0.997, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
] as const;
export const LOGO_SIZE_BLOOM = [
  143.9, 144.3, 145, 145.6, 146.1, 146.8, 147.4, 148, 148.8, 149.4, 150, 150.6,
  151.1, 151.6, 152.2, 152.8, 153.3, 153.5, 154, 154.9, 156, 156.8, 157.3,
  157.6, 157.7, 157.8, 157.8, 157.9, 157.9, 158, 158, 158, 158, 158, 158, 158,
  158.1, 158.1, 158.2, 158.2, 158.3, 158.4, 158.4, 158.3, 158.3, 158.4, 158.4,
  158.5, 158.9, 159.2, 159.6, 160, 160.4, 160.7, 160.8, 160.8,
] as const;
export const LOGO_SIZE_LOCKUP = [
  210.2, 210, 210, 210, 210, 210, 210.1, 210.1, 210, 210, 210, 210, 210.1,
  210.2, 210.4, 210.5, 210.5, 210.6, 210.6, 210.6, 210.6, 210.6, 210.6, 210.6,
  210.7, 210.7, 210.8, 210.8, 210.8, 210.9, 210.9, 211, 211, 211.1, 211.1,
  211.2, 211.3, 211.3, 211.4, 211.4, 211.4, 211.5, 211.6, 211.7, 211.8, 212,
  212.1, 212.3, 212.5, 212.7, 212.9, 213, 213.1, 213.3, 213.4, 213.5, 213.5,
  213.6, 213.6, 213.6, 213.6, 213.6, 213.6,
] as const;
export const LOGO_Y = [
  540.4, 533.2, 516.9, 502.5, 492.3, 485.4, 473.4, 459.9, 452.1, 442, 437.3,
  432.8, 428, 422.9, 418.6, 415.4, 414, 412.3, 411.6, 410.7, 409.9, 409.4,
  409.2, 408.8, 408.6, 408.5, 408.4, 408.4, 408.3, 408.3, 408.3, 408.2, 408.2,
  408.2, 408.2, 408.1, 408.1, 408, 407.9, 407.8, 407.8, 407.8, 407.7, 407.5,
  407.4, 407.3, 407.3, 407.3, 407.1, 407, 406.9, 406.9, 406.9, 406.9, 406.8,
  406.8, 406.7, 406.7, 406.7, 406.7, 406.7, 406.7, 406.7,
] as const;

export const WORDMARK_Y = 653.6;
export const TAGLINE_Y = 715.7;
export const WORDMARK_FADE = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.006, 0.023, 0.161,
  0.291, 0.432, 0.588, 0.676, 0.734, 0.789, 0.821, 0.85, 0.878, 0.898, 0.928,
  0.935, 0.941, 0.946, 0.953, 0.969, 0.973, 0.975, 0.975, 0.976, 0.977, 0.977,
  0.977, 0.979, 0.98, 0.982, 0.983, 0.984, 0.986, 0.987, 0.988, 0.989, 0.99,
  0.992, 0.993, 0.994, 0.995, 0.996, 0.998, 0.999, 1,
] as const;
export const WORDMARK_RISE = [
  17.5, 17.5, 17.5, 17.5, 17.5, 17.5, 17.5, 17.5, 17.5, 17.5, 17.5, 17.5, 17.5,
  17.5, 17.5, 17.5, 17.5, 17.5, 17.5, 17.5, 17.5, 17.5, 17.5, 15.9, 11.7, 9,
  7.4, 5.8, 4.7, 4, 3.1, 2.4, 1.8, 1.3, 0.7, 0.6, 0.6, 0.6, 0.1, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
] as const;
export const TAGLINE_FADE = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.001, 0.06, 0.169, 0.353, 0.474,
  0.596, 0.674, 0.791, 0.853, 0.911, 0.957, 0.975, 0.981, 0.982, 0.986, 0.988,
  0.996, 0.999, 0.999, 0.999, 1, 1, 1,
] as const;
export const TAGLINE_RISE = [
  11.9, 11.9, 11.9, 11.9, 11.9, 11.9, 11.9, 11.9, 11.9, 11.9, 11.9, 11.9, 11.9,
  11.9, 11.9, 11.9, 11.9, 11.9, 11.9, 11.9, 11.9, 11.9, 11.9, 11.9, 11.9, 11.9,
  11.9, 11.9, 11.9, 11.9, 11.9, 11.9, 11.9, 11.9, 11.9, 11.9, 11.9, 11.9, 11.9,
  11.9, 11.9, 11.9, 11.9, 11.9, 9.3, 5.9, 4.5, 2.2, 0.9, 0.2, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0,
] as const;

/** What fills the cards: kuchi showcase art and Unsplash-licensed photographs. */
export const CARD_IMAGES = [
  "https://kuchi-media.kalarislabs.com/components/art/art-11.svg",
  "https://kuchi-media.kalarislabs.com/components/art/art-06.svg",
  "https://kuchi-media.kalarislabs.com/components/art/art-02.svg",
  "https://kuchi-media.kalarislabs.com/components/art/art-11.svg",
  "https://kuchi-media.kalarislabs.com/components/art/art-09.svg",
  "https://kuchi-media.kalarislabs.com/components/art/art-06.svg",
  "https://kuchi-media.kalarislabs.com/components/art/art-10.svg",
  "https://kuchi-media.kalarislabs.com/components/art/art-04.svg",
  "https://kuchi-media.kalarislabs.com/components/art/art-03.svg",
  "https://kuchi-media.kalarislabs.com/components/art/art-10.svg",
  "https://kuchi-media.kalarislabs.com/components/art/art-12.svg",
  "https://kuchi-media.kalarislabs.com/components/art/art-12.svg",
  "https://kuchi-media.kalarislabs.com/components/art/art-08.svg",
  "https://kuchi-media.kalarislabs.com/components/art/art-03.svg",
  "https://kuchi-media.kalarislabs.com/components/art/art-08.svg",
  "https://kuchi-media.kalarislabs.com/components/art/art-08.svg",
  "https://kuchi-media.kalarislabs.com/components/art/art-12.svg",
  "https://kuchi-media.kalarislabs.com/components/art/art-07.svg",
  "https://kuchi-media.kalarislabs.com/components/art/art-05.svg",
  "https://kuchi-media.kalarislabs.com/components/art/art-05.svg",
  "https://kuchi-media.kalarislabs.com/components/art/art-06.svg",
  "https://kuchi-media.kalarislabs.com/components/art/art-05.svg",
  "https://kuchi-media.kalarislabs.com/components/art/art-07.svg",
  "https://kuchi-media.kalarislabs.com/components/art/art-04.svg",
  "https://kuchi-media.kalarislabs.com/components/art/art-12.svg",
  "https://kuchi-media.kalarislabs.com/components/art/art-09.svg",
  "https://kuchi-media.kalarislabs.com/components/art/art-02.svg",
  "https://kuchi-media.kalarislabs.com/components/art/art-10.svg",
] as const;

/** The kuchi mark, outlined. */
export const KUCHI_MARK = {
  width: 723,
  height: 632,
  shapes: [
    "M139.04 0H583.96Q723 0 723 139.04V492.96000000000004Q723 632 583.96 632H139.04Q0 632 0 492.96000000000004V139.04Q0 0 139.04 0Z",
  ],
} as const;

import { createContext } from "react";

/**
 * How many output frames make one authored frame. 1 = no remap; 2 = the 60 fps master,
 * where the film (authored at 30 fps) sees frames 0, 0.5, 1, 1.5, ...
 */
export const RemapContext = createContext(1);

/* Back-compat shim: older compositions import food3d.js and use MG.food.* (now engine/clay3d.js + engine/props/food.js). */
import './clay3d.js';
import { food } from './props/food.js';
window.MG.food = food;
export { food };
export { stage3d, place, fly, orbit } from './clay3d.js';

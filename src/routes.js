import Menu from './Menu.svelte';
import NormalGame from './NormalGame.svelte';
import Calibrate from './Calibrate.svelte';

export const routes = {
    '/': Menu,
    '/game': NormalGame,
    '/calibrate': Calibrate
}
import Menu from './Menu.svelte';
import NormalGame from './NormalGame.svelte';
import Calibrate from './Calibrate.svelte';
import Freestle from './Freestle.svelte';
import Reaction from './Reaction.svelte';

export const routes = {
    '/': Menu,
    '/game': NormalGame,
    '/calibrate': Calibrate,
    '/freestyle': Freestle,
    '/reaction': Reaction,
}